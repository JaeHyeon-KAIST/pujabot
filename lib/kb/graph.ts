/**
 * 지식그래프 조회 계층 — 결정론 코드. LLM은 이 함수들을 툴로 호출만 한다.
 * graph.json은 빌드 시 생성(scripts/compile-kb.mjs), 프로세스 메모리에 1회 로드.
 */
import graphData from "@/data/kb/graph.json";
import sourcesData from "@/data/kb/sources.json";

export type GraphNode = {
  id: string;
  type: "puja" | "step" | "item" | "mantra" | "deity";
  name?: string;
  label?: string;
  title?: string;
  puja?: string;
  bucket?: string;
  order?: number;
  gloss?: string;
  aliases?: string[];
  purpose_tags?: string[];
  occasions?: string[];
  sources?: string[];
  sources_agree?: number;
  canonical_support?: boolean;
  citation?: string;
  canon_match?: string | null;
  script?: string;
  stub?: boolean;
  verified?: boolean;
  source_count?: number;
  source_note?: string;
  representative_source?: string;
};

export type GraphLink = {
  source: string;
  target: string;
  rel: "HAS_STEP" | "NEXT" | "REQUIRES" | "RECITES" | "FOR_DEITY";
  order?: number;
  sources_agree?: number;
  canonical_support?: boolean;
  sources?: string[];
};

const nodes = (graphData as { nodes: GraphNode[] }).nodes;
const links = (graphData as unknown as { links: GraphLink[] }).links;

const byId = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));
const outLinks = new Map<string, GraphLink[]>();
for (const l of links) {
  if (!outLinks.has(l.source)) outLinks.set(l.source, []);
  outLinks.get(l.source)!.push(l);
}

export const allPujas = () => nodes.filter((n) => n.type === "puja");
export const getNode = (id: string) => byId.get(id) ?? null;

/** 실사용(앱) 배율 — 우파차라 미세 단계를 실제 수행 동작 단위로 묶는다.
 *  데이터는 그대로: 같은 그래프의 두 표시 배율일 뿐. (레시피: "만두를 빚는다" vs 피밀기→소넣기→접기) */
export const UPACHARA_GROUPS: { key: string; label: string; members: string[] }[] = [
  { key: "invoke-seat", label: "Invoke & seat the deity", members: ["dhyana", "avahana", "asana"] },
  { key: "offer-water", label: "Offer water", members: ["padya", "arghya", "achamana"] },
  { key: "bathe-adorn", label: "Bathe & adorn the deity", members: ["snana", "vastra", "yajnopavita", "gandha"] },
  { key: "main-offerings", label: "Main offerings — flowers, incense, lamp, food", members: ["pushpa", "dhupa", "dipa", "naivedya", "tambula"] },
  { key: "pradakshina", label: "Pradakshina & namaskara", members: ["namaskara"] },
];

type DetailedStep = {
  id: string; order?: number; bucket?: string; label?: string; gloss?: string;
  sources_agree?: number; canonical_support?: boolean; mantra_ids: string[];
};

/** 상세 스파인 → 실사용 단계 (uba 묶음, pre/post/special은 그대로) */
function toPracticalSteps(steps: DetailedStep[]) {
  const short = (id: string) => id.split(":").pop() ?? id;
  const pujaShort = (id: string) => id.split(":")[1] ?? id;
  const practical: {
    id: string; label: string; gloss?: string; sources_agree: number; canonical_support: boolean;
    contains: { id: string; label?: string; mantra_ids: string[] }[];
  }[] = [];
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    if (s.bucket !== "upa") {
      practical.push({
        id: s.id, label: s.label ?? s.id, gloss: s.gloss,
        sources_agree: s.sources_agree ?? 1, canonical_support: s.canonical_support ?? false,
        contains: [{ id: s.id, label: s.label, mantra_ids: s.mantra_ids }],
      });
      i++;
      continue;
    }
    const grp = UPACHARA_GROUPS.find((g) => g.members.includes(short(s.id)));
    if (!grp) {
      practical.push({
        id: s.id, label: s.label ?? s.id, gloss: s.gloss,
        sources_agree: s.sources_agree ?? 1, canonical_support: s.canonical_support ?? false,
        contains: [{ id: s.id, label: s.label, mantra_ids: s.mantra_ids }],
      });
      i++;
      continue;
    }
    const run: DetailedStep[] = [];
    while (i < steps.length && steps[i].bucket === "upa" && grp.members.includes(short(steps[i].id))) {
      run.push(steps[i]);
      i++;
    }
    practical.push({
      id: `group:${pujaShort(run[0].id)}:${grp.key}`,
      label: grp.label,
      sources_agree: Math.max(...run.map((r) => r.sources_agree ?? 1)),
      canonical_support: run.some((r) => r.canonical_support),
      contains: run.map((r) => ({ id: r.id, label: r.label, mantra_ids: r.mantra_ids })),
    });
  }
  return practical;
}

