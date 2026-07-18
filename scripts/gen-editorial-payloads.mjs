#!/usr/bin/env node
/**
 * 편집층(지시문·배치 디테일) 작성 에이전트용 입력 페이로드 생성 — 전 푸자.
 * practical step 그룹핑은 lib/kb/graph.ts와 동일 (export-scene-input.mjs 미러).
 * 출력: <outDir>/{pid}.json = { puja, steps: [{id, label, source_glosses:[{step, gloss}]}] }
 * 실행: node scripts/gen-editorial-payloads.mjs <outDir>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const graph = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/kb/graph.json"), "utf8"));
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const byId = new Map(graph.nodes.map((n) => [n.id, n]));
const outLinks = new Map();
for (const l of graph.links) {
  if (!outLinks.has(l.source)) outLinks.set(l.source, []);
  outLinks.get(l.source).push(l);
}

const UPACHARA_GROUPS = [
  { key: "invoke-seat", label: "Invoke & seat the deity", members: ["dhyana", "avahana", "asana"] },
  { key: "offer-water", label: "Offer water", members: ["padya", "arghya", "achamana"] },
  { key: "bathe-adorn", label: "Bathe & adorn the deity", members: ["snana", "vastra", "yajnopavita", "gandha"] },
  { key: "main-offerings", label: "Main offerings — flowers, incense, lamp, food", members: ["pushpa", "dhupa", "dipa", "naivedya", "tambula"] },
  { key: "pradakshina", label: "Pradakshina & namaskara", members: ["namaskara"] },
];
const short = (id) => id.split(":").pop() ?? id;
const pujaShort = (id) => id.split(":")[1] ?? id;

let count = 0;
for (const p of graph.nodes.filter((n) => n.type === "puja" && !n.stub)) {
  const pid = pujaShort(p.id);
  if (["satyanarayan", "griha-pravesh"].includes(pid)) continue; // 기존 검수 완료분 유지
  const stepLinks = (outLinks.get(p.id) ?? []).filter((l) => l.rel === "HAS_STEP").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const steps = stepLinks.map((l) => byId.get(l.target));
  if (!steps.length) continue;
  const practical = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    if (s.bucket !== "upa") {
      practical.push({ id: s.id, label: s.label ?? s.id, source_glosses: s.gloss ? [{ step: s.label, gloss: s.gloss }] : [] });
      i++;
      continue;
    }
    const grp = UPACHARA_GROUPS.find((g) => g.members.includes(short(s.id)));
    if (!grp) {
      practical.push({ id: s.id, label: s.label ?? s.id, source_glosses: s.gloss ? [{ step: s.label, gloss: s.gloss }] : [] });
      i++;
      continue;
    }
    const run = [];
    while (i < steps.length && steps[i].bucket === "upa" && grp.members.includes(short(steps[i].id))) {
      run.push(steps[i]);
      i++;
    }
    practical.push({
      id: `group:${pid}:${grp.key}`,
      label: grp.label,
      source_glosses: run.filter((r) => r.gloss).map((r) => ({ step: r.label, gloss: r.gloss })),
    });
  }
  fs.writeFileSync(path.join(OUT, `${pid}.json`), JSON.stringify({ puja: pid, name: p.name, steps: practical }, null, 1));
  count++;
}
console.log(`payloads: ${count} pujas → ${OUT}`);
