#!/usr/bin/env node
/**
 * compile-kb — 검증 통과 데이터(corroborated)를 지식그래프로 컴파일.
 *
 * 입력:
 *   데이터수집/kb/corroborated_{puja}.json   (교차대조+검증층 통과 스파인/사마그리/만트라)
 *   데이터수집/extracted/{puja}/{domain}.json (단계 원문 gloss·만트라 verbatim 텍스트)
 *   데이터수집/ontology/{upachara-16,source-tiers}.json
 *   data/puja-templates.json                  (기존 시드 — corroborated와 겹치면 스킵)
 *   데이터수집/manifest.jsonl                 (99pandit 카탈로그 → 스텁 푸자 노드)
 *
 * 출력: data/kb/graph.json (node-link) · data/kb/mantras.json (verbatim 격리) · data/kb/sources.json
 * 원칙: 만트라 원문은 graph.json에 절대 넣지 않는다 — mantras.json에만.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const COLLECT = join(dirname(ROOT), "데이터수집");
const OUT = join(ROOT, "data", "kb");
mkdirSync(OUT, { recursive: true });

const J = (p) => JSON.parse(readFileSync(p, "utf8"));
const onto = J(join(COLLECT, "ontology/upachara-16.json"));
const tiers = J(join(COLLECT, "ontology/source-tiers.json"));

const DOMAIN_TIER = {};
for (const [tier, spec] of Object.entries(tiers.tiers))
  for (const d of spec.domains) DOMAIN_TIER[d] = tier;

// ── 온톨로지 룩업 (만트라→단계 매칭용) ──
const ONTO_NODES = [];
for (const [bucket, arr] of [["pre", onto.pre_ritual], ["upa", onto.upacharas], ["post", onto.post_ritual], ["special", onto.special_rituals ?? []]])
  for (const n of arr)
    ONTO_NODES.push({ bucket, id: n.id, name: n.name, terms: [n.name.toLowerCase(), ...n.aliases.map((a) => a.toLowerCase())] });

const nodes = [];
const links = [];
const mantrasOut = {};
const itemNodes = new Map(); // 전역 아이템 노드

const PUJA_META = {
  satyanarayan: {
    name: "Satyanarayan Puja",
    aliases: ["satyanarayana", "satyanarayan vrat", "satya narayan pooja", "satyanarayan katha"],
    purpose_tags: ["blessing", "prosperity", "gratitude", "new beginning", "full moon", "purnima", "family wellbeing"],
    occasions: ["purnima", "housewarming follow-up", "marriage", "new job", "success celebration"],
  },
  "griha-pravesh": {
    name: "Griha Pravesh",
    aliases: ["griha pravesh", "gruhapravesh", "housewarming", "house warming", "grah pravesh", "new home puja"],
    purpose_tags: ["new home", "moving", "housewarming", "vastu", "protection", "purification"],
    occasions: ["moving into a new house", "first entry", "vastu shanti"],
  },
};

// 검색 색인용 큐레이션 메타 (deity·purpose·occasion 어휘 — 의례 사실 주장 아님)
const META_FILE = existsSync(join(ROOT, "data", "puja-meta.json")) ? J(join(ROOT, "data", "puja-meta.json")) : {};

// ── Deity 표기 정규화 — 명백한 동의어만 병합 (실험: deity를 필터가 아닌 그래프 노드로 승격) ──
// 주의: Das Mahavidya 계열(kamala·bhairavi·tara 등)은 독립 여신이므로 병합하지 않는다.
const DEITY_CANON = {
  ganapati: "ganesha", vinayaka: "ganesha",
  mars: "mangal", saturn: "shani",
  mahadev: "shiva", bholenath: "shiva", rudra: "shiva", maheshwara: "shiva", mrityunjaya: "shiva",
  bajrangbali: "hanuman",
  "nine planets": "navagraha", "nine forms": "durga",
  narayana: "vishnu", satyanarayan: "vishnu",
  "bal gopal": "krishna",
  mahakali: "kali", mahalakshmi: "lakshmi",
  gauri: "parvati", uma: "parvati",
};
const deityNodes = new Map(); // 전역 Deity 노드

// ── 1) corroborated 푸자 (검증 통과 실데이터) ──
const corroboratedIds = [];
for (const f of readdirSync(join(COLLECT, "kb")).filter((x) => x.startsWith("corroborated_"))) {
  const c = J(join(COLLECT, "kb", f));
  const pid = c.puja; // e.g. "satyanarayan"
  corroboratedIds.push(pid);
  const fm = META_FILE[pid];
  const meta = PUJA_META[pid] ?? {
    name: pid.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
    aliases: fm?.aliases ?? [pid.replace(/-/g, " ")],
    purpose_tags: fm?.purpose_tags ?? [],
    occasions: fm?.occasions ?? [],
  };
  meta.deity = fm?.deity ?? [];
  const pujaId = `puja:${pid}`;

  // 추출 원본 로드 (gloss·만트라 텍스트용)
  const extracted = {};
  const exDir = join(COLLECT, "extracted", pid);
  if (existsSync(exDir))
    for (const ef of readdirSync(exDir).filter((x) => x.endsWith(".json")))
      extracted[ef.replace(/\.json$/, "")] = J(join(exDir, ef));

  const domainsUsed = Object.keys(c.sources ?? {});
  // verified 배지는 독립 소스 2+ 교차대조 통과에만 — 1소스 추출은 정직하게 구분
  const isVerified = domainsUsed.length >= 2;
  nodes.push({
    id: pujaId, type: "puja", name: meta.name, aliases: meta.aliases,
    purpose_tags: meta.purpose_tags, occasions: meta.occasions, deity: meta.deity ?? [],
    stub: false, verified: isVerified, source_count: domainsUsed.length,
    ...(isVerified ? {} : { source_note: "single-source extraction — pending corroboration" }),
  });

  // Deity → 전역 Deity 노드 + FOR_DEITY 링크 (선택 = 필터가 아니라 그래프 진입점)
  // 유래: 큐레이션 검색 메타(puja-meta.json) — 교차대조 전이므로 노드·링크에 정직 라벨
  const seenDeities = new Set();
  for (const rawD of meta.deity ?? []) {
    const raw = rawD.toLowerCase();
    const canon = DEITY_CANON[raw] ?? raw;
    const dId = `deity:${canon.replace(/[^a-z0-9]+/g, "-")}`;
    if (!deityNodes.has(dId))
      deityNodes.set(dId, {
        id: dId, type: "deity",
        name: canon.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
        aliases: [], pujas: [],
        source_note: "curated search metadata — attribution pending corroboration",
      });
    const dn = deityNodes.get(dId);
    // alias는 dedup 이전에 기록 — 같은 푸자에서 canon이 먼저 나와도 동의어 표기를 잃지 않는다
    if (raw !== canon && !dn.aliases.includes(raw)) dn.aliases.push(raw);
    if (seenDeities.has(canon)) continue; // 엣지 중복만 방지 (예: mangal+mars → 1엣지)
    seenDeities.add(canon);
    dn.pujas.push(pid);
    links.push({ source: pujaId, target: dId, rel: "FOR_DEITY", sources: ["curated-meta"] });
  }

  // 단계 스파인 → Step 노드 + HAS_STEP/NEXT 링크
  let prevStepId = null;
  c.steps.forEach((s, i) => {
    const short = s.node_id.replace(/^(pre|upa|post|spc):/, "");
    const stepId = `step:${pid}:${short}`;
    // gloss: 대표(최고 티어) 소스의 해당 단계 원문
    let gloss = "";
    const repTitles = s.step_titles?.[s.representative_source] ?? [];
    const repEx = extracted[s.representative_source];
    if (repEx && repTitles.length) {
      const hit = (repEx.steps ?? []).find((st) => repTitles.includes(st.title));
      gloss = hit?.text ?? "";
    }
    nodes.push({
      id: stepId, type: "step", puja: pujaId, bucket: s.bucket, order: i + 1,
      label: s.label.replace(/^\d+\.\s*/, "").replace(/^★\s*/, ""),
      gloss, sources: s.sources, sources_agree: s.sources_agree,
      canonical_support: s.canonical_support, representative_source: s.representative_source,
    });
    links.push({ source: pujaId, target: stepId, rel: "HAS_STEP", order: i + 1, sources_agree: s.sources_agree, canonical_support: s.canonical_support });
    if (prevStepId) links.push({ source: prevStepId, target: stepId, rel: "NEXT" });
    prevStepId = stepId;
  });

  // 사마그리 → 전역 Item 노드 + REQUIRES 링크 (합의 1도 노드는 만들되 링크에 카운트)
  for (const it of c.samagri) {
    const key = it.item.replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!key) continue;
    const itemId = `item:${key}`;
    if (!itemNodes.has(itemId)) {
      itemNodes.set(itemId, { id: itemId, type: "item", name: it.item, pujas: [] });
    }
    itemNodes.get(itemId).pujas.push(pid);
    links.push({ source: pujaId, target: itemId, rel: "REQUIRES", sources_agree: it.sources_agree, sources: it.sources });
  }

  // 만트라 → Mantra 노드(메타만) + mantras.json(원문) + RECITES 링크
  for (const m of c.mantras) {
    if (!m.verbatim_ok) continue; // verbatim 검증 통과분만 그래프 진입
    // 원문 텍스트는 추출 파일에서
    const ex = extracted[m.source];
    const raw = (ex?.mantras ?? []).find((x) => (x.title ?? "").slice(0, 40) === m.title);
    if (!raw) continue;
    const slug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    const mantraId = `mantra:${pid}:${slug}`;
    if (mantrasOut[mantraId]) continue; // dedupe
    mantrasOut[mantraId] = {
      title: raw.title, text: raw.text, script: raw.script,
      source_domain: m.source, source_tier: DOMAIN_TIER[m.source] ?? "T3",
      verbatim_ok: true, canon_match: m.canon_match ?? null,
    };
    nodes.push({
      id: mantraId, type: "mantra", puja: pujaId, title: raw.title, script: raw.script,
      citation: `${m.source} (${DOMAIN_TIER[m.source] ?? "T3"})`, canon_match: m.canon_match ?? null,
      // 원문 없음 — mantras.json에서만 렌더
    });
    // 단계 매칭: 푸자/신명 토큰 제거 후("Ganesha Dhyana Mantra"의 'ganesha'가 우파차라보다 먼저 걸리는 것 방지)
    // 최장 매칭 용어의 노드 선택 (corroborate.py map_step과 같은 원칙)
    let tl = m.title.toLowerCase();
    for (const tok of pid.split("-")) if (tok.length >= 4) tl = tl.split(tok).join(" ");
    let hit = null, hitLen = 0;
    for (const n of ONTO_NODES) {
      const best = Math.max(0, ...n.terms.filter((t) => t.length > 3 && tl.includes(t)).map((t) => t.length));
      if (best > hitLen) { hit = n; hitLen = best; }
    }
    let stepId = hit ? `step:${pid}:${hit.id.replace(/^(pre|upa|post|spc):/, "")}` : null;
    if (!(stepId && nodes.some((n) => n.id === stepId))) {
      // 2차: 같은 푸자의 스텝 id 토큰과 제목 토큰 직접 대조 (확실한 경우만 — 최장 토큰 승리)
      let best = null, bestLen = 0;
      const titleToks = tl.split(/[^a-z]+/).filter((t) => t.length >= 5);
      for (const n of nodes) {
        if (n.type !== "step" || n.puja !== pujaId) continue;
        const stepToks = n.id.split(":").pop().split("-").filter((t) => t.length >= 5);
        for (const st of stepToks)
          for (const tt of titleToks)
            if ((st === tt || st.startsWith(tt) || tt.startsWith(st)) && Math.min(st.length, tt.length) > bestLen) {
              best = n.id; bestLen = Math.min(st.length, tt.length);
            }
      }
      stepId = best;
    }
    if (stepId && nodes.some((n) => n.id === stepId)) {
      links.push({ source: stepId, target: mantraId, rel: "RECITES" });
    } else {
      links.push({ source: pujaId, target: mantraId, rel: "RECITES" });
    }
  }
}