export function getPujaDetails(pujaId: string) {
  const puja = byId.get(pujaId);
  if (!puja || puja.type !== "puja") return { error: `not in graph: ${pujaId}` };

  const out = outLinks.get(pujaId) ?? [];
  const stepLinks = out
    .filter((l) => l.rel === "HAS_STEP")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const steps = stepLinks.map((l) => {
    const s = byId.get(l.target)!;
    const mantraLinks = (outLinks.get(s.id) ?? []).filter((m) => m.rel === "RECITES");
    return {
      id: s.id,
      order: s.order,
      bucket: s.bucket,
      label: s.label,
      gloss: s.gloss,
      sources_agree: s.sources_agree,
      canonical_support: s.canonical_support,
      mantra_ids: mantraLinks.map((m) => m.target), // ID만 — 원문은 절대 여기로 나가지 않음
    };
  });
  const srcTiers = sourcesData as Record<string, { tier: string }>;
  const items = out
    .filter((l) => l.rel === "REQUIRES")
    .map((l) => ({
      id: l.target,
      name: byId.get(l.target)?.name ?? l.target,
      sources_agree: l.sources_agree ?? 1,
      sources: l.sources ?? [],
      // 1소스여도 T1/T2 권위 소스가 언급했으면 코어 승격 (삭제가 아닌 계층화 원칙)
      has_authority: (l.sources ?? []).some((d) => {
        const t = srcTiers[d]?.tier;
        return t === "T1" || t === "T2";
      }),
    }))
    .sort((a, b) => (b.sources_agree ?? 0) - (a.sources_agree ?? 0));

  // 그래프 하이라이트용: 이번 조회가 걸어간 엣지들
  const traversed = [
    ...stepLinks.map((l) => ({ source: pujaId, target: l.target })),
    ...steps.flatMap((s) => s.mantra_ids.map((m) => ({ source: s.id, target: m }))),
  ];

  // 단계별 물품 힌트 — 아이템 이름(+별칭)이 단계 텍스트에 등장하면 연결 (결정론 공출현, 창작 아님.
  // scene-input export와 같은 로직 — export-scene-input.mjs와 동기화 유지)
  const glossById = new Map(steps.map((s) => [s.id, `${s.label ?? ""} ${s.gloss ?? ""}`]));
  const itemVariants = items.map((it) => {
    const node = byId.get(it.id);
    const names = [node?.name, ...(node?.aliases ?? [])].filter(Boolean) as string[];
    const vars = new Set<string>();
    for (const n of names) {
      const low = n.toLowerCase();
      vars.add(low);
      if (low.endsWith("s")) vars.add(low.slice(0, -1));
    }
    return { id: it.id, name: it.name, vars: [...vars] };
  });
  const practical_steps = toPracticalSteps(steps).map((p) => {
    const text = [p.label, p.gloss ?? "", ...p.contains.map((c) => glossById.get(c.id) ?? "")]
      .join(" ")
      .toLowerCase();
    return {
      ...p,
      items_hint: itemVariants
        .filter((iv) => iv.vars.some((v) => text.includes(v)))
        .map((iv) => ({ id: iv.id, name: iv.name })),
    };
  });

  return {
    puja: {
      id: puja.id,
      name: puja.name,
      verified: puja.verified,
      stub: puja.stub ?? false,
      source_count: puja.source_count,
      source_note: puja.source_note,
    },
    steps,
    practical_steps,
    samagri: items,
    mantra_note:
      steps.every((s) => s.mantra_ids.length === 0)
        ? "NO verbatim mantra text exists in the graph for this puja — commercial sources do not quote it. Recommend pandit consultation for mantra guidance."
        : undefined,
    traversed_edges: traversed,
  };
}

export function getMantraRef(mantraId: string) {
  const m = byId.get(mantraId);
  if (!m || m.type !== "mantra") return { error: `not in graph: ${mantraId}` };
  // 의도적으로 원문(text)을 반환하지 않는다 — UI가 mantras.json에서 직접 렌더.
  return {
    id: m.id,
    title: m.title,
    script: m.script,
    citation: m.citation,
    canon_match: m.canon_match,
    note: "verbatim text is rendered client-side from the isolated mantra store; it never passes through the model",
  };
}

/** Deity 노드에서 출발하는 결정론 순회 — deity 선택은 필터가 아니라 그래프 진입점이다.
 *  주의: FOR_DEITY 엣지의 유래는 큐레이션 검색 메타(교차대조 전) — 결과에 정직 라벨 동반. */
export function getPujasForDeity(deity: string) {
  const q = deity.toLowerCase().replace(/^deity:/, "").trim();
  const dNode = nodes.find(
    (n) =>
      n.type === "deity" &&
      (n.id === `deity:${q.replace(/[^a-z0-9]+/g, "-")}` ||
        (n.name ?? "").toLowerCase() === q ||
        (n.aliases ?? []).some((a) => a.toLowerCase() === q))
  );
  if (!dNode)
    return {
      error: `deity not in graph: ${deity}`,
      available_deities: nodes.filter((n) => n.type === "deity").map((n) => n.name),
    };
  const edges = links.filter((l) => l.rel === "FOR_DEITY" && l.target === dNode.id);
  const pujas = edges
    .map((l) => byId.get(l.source))
    .filter((p): p is GraphNode => !!p)
    .map((p) => ({
      puja_id: p.id,
      name: p.name,
      verified: p.verified ?? false,
      stub: p.stub ?? false,
      source_count: p.source_count ?? 1,
      corroboration: p.verified
        ? "cross-verified (multiple independent sources + canonical frame check)"
        : "single-source extraction — pending corroboration",
    }))
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.source_count - a.source_count);
  return {
    deity: { id: dNode.id, name: dNode.name },
    attribution_note:
      "deity links come from curated metadata — pending cross-source corroboration (not yet a verified ritual fact)",
    pujas,
    traversed_edges: edges.map((l) => ({ source: l.source, target: l.target })),
  };
}

export function sourceInfo() {
  return sourcesData as Record<string, { tier: string; label: string; excluded?: boolean }>;
}

/** 시각화용 — 전체 그래프를 force-graph 포맷으로 (스텁 포함해 스케일감) */
export function graphForViz() {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      name: n.name ?? n.label ?? n.title ?? n.id,
      verified: n.verified ?? false,
      stub: n.stub ?? false,
      agree: n.sources_agree ?? 0,
    })),
    links: links.map((l) => ({ source: l.source, target: l.target, rel: l.rel })),
  };
}
