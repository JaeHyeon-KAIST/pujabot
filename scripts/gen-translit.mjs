#!/usr/bin/env node
/**
 * 데바나가리 만트라 → IAST 로마자 음역 (결정론 기계 변환 — LLM 무관여, 원문 불변).
 * 산스크리트는 낭송 언어: 데바나가리를 못 읽는 사용자가 따라 읽을 수 있게 한다.
 * 실행: node scripts/gen-translit.mjs  →  data/kb/translit.json (mantras.json은 건드리지 않음)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Sanscript from "@indic-transliteration/sanscript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mantras = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/kb/mantras.json"), "utf8"));

const DEVANAGARI = /[ऀ-ॿ]/;
const out = {};
for (const [id, m] of Object.entries(mantras)) {
  if (!DEVANAGARI.test(m.text)) continue; // 이미 로마자인 건 불필요
  // mixed 레코드(원문에 로마자 병기 포함)는 데바나가리 부분만 변환 — 로마자 꼬리 통과로 verse가 중복되는 것 방지
  const devOnly = m.text
    .split("\n")
    .filter((line) => DEVANAGARI.test(line))
    .join("\n");
  out[id] = Sanscript.t(devOnly, "devanagari", "iast");
}

const outPath = path.join(__dirname, "../data/kb/translit.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`translit: ${Object.keys(out).length}/${Object.keys(mantras).length} mantras → ${outPath}`);