// ── 2) 기존 시드 템플릿 (corroborated와 겹치지 않는 것만) ──
const templates = J(join(ROOT, "data", "puja-templates.json"));
for (const t of templates) {
  const pid = t.id.toLowerCase().replace(/\s+/g, "-");
  if (corroboratedIds.some((c) => pid.includes(c) || c.includes(pid))) continue;
  const pujaId = `puja:${pid}`;
  nodes.push({
    id: pujaId, type: "puja", name: t.name, aliases: [t.dev ?? "", t.name.toLowerCase()].filter(Boolean),
    purpose_tags: (t.benefit ?? "").toLowerCase().split(/[,;·]/).map((s) => s.trim()).filter(Boolean).slice(0, 6),
    occasions: [(t.when ?? "")].filter(Boolean),
    stub: false, verified: false, source_count: 1, source_note: "curated seed template — pending corroboration",
  });
  let prev = null;
  (t.steps ?? []).forEach((s, i) => {
    const stepId = `step:${pid}:t${i + 1}`;
    nodes.push({
      id: stepId, type: "step", puja: pujaId, bucket: "template", order: i + 1,
      label: s.en ?? s.sanskrit ?? `Step ${i + 1}`, gloss: s.detail ?? "",
      sources: ["curated-template"], sources_agree: 1, canonical_support: false,
    });
    links.push({ source: pujaId, target: stepId, rel: "HAS_STEP", order: i + 1, sources_agree: 1, canonical_support: false });
    if (prev) links.push({ source: prev, target: stepId, rel: "NEXT" });
    prev = stepId;
  });
}

