"use client";

/**
 * 조회형 데모: 채팅(LLM=의도 해석) + 지식그래프(조회 경로 하이라이트) + 만트라 카드(격리 렌더).
 * 만트라 원문은 mantras.json에서 클라이언트가 직접 렌더 — 모델 경로를 지나지 않는다.
 */
import { useChat } from "@ai-sdk/react";
import { useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import mantraStore from "@/data/kb/mantras.json";
import instructionsStore from "@/data/kb/instructions.json";
import translitStore from "@/data/kb/translit.json";
import meaningsStore from "@/data/kb/meanings.json";
import stepDetailsStore from "@/data/kb/step-details.json";
import reciteStore from "@/data/kb/recite-display.json";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type VizNode = { id: string; type: string; name: string; verified: boolean; stub: boolean; agree: number };
type VizLink = { source: string; target: string; rel: string };
type Viz = { nodes: VizNode[]; links: VizLink[] };

type MantraRec = {
  title: string;
  text: string;
  script: string;
  source_domain: string;
  source_tier: string;
  canon_match: string | null;
};

type InstructionRec = { instruction: string; status: string };
const instructions = instructionsStore as Record<string, InstructionRec>;
const translits = translitStore as Record<string, string>;
type MeaningRec = { meaning: string; origin: "source" | "ai-translation"; source?: string; status: string };
const meanings = meaningsStore as Record<string, MeaningRec>;
type StepDetailRec = { detail: string; quotes: { source: string; text: string }[]; status: string };
const stepDetails = stepDetailsStore as Record<string, StepDetailRec>;

// 낭송 표시 맵 — 같은 절의 복수 소스 레코드는 1회 표시 + "also attested" (scripts/gen-recite-display.mjs)
type ReciteCluster = { primary: string; also: { id: string; source: string }[] };
const reciteDisplay = reciteStore as unknown as {
  steps: Record<string, ReciteCluster[]>;
  puja: Record<string, ReciteCluster[]>;
};
const clustersFor = (stepId: string, fallbackIds: string[]): ReciteCluster[] =>
  reciteDisplay.steps[stepId] ?? fallbackIds.map((id) => ({ primary: id, also: [] }));

/** 스텝 인라인 만트라 — 원문(격리 스토어에서 직접)·IAST 음역·뜻을 한 단위로 렌더 */
function MantraEntry({ id, also }: { id: string; also?: { id: string; source: string }[] }) {
  const m = (mantraStore as Record<string, MantraRec>)[id];
  if (!m) return null;
  // span+block: 스텝 행(span.flex-1) 안에 인라인 렌더되므로 div 중첩 금지
  return (
    <span className="mb-2 block border-b border-sanctumcard pb-2 last:mb-0 last:border-0 last:pb-0">
      <span className="block text-xs text-sanctumgold">{m.title}</span>
      <span className="block font-scrip text-sm leading-relaxed">{m.text}</span>
      {/* 기계 음역은 소스 원문에 로마자 병기가 없을 때만 — 현재 20건 전부 병기 수록이라 사실상 예비용 */}
      {translits[id] && !/[A-Za-z]/.test(m.text) && (
        <span className="mt-1 block text-xs italic leading-relaxed text-sanctumtext">
          {translits[id]}
          <span className="not-italic text-[9px] text-sanctumgold"> · read-along (IAST, machine-transliterated)</span>
        </span>
      )}
      {meanings[id] && (
        <span className="mt-1 block text-xs text-sanctumtext">
          {meanings[id].meaning}
          <span className="text-[9px] text-sanctumgold">
            {" "}· meaning{meanings[id].origin === "source" ? ` from ${meanings[id].source}` : " — AI translation · pending review"}
          </span>
        </span>
      )}
      <span className="mt-0.5 block text-[9px] text-sanctumgreen">
        cited: {m.source_domain} ({m.source_tier}) · verbatim-verified ✓
        {also && also.length > 0 && (
          <> · same verse also in {also.map((a) => a.source).join(", ")} — {also.length + 1} independent sources</>
        )}
      </span>
    </span>
  );
}

const SUGGESTIONS = [
  "I'm moving into a new flat in Bengaluru next month. What should I do?",
  "I want to do Satyanarayan puja at home — what are the steps?",
  "Our family worships Vishnu — which pujas can we do at home?",
  "My grandmother did a Kashmiri variant of Satyanarayan — do you have that?",
  "When is a good date for Satyanarayan puja?",
];

// 대화에서 "지금 화면이 보여줘야 할 푸자"를 결정한다 — 결정론.
// 검색이 verified 푸자를 식별하는 순간 그 푸자가 대상이 되고, LLM이 상세 조회를
// 건너뛰어도 UI가 /api/details로 그래프를 직접 조회한다 (결과는 LLM이 아니라 그래프가 낸다).
/* eslint-disable @typescript-eslint/no-explicit-any */
function resolveWanted(messages: any[]): {
  wantedId: string | null;
  llmDetails: Record<string, any>;
  deityEdges: { source: string; target: string }[];
} {
  let wantedId: string | null = null;
  const llmDetails: Record<string, any> = {};
  let deityEdges: { source: string; target: string }[] = [];
  for (const m of messages) {
    for (const part of m.parts ?? []) {
      if (part.type === "tool-search_pujas" && part.state === "output-available") {
        // verified 우선, 없으면 1소스 추출 푸자도 패널 표시 (스텁만 제외 — 숨기지 않고 배너로 정직 표시)
        const hit =
          (part.output ?? []).find((r: any) => r.verified) ??
          (part.output ?? []).find((r: any) => !r.stub);
        if (hit) wantedId = hit.puja_id;
      }
      if (part.type === "tool-get_pujas_for_deity" && part.state === "output-available" && part.output?.traversed_edges) {
        deityEdges = part.output.traversed_edges; // 마지막 deity 순회가 이긴다 — FOR_DEITY 엣지 하이라이트
      }
      if (part.type === "tool-get_puja_details" && part.state === "output-available" && part.output && !part.output.error) {
        llmDetails[part.output.puja.id] = part.output;
        wantedId = part.output.puja.id;
      }
    }
  }
  return { wantedId, llmDetails, deityEdges };
}

export default function AskDemo({ viz }: { viz: Viz }) {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"app" | "canonical">("app");
  const graphWrap = useRef<HTMLDivElement>(null);
  const [gw, setGw] = useState(560);
  useEffect(() => {
    const el = graphWrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setGw(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { wantedId, llmDetails, deityEdges } = useMemo(() => resolveWanted(messages as any[]), [messages]);

  // 결정론 폴백: LLM이 get_puja_details를 안 불렀어도 그래프에서 직접 조회
  const [fetchedDetails, setFetchedDetails] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!wantedId || llmDetails[wantedId] || fetchedDetails[wantedId]) return;
    let stale = false;
    fetch(`/api/details?id=${encodeURIComponent(wantedId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!stale && d && !d.error) setFetchedDetails((prev) => ({ ...prev, [wantedId]: d }));
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [wantedId, llmDetails, fetchedDetails]);

  const details = wantedId ? (llmDetails[wantedId] ?? fetchedDetails[wantedId] ?? null) : null;
  const detailsAutoLoaded = !!(wantedId && !llmDetails[wantedId] && fetchedDetails[wantedId]);

  const highlight = useMemo(() => {
    const set = new Set<string>();
    for (const e of details?.traversed_edges ?? []) set.add(`${e.source}->${e.target}`);
    for (const e of deityEdges) set.add(`${e.source}->${e.target}`);
    return set;
  }, [details, deityEdges]);

  const focusPuja: string | null = details?.puja?.id ?? null;

  // 스텝 인라인 만트라 펼침 토글 — 낭송은 해당 스텝 안에서 (스텝 = 완결 단위)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [pujaMantrasOpen, setPujaMantrasOpen] = useState(false);
  useEffect(() => {
    setSelectedStepId(null);
    setPujaMantrasOpen(false);
  }, [focusPuja]);

  const graphData = useMemo(
    () => ({
      nodes: viz.nodes.map((n) => ({ ...n })),
      links: viz.links.map((l) => ({ ...l })),
    }),
    [viz]
  );

  const send = (text: string) => {
    if (!text.trim() || status !== "ready") return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <main className="min-h-screen bg-ground text-ink font-body">
      <header className="sticky top-0 z-40 bg-ground/95 border-b border-hairline px-4 py-3">
        <h1 className="font-disp text-xl text-maroon">Ask PujaBot</h1>
        <p className="text-xs text-inksoft">
          verified knowledge graph · {viz.nodes.filter((n) => n.type === "puja").length} pujas ·{" "}
          {viz.nodes.filter((n) => n.type === "step").length} steps ·{" "}
          {viz.nodes.filter((n) => n.type === "deity").length} deities ·{" "}
          <span className="text-green">◆ canonical</span> · badge = independent sources agreeing
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        {/* ── 채팅 패널 ── */}
        <section className="flex min-h-[70vh] flex-col rounded-md border border-hairline bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-inksoft">Try one of these:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-sm border border-hairline bg-cardwarm px-3 py-2 text-left text-sm hover:border-maroon"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {(messages as any[]).map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
                {(m.parts ?? []).map((part: any, i: number) => {
                  if (part.type === "text" && part.text)
                    return m.role === "user" ? (
                      <div key={i} className="inline-block rounded-md bg-cardwarm px-3 py-2 text-sm">
                        {part.text}
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="inline-block max-w-[95%] rounded-md border border-hairline bg-ground px-3 py-2 text-sm [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:my-1 [&_ol]:ml-4 [&_ol]:list-decimal [&_li]:my-0.5 [&_h1]:my-1 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-bold [&_code]:text-xs"
                      >
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    );
                  if (part.type?.startsWith("tool-")) {
                    const name = part.type.replace("tool-", "");
                    return (
                      <div key={i} className="my-1 text-xs text-goldink">
                        ⚙ {name}
                        {part.state === "output-available" ? " ✓" : " …"}
                        {name === "search_pujas" && part.state === "output-available" && (
                          <span className="text-inksoft">
                            {" "}
                            → {(part.output ?? []).map((r: any) => `${r.name} (${r.verified ? "verified" : r.stub ? "stub" : "seed"})`).join(", ") || "no match"}
                          </span>
                        )}
                        {name === "get_pujas_for_deity" && part.state === "output-available" && (
                          <span className="text-inksoft">
                            {" "}
                            →{" "}
                            {part.output?.deity
                              ? `${part.output.deity.name}: ${(part.output.pujas ?? []).length} pujas linked on the graph`
                              : "deity not in graph"}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
            {status === "streaming" && <div className="text-xs text-inksoft">…</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-hairline p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a ritual, situation or date…"
              className="flex-1 rounded-sm border border-hairline bg-ground px-3 py-2 text-sm outline-none focus:border-maroon"
            />
            <button
              type="submit"
              disabled={status !== "ready"}
              className="rounded-sm bg-saffron px-4 py-2 font-disp text-sm text-maroondeep shadow-[3px_3px_0_#6b1b1b] disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </section>

        {/* ── 그래프 + 상세 패널 ── */}
        <section className="space-y-4">
          <div ref={graphWrap} className="overflow-hidden rounded-md border border-hairline bg-card">
            <div className="border-b border-hairline px-3 py-2 text-xs text-inksoft">
              knowledge graph — the answer path lights up; nothing off-graph can be answered
            </div>
            <ForceGraph2D
              width={gw}
              height={380}
              graphData={graphData}
              backgroundColor="#fffdf7"
              nodeId="id"
              nodeVal={(n: any) => (n.id === focusPuja ? 9 : n.verified ? 5 : n.type === "deity" ? 3.4 : n.type === "puja" ? 2.5 : 1.6)}
              nodeColor={(n: any) =>
                n.id === focusPuja
                  ? "#f0a030"
                  : n.type === "puja"
                    ? n.verified
                      ? "#216b45"
                      : "#c9a227"
                    : n.type === "deity"
                      ? "#2e5090"
                      : n.type === "step"
                        ? "#6b1b1b"
                        : n.type === "mantra"
                          ? "#2a0e14"
                          : "#b23a2e"
              }
              nodeLabel={(n: any) => `${n.name}${n.agree ? ` · ${n.agree} sources` : ""}`}
              linkColor={(l: any) =>
                highlight.has(`${l.source.id ?? l.source}->${l.target.id ?? l.target}`)
                  ? "#f0a030"
                  : "rgba(107,27,27,0.10)"
              }
              linkWidth={(l: any) =>
                highlight.has(`${l.source.id ?? l.source}->${l.target.id ?? l.target}`) ? 2.2 : 0.4
              }
              linkDirectionalParticles={(l: any) =>
                highlight.has(`${l.source.id ?? l.source}->${l.target.id ?? l.target}`) ? 2 : 0
              }
              linkDirectionalParticleColor={() => "#f0a030"}
              cooldownTicks={80}
            />
          </div>

          {/* 단계 상세 (조회 결과 그대로 — 배지 포함) */}
          {details && (
            <div className="rounded-md border border-hairline bg-card p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="font-disp text-maroon">{details.puja?.name}</h2>
                <span className="text-xs text-inksoft">{details.puja?.source_count} sources</span>
              </div>
              {detailsAutoLoaded && (
                <p className="mb-2 text-[10px] text-inksoft">
                  loaded deterministically from the graph — the model did not produce this panel
                </p>
              )}
              {details.puja && !details.puja.verified && !details.puja.stub && (
                <p className="mb-2 rounded-sm bg-cardwarm p-2 text-xs text-maroon">
                  Single-source entry — pending cross-verification. Steps below carry 1-source badges;
                  for this ritual, pandit guidance is especially recommended.
                </p>
              )}
              {/* 표시 배율 토글 — 같은 그래프, 두 화면 (실제 앱 배율 vs 정본 상세) */}
              <div className="mb-3 flex gap-1 text-xs">
                <button
                  onClick={() => setView("app")}
                  className={
                    "rounded-sm border px-2 py-1 " +
                    (view === "app" ? "border-maroon bg-cardwarm font-bold text-maroon" : "border-hairline text-inksoft")
                  }
                >
                  App view · {(details.practical_steps ?? []).length} steps
                </button>
                <button
                  onClick={() => setView("canonical")}
                  className={
                    "rounded-sm border px-2 py-1 " +
                    (view === "canonical" ? "border-maroon bg-cardwarm font-bold text-maroon" : "border-hairline text-inksoft")
                  }
                >
                  Canonical view · {(details.steps ?? []).length} steps
                </button>
                <span className="self-center text-[10px] text-inksoft">same graph, two zoom levels</span>
              </div>

              {/* 시작 전 준비 — 소스 인용 기반 배치 안내 (편집층, draft) */}
              {view === "app" && stepDetails[`_setup:${details.puja?.id?.split(":")[1]}`] && (
                <div className="mb-2 rounded-sm bg-cardwarm p-2 text-xs">
                  <span className="font-bold text-maroon">Before you begin — setup: </span>
                  {stepDetails[`_setup:${details.puja.id.split(":")[1]}`].detail}{" "}
                  <span className="text-[9px] uppercase tracking-wide text-goldink">draft</span>
                </div>
              )}
              {/* 소스가 특정 스텝이 아닌 푸자 전체에 붙인 만트라 (예: 핵심 살루테이션) */}
              {view === "app" && (reciteDisplay.puja[details.puja?.id] ?? []).length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={() => setPujaMantrasOpen(!pujaMantrasOpen)}
                    className={
                      "rounded-sm border px-1.5 py-0.5 text-[10px] " +
                      (pujaMantrasOpen
                        ? "border-maroon bg-cardwarm font-bold text-maroon"
                        : "border-hairline text-goldink hover:border-maroon")
                    }
                  >
                    {pujaMantrasOpen ? "▾" : "▸"} recited through the puja —{" "}
                    {reciteDisplay.puja[details.puja.id].length} mantras
                  </button>
                  {pujaMantrasOpen && (
                    <div className="mt-1 rounded-md bg-sanctum p-3 text-sanctumtext">
                      <span className="mb-2 block text-[9px] uppercase tracking-wider text-sanctumgold">
                        sources attach these to the whole puja, not one step · verbatim from isolated store
                      </span>
                      {reciteDisplay.puja[details.puja.id].map((cl) => (
                        <MantraEntry key={cl.primary} id={cl.primary} also={cl.also} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {view === "app" && (
                <ol className="space-y-1">
                  {(details.practical_steps ?? []).map((p: any, i: number) => {
                    const instr = instructions[p.id];
                    const mantraCount = (p.contains ?? []).reduce(
                      (n: number, c: any) => n + clustersFor(c.id, c.mantra_ids ?? []).length,
                      0
                    );
                    return (
                    <li key={p.id ?? i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-goldink">{i + 1}</span>
                      <span className="flex-1">
                        {p.label}
                        {instr ? (
                          <span className="block text-xs text-inksoft">
                            {instr.instruction}{" "}
                            <span className="text-[9px] uppercase tracking-wide text-goldink">draft</span>
                          </span>
                        ) : (
                          p.gloss && <span className="block text-xs text-inksoft">{p.gloss.slice(0, 90)}</span>
                        )}
                        {stepDetails[p.id] && (
                          <span className="block text-xs text-inksoft">
                            {stepDetails[p.id].detail}{" "}
                            <span className="text-[9px] text-goldink">
                              per {[...new Set(stepDetails[p.id].quotes.map((q) => q.source))].join(", ")}
                            </span>{" "}
                            <span className="text-[9px] uppercase tracking-wide text-goldink">draft</span>
                          </span>
                        )}
                        {(p.items_hint ?? []).length > 0 && (
                          <span className="block text-[10px] text-goldink">
                            items here: {p.items_hint.map((it: any) => it.name).join(" · ")}
                            <span className="text-inksoft"> — named in this step&apos;s sources</span>
                          </span>
                        )}
                        {mantraCount > 0 && (
                          <button
                            onClick={() => setSelectedStepId(selectedStepId === p.id ? null : p.id)}
                            className={
                              "mt-0.5 mr-2 rounded-sm border px-1.5 py-0.5 text-[10px] " +
                              (selectedStepId === p.id
                                ? "border-maroon bg-cardwarm font-bold text-maroon"
                                : "border-hairline text-goldink hover:border-maroon")
                            }
                          >
                            {selectedStepId === p.id ? "▾" : "▸"} recite here — {mantraCount} mantra
                            {mantraCount > 1 ? "s" : ""}
                          </button>
                        )}
                        {selectedStepId === p.id && mantraCount > 0 && (
                          <span className="mt-1 block rounded-md bg-sanctum p-3 text-sanctumtext">
                            <span className="mb-2 block text-[9px] uppercase tracking-wider text-sanctumgold">
                              recite at this step · verbatim — rendered from isolated store, never passed through the model
                            </span>
                            {p.contains
                              .map((c: any) => ({ c, clusters: clustersFor(c.id, c.mantra_ids ?? []) }))
                              .filter(({ clusters }: any) => clusters.length > 0)
                              .map(({ c, clusters }: any) => (
                                <span key={c.id} className="block">
                                  {p.contains.length > 1 && (
                                    <span className="mb-1 block text-[10px] font-bold text-sanctumgold">
                                      during {c.label}:
                                    </span>
                                  )}
                                  {clusters.map((cl: ReciteCluster) => (
                                    <MantraEntry key={cl.primary} id={cl.primary} also={cl.also} />
                                  ))}
                                </span>
                              ))}
                          </span>
                        )}
                        {p.contains?.length > 1 && (
                          <details className="mt-0.5">
                            <summary className="cursor-pointer text-xs text-goldink">
                              ▸ {p.contains.length} canonical offerings inside
                            </summary>
                            <ul className="mt-1 ml-3 space-y-0.5 text-xs text-inksoft">
                              {p.contains.map((c: any) => (
                                <li key={c.id}>
                                  {c.label}
                                  {c.mantra_ids?.length > 0 && <span className="text-goldink"> · mantra ✓</span>}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </span>
                      <span
                        className={
                          "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] " +
                          (p.canonical_support ? "bg-cardwarm text-green" : "bg-cardwarm text-goldink")
                        }
                      >
                        {p.sources_agree} agree{p.canonical_support ? " ◆" : ""}
                      </span>
                    </li>
                    );
                  })}
                </ol>
              )}

              {view === "canonical" && (
              <ol className="space-y-1">
                {(details.steps ?? []).slice(0, 30).map((s: any) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-goldink">{s.order}</span>
                    <span className="flex-1">
                      {s.label}
                      {s.gloss && <span className="block text-xs text-inksoft">{s.gloss.slice(0, 90)}</span>}
                    </span>
                    <span
                      className={
                        "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] " +
                        (s.canonical_support ? "bg-cardwarm text-green" : "bg-cardwarm text-goldink")
                      }
                      title={s.canonical_support ? "canonical source support" : "commercial sources only"}
                    >
                      {s.sources_agree} agree{s.canonical_support ? " ◆" : ""}
                    </span>
                  </li>
                ))}
              </ol>
              )}
              {/* Samagri — 코어(합의≥2 또는 권위 소스) / 1소스 상업 언급 계층화. 삭제가 아닌 계층화. */}
              {(details.samagri ?? []).length > 0 && (() => {
                const core = details.samagri.filter((it: any) => it.sources_agree >= 2 || it.has_authority);
                const rest = details.samagri.filter((it: any) => !(it.sources_agree >= 2 || it.has_authority));
                const row = (it: any) => (
                  <li key={it.id} className="flex items-baseline justify-between gap-1 text-xs">
                    <span>
                      {it.name}
                      {it.has_authority && <span className="text-green"> ◆</span>}
                    </span>
                    <span className="shrink-0 rounded-sm bg-cardwarm px-1 text-[10px] text-goldink">{it.sources_agree}</span>
                  </li>
                );
                return (
                  <div className="mt-3 border-t border-hairline pt-2">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-bold text-maroon">Samagri — core checklist ({core.length})</h3>
                      <span className="text-[10px] text-inksoft">≥2 sources agree or ◆ canonical · badge = sources</span>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">{core.map(row)}</ul>
                    {rest.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-goldink">
                          ▸ mentioned by 1 commercial source only ({rest.length})
                        </summary>
                        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">{rest.map(row)}</ul>
                      </details>
                    )}
                  </div>
                );
              })()}

              {/* 기권 카드 — 검증 그래프에 만트라 원문 없음 → 판딧 안내 (정직한 한계 고지) */}
              {details.mantra_note && (
                <div className="mt-3 rounded-md border border-hairline bg-cardwarm p-3">
                  <p className="text-xs font-bold text-maroon">Not in the verified graph → consult a pandit</p>
                  <p className="mt-1 text-xs text-inksoft">{details.mantra_note}</p>
                  <button className="mt-2 rounded-sm bg-saffron px-3 py-1.5 font-disp text-xs text-maroondeep shadow-[2px_2px_0_#6b1b1b]">
                    Find a pandit near you →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 만트라는 스텝 인라인으로 이동 (스텝 = 낭송 포함 완결 단위) — 별도 하단 카드 없음 */}
        </section>
      </div>
    </main>
  );
}
