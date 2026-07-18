#!/usr/bin/env node
/**
 * 낭송 표시 맵 생성 — 결정론. RECITES 원본 링크는 불변, "화면에 어떻게 보일지"만 계산한다.
 * 1) 같은 절(verse)이 복수 소스 레코드로 들어온 중복 → 클러스터 병합 (데바나가리→IAST 정규화 유사도)
 *    표시: 원문 1회 + "same verse also attested in {domains}" (신뢰 강화)
 * 2) 만트라 제목이 다른 스텝을 명시하는 오귀속 3건 → 표시 위치 재배치 (대상 스텝 gloss가 낭송을 명시 — 근거 기록)
 * 3) 푸자 노드에 붙은 만트라 → "recited through the puja" 섹션
 * 실행: node scripts/gen-recite-display.mjs → data/kb/recite-display.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Sanscript from "@indic-transliteration/sanscript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, p), "utf8"));
const graph = load("../data/kb/graph.json");
const mantras = load("../data/kb/mantras.json");

// 오귀속 재배치 — 만트라 제목/ID가 스텝명을 명시하고, 대상 스텝 gloss가 "while chanting following Mantra"를 포함
const RELOCATIONS = [
  { id: "mantra:satyanarayan:shri-satyanarayana-achamaniya-mantra", to: "step:satyanarayan:achamana",
    reason: "title names Achamaniya; achamana step gloss says 'while chanting following Mantra'" },
  { id: "mantra:satyanarayan:shri-satyanarayana-pradakshina-mantra", to: "step:satyanarayan:namaskara",
    reason: "title names Pradakshina; namaskara step gloss = 'offer symbolic Pradakshina ... while chanting following Mantra'" },
  { id: "mantra:satyanarayan:shri-satyanarayana-mantra-pushpanjali", to: "step:satyanarayan:mantra-pushpanjali",
    reason: "title names Mantra Pushpanjali; that step exists and its gloss says 'while chanting following Mantra'" },
];

const DEVA = /[ऀ-ॿ]/;
// 정규화: 데바나가리 부분만 IAST로 → 소문자 → 발음 변이 접기(sh→s 등) → a-z만
function normText(id) {
  const raw = mantras[id].text;
  const devOnly = [...raw].filter((ch) => DEVA.test(ch) || ch === " " || ch === "\n").join("");
  const base = DEVA.test(raw) ? Sanscript.t(devOnly, "devanagari", "iast") : raw;
  return base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/sh/g, "s")
    .replace(/chh/g, "c")
    .replace(/ch/g, "c")
    .replace(/w/g, "v")
    .replace(/[^a-z]/g, "");
}

function ratio(a, b) {
  // 문자 트라이그램 자카드 — 길이차·철자 변이에 강함
  const grams = (s) => {
    const set = new Set();
    for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3));
    return set;
  };
  const A = grams(a), B = grams(b);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / Math.min(A.size, B.size); // 짧은 쪽 기준 포함률 (mixed 레코드 대비)
}

// RECITES 수집 + 재배치 적용
const byStep = new Map();
const byPuja = new Map();
for (const l of graph.links) {
  if (l.rel !== "RECITES") continue;
  const relo = RELOCATIONS.find((r) => r.id === l.target);
  const dest = relo ? relo.to : l.source;
  const bucket = dest.startsWith("puja:") ? byPuja : byStep;
  if (!bucket.has(dest)) bucket.set(dest, []);
  bucket.get(dest).push(l.target);
}

// 클러스터링 (그리디)
function cluster(ids) {
  // 0차: 제목 기반 병합 — "X Mantra" vs "X Mantra (transliteration)"은 같은 절의 표기 분리 레코드
  const titleKey = (id) =>
    (mantras[id].title ?? "")
      .toLowerCase()
      .replace(/\s*\((transliterat|romaniz)[a-z]*\)\s*$/i, "")
      .trim();
  const norms = ids.map((id) => normText(id));
  const used = new Array(ids.length).fill(false);
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    if (used[i]) continue;
    const members = [i];
    used[i] = true;
    for (let j = i + 1; j < ids.length; j++) {
      if (used[j]) continue;
      // 제목 동일(표기 접미사 제거 후) → 병합
      if (titleKey(ids[i]) && titleKey(ids[i]) === titleKey(ids[j])) {
        members.push(j);
        used[j] = true;
        continue;
      }
      // 길이비 가드: 짧은 살루테이션이 긴 절의 부분문자열인 경우(namah⊂phala)는 별개 만트라 — 병합 금지
      const lenRatio = Math.min(norms[i].length, norms[j].length) / Math.max(norms[i].length, norms[j].length);
      if (lenRatio >= 0.5 && ratio(norms[i], norms[j]) >= 0.65) {
        members.push(j);
        used[j] = true;
      }
    }
    // primary = 데바나가리 보유 레코드 우선 (원문 표기 + IAST 병기 가능)
    members.sort((a, b) => (DEVA.test(mantras[ids[b]].text) ? 1 : 0) - (DEVA.test(mantras[ids[a]].text) ? 1 : 0));
    out.push({
      primary: ids[members[0]],
      also: members.slice(1).map((k) => ({ id: ids[k], source: mantras[ids[k]].source_domain })),
    });
  }
  return out;
}

const steps = {};
for (const [sid, ids] of byStep) steps[sid] = cluster(ids);
const puja = {};
for (const [pid, ids] of byPuja) puja[pid] = cluster(ids);

const out = {
  note: "display map only — RECITES links in graph.json unchanged; relocations are title-evidence-based, pending review",
  relocations: RELOCATIONS,
  steps,
  puja,
};
fs.writeFileSync(path.join(__dirname, "../data/kb/recite-display.json"), JSON.stringify(out, null, 2) + "\n");

// 요약
let merged = 0;
for (const arr of [...Object.values(steps), ...Object.values(puja)])
  for (const c of arr) merged += c.also.length;
console.log(
  `steps with recitation: ${Object.keys(steps).length}, puja-level sections: ${Object.keys(puja).length}, duplicates merged: ${merged}`
);
for (const [sid, arr] of Object.entries(steps))
  console.log(`  ${sid.split(":").pop()}: ${arr.length} cluster(s)${arr.some((c) => c.also.length) ? " (merged)" : ""}`);
for (const [pid, arr] of Object.entries(puja)) console.log(`  [puja-level] ${pid}: ${arr.length}`);