// ── 3) 99pandit 카탈로그 → 스텁 푸자 노드 (그래프 스케일 + 정직한 low-corroboration 데모) ──
const manifestPath = join(COLLECT, "manifest.jsonl");
if (existsSync(manifestPath)) {
  const slugs = new Set();
  for (const line of readFileSync(manifestPath, "utf8").split("\n")) {
    const m = line.match(/"url": "https:\/\/99pandit\.com\/service\/([a-z0-9-]+)\/"/);
    if (m && m[1] !== "service") slugs.add(m[1]);
  }
  // 정크·중복 스텁은 DB에서 제외 (원칙: 넣었으면 뜨고, 이상하면 컴파일에서 뺀다)
  const STUB_BLACKLIST = new Set(["others", "online-e-puja-service", "mahamrityunjay"]);
  for (const slug of [...slugs].slice(0, 80)) {
    const pid = slug.replace(/-puja$|-path$|-jaap$|-homam?$/, "").replace("parvesh", "pravesh").replace("pooja", "puja");
    if (STUB_BLACKLIST.has(pid)) continue;
    if (nodes.some((n) => n.id === `puja:${pid}` || (n.type === "puja" && n.id.includes(pid)))) continue;
    const name = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    nodes.push({
      id: `puja:${pid}`, type: "puja", name, aliases: [slug.replace(/-/g, " ")],
      purpose_tags: [], occasions: [], stub: true, verified: false, source_count: 1,
      source_note: "catalog stub (99pandit) — 1 source, low corroboration",
    });
  }
}

