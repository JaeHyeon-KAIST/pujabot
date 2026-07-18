/**
 * 푸자 검색 — MiniSearch (BM25류 + fuzzy). 임베딩·벡터DB 없음:
 * 의미 이해는 LLM의 툴 인자 추출이 담당하고, 여기는 이름·별칭·목적태그 매칭만 한다.
 */
import MiniSearch from "minisearch";
import { allPujas } from "./graph";

// 표기 정규화 (조사 문서의 동의어 사전 — Pooja/Puja, Laxmi/Lakshmi 등)
const NORMALIZE: [RegExp, string][] = [
  [/pooja/gi, "puja"],
  [/laxmi/gi, "lakshmi"],
  [/parvesh/gi, "pravesh"],
  [/grah\b/gi, "griha"],
  [/hawan/gi, "havan"],
  [/homam\b/gi, "homa"],
  [/house\s*warming/gi, "housewarming"],
];
const norm = (s: string) => NORMALIZE.reduce((acc, [re, to]) => acc.replace(re, to), s.toLowerCase());

type Doc = { id: string; name: string; aliases: string; tags: string; occasions: string; deity: string };

const mini = new MiniSearch<Doc>({
  fields: ["name", "aliases", "tags", "occasions", "deity"],
  storeFields: ["name"],
  searchOptions: {
    boost: { name: 3, aliases: 3, deity: 4, tags: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
  // 'puja/perform' 류 범용 토큰은 모든 문서에 사실상 해당 — 색인·질의 양쪽에서 제거해 잡음 차단
  processTerm: (term) => {
    const t = norm(term);
    return ["puja", "pooja", "vidhi", "perform", "performing", "hindu"].includes(t) ? null : t;
  },
});

mini.addAll(
  allPujas().map((p) => ({
    id: p.id,
    name: p.name ?? p.id,
    aliases: (p.aliases ?? []).join(" "),
    tags: (p.purpose_tags ?? []).join(" "),
    occasions: (p.occasions ?? []).join(" "),
    deity: ((p as { deity?: string[] }).deity ?? []).join(" "),
  }))
);

export function searchPujas(query: string, limit = 5) {
  const hits = mini.search(norm(query)).slice(0, limit);
  return hits.map((h) => {
    const p = allPujas().find((x) => x.id === h.id)!;
    return {
      puja_id: p.id,
      name: p.name,
      score: Math.round(h.score * 100) / 100,
      verified: p.verified ?? false,
      stub: p.stub ?? false,
      source_count: p.source_count ?? 1,
      corroboration: p.verified
        ? "cross-verified (multiple independent sources + canonical frame check)"
        : p.stub
          ? "catalog stub — 1 source, low corroboration"
          : "curated seed — pending corroboration",
    };
  });
}
