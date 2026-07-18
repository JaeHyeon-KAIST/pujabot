#!/usr/bin/env node
/**
 * 이미지 트랙 전달물: App view(practical) 배율의 장면 스펙 입력 생성.
 * 스키마·focus_object 규칙 출처: 이미지생성-조사/17-v2 §1-②.
 * 그룹핑 로직은 lib/kb/graph.ts(UPACHARA_GROUPS·toPracticalSteps)와 동일해야 한다 — 한쪽 수정 시 양쪽 동기화.
 * 실행: node scripts/export-scene-input.mjs  →  이미지생성-조사/scene-input/{puja}.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const graph = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/kb/graph.json"), "utf8"));
const OUT_DIR = path.join(__dirname, "../../이미지생성-조사/scene-input");

const PUJAS = ["puja:satyanarayan", "puja:griha-pravesh"];

const byId = new Map(graph.nodes.map((n) => [n.id, n]));
const outLinks = new Map();
for (const l of graph.links) {
  if (!outLinks.has(l.source)) outLinks.set(l.source, []);
  outLinks.get(l.source).push(l);
}

// === lib/kb/graph.ts 미러 시작 ===
const UPACHARA_GROUPS = [
  { key: "invoke-seat", label: "Invoke & seat the deity", members: ["dhyana", "avahana", "asana"] },
  { key: "offer-water", label: "Offer water", members: ["padya", "arghya", "achamana"] },
  { key: "bathe-adorn", label: "Bathe & adorn the deity", members: ["snana", "vastra", "yajnopavita", "gandha"] },
  { key: "main-offerings", label: "Main offerings — flowers, incense, lamp, food", members: ["pushpa", "dhupa", "dipa", "naivedya", "tambula"] },
  { key: "pradakshina", label: "Pradakshina & namaskara", members: ["namaskara"] },
];

const short = (id) => id.split(":").pop() ?? id;
const pujaShort = (id) => id.split(":")[1] ?? id;

function detailedSteps(pujaId) {
  const out = outLinks.get(pujaId) ?? [];
  return out
    .filter((l) => l.rel === "HAS_STEP")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((l) => {
      const s = byId.get(l.target);
      const mantraLinks = (outLinks.get(s.id) ?? []).filter((m) => m.rel === "RECITES");
      return { ...s, mantra_ids: mantraLinks.map((m) => m.target) };
    });
}

function toPracticalSteps(steps) {
  const practical = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    if (s.bucket !== "upa") {
      practical.push({ id: s.id, label: s.label ?? s.id, gloss: s.gloss, contains: [s] });
      i++;
      continue;
    }
    const grp = UPACHARA_GROUPS.find((g) => g.members.includes(short(s.id)));
    if (!grp) {
      practical.push({ id: s.id, label: s.label ?? s.id, gloss: s.gloss, contains: [s] });
      i++;
      continue;
    }
    const run = [];
    while (i < steps.length && steps[i].bucket === "upa" && grp.members.includes(short(steps[i].id))) {
      run.push(steps[i]);
      i++;
    }
    practical.push({ id: `group:${pujaShort(run[0].id)}:${grp.key}`, label: grp.label, contains: run });
  }
  return practical;
}
// === lib/kb/graph.ts 미러 끝 ===

// samagri_hint: 아이템 이름(+aliases)이 단계 텍스트(라벨·gloss, 내부 단계 포함)에 등장하면 연결 — 결정론 매칭
function stepText(p) {
  const parts = [p.label, p.gloss];
  for (const c of p.contains) parts.push(c.label, c.gloss);
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function itemNames(item) {
  const names = [item.name, ...(item.aliases ?? [])].filter(Boolean);
  const variants = new Set();
  for (const n of names) {
    const low = n.toLowerCase();
    variants.add(low);
    if (low.endsWith("s")) variants.add(low.slice(0, -1)); // 단·복수 소박한 대응
  }
  return [...variants];
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summary = [];

  for (const pujaId of PUJAS) {
    const puja = byId.get(pujaId);
    if (!puja) throw new Error(`not in graph: ${pujaId}`);
    const requires = (outLinks.get(pujaId) ?? [])
      .filter((l) => l.rel === "REQUIRES")
      .map((l) => byId.get(l.target))
      .filter(Boolean);

    const practical = toPracticalSteps(detailedSteps(pujaId));
    const seenItems = new Set();

    const steps = practical.map((p, idx) => {
      const text = stepText(p);
      const hints = requires
        .filter((item) => itemNames(item).some((v) => text.includes(v)))
        .map((item) => item.id);
      // focus_object 규칙(17-v2): 이 단계에서 "새로 쓰이는" 지물. 처음 등장 힌트가 정확히 1개일 때만 제안, 아니면 null → 이미지 팀 확정.
      const fresh = hints.filter((h) => !seenItems.has(h));
      hints.forEach((h) => seenItems.add(h));
      return {
        n: idx + 1,
        id: p.id,
        label: p.label,
        gloss: p.gloss ?? null,
        contains: p.contains.map((c) => c.id),
        samagri_hint: hints,
        focus_object_suggestion: fresh.length === 1 ? fresh[0] : null,
        mantra_present: p.contains.some((c) => (c.mantra_ids ?? []).length > 0),
      };
    });

    const outPath = path.join(OUT_DIR, `${pujaShort(pujaId)}.json`);
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          puja: pujaShort(pujaId),
          source: "pujabot-web/data/kb/graph.json (App view 배율 = lib/kb/graph.ts toPracticalSteps)",
          generated: new Date().toISOString(),
          steps,
        },
        null,
        2
      ) + "\n"
    );
    summary.push(
      `${pujaShort(pujaId)}: practical ${steps.length}단계, ` +
        `hint 있는 단계 ${steps.filter((s) => s.samagri_hint.length).length}, ` +
        `focus 제안 ${steps.filter((s) => s.focus_object_suggestion).length}, ` +
        `mantra ${steps.filter((s) => s.mantra_present).length} → ${outPath}`
    );
  }
  console.log(summary.join("\n"));
}

main();