nodes.push(...itemNodes.values());
nodes.push(...deityNodes.values());

// ── 4) sources.json ──
const sourcesOut = {};
for (const [tier, spec] of Object.entries(tiers.tiers))
  for (const d of spec.domains) sourcesOut[d] = { tier, label: spec.label };
sourcesOut["grihapraveshpuja.org"] = { tier: "EXCLUDED", label: "도메인 탈취 검출(도박 사이트) — 파이프라인이 자동 제외", excluded: true };
sourcesOut["curated-template"] = { tier: "SEED", label: "팀 큐레이션 시드 템플릿 — 교차대조 대기" };

// ── 출력 ──
const graph = { generated: new Date().toISOString().slice(0, 10), nodes, links };
writeFileSync(join(OUT, "graph.json"), JSON.stringify(graph, null, 1));
writeFileSync(join(OUT, "mantras.json"), JSON.stringify(mantrasOut, null, 1));
writeFileSync(join(OUT, "sources.json"), JSON.stringify(sourcesOut, null, 1));

const count = (t) => nodes.filter((n) => n.type === t).length;
console.log(`graph.json: 노드 ${nodes.length} (puja ${count("puja")} [검증 ${nodes.filter((n) => n.type === "puja" && n.verified).length} · 시드 ${nodes.filter((n) => n.type === "puja" && !n.verified && !n.stub).length} · 스텁 ${nodes.filter((n) => n.stub).length}] / step ${count("step")} / item ${count("item")} / mantra ${count("mantra")} / deity ${count("deity")}) · 링크 ${links.length} (FOR_DEITY ${links.filter((l) => l.rel === "FOR_DEITY").length})`);
console.log(`mantras.json: ${Object.keys(mantrasOut).length}건 (전부 verbatim 검증 통과분) · sources.json: ${Object.keys(sourcesOut).length}개 도메인`);
