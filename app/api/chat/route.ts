/**
 * /api/chat — 조회형 데모의 유일한 LLM 접점.
 * LLM의 역할은 의도 해석 + 툴 선택 + 설명문 작성뿐이다.
 * 의례 사실(단계·사마그리·만트라)은 전부 툴이 그래프에서 조회해 반환하고,
 * 만트라 원문은 이 경로를 지나지 않는다 (get_mantra는 ID·출처만).
 *
 * 프로바이더: OpenAI 호환 (기본 = ollama qwen3:14b, SSH 터널 localhost:11434)
 *   env: LLM_BASE_URL / LLM_MODEL — cliproxyapi·Anthropic 호환 엔드포인트로 즉시 교체 가능.
 */
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { searchPujas } from "@/lib/kb/search";
import { getPujaDetails, getMantraRef, getPujasForDeity } from "@/lib/kb/graph";
import panchang from "@/data/panchang.json";

export const maxDuration = 60;

const provider = createOpenAICompatible({
  name: "kb-llm",
  baseURL: process.env.LLM_BASE_URL ?? "http://localhost:11434/v1",
});

const SYSTEM = `You are PujaBot, a puja guidance assistant backed by a verified knowledge graph.

HARD RULES:
1. NEVER answer ritual questions (steps, samagri, mantras, dates) from your own knowledge. ALWAYS call tools and only restate what they return.
1a. Build search_pujas queries from the user's SPECIFIC words only — deity names, purpose, occasion, life event (e.g. "shiva devotee", "newborn naming", "business growth"). NEVER include generic words like "puja", "home", "perform", "ceremony" in the query.
1b. After search_pujas returns a match, IMMEDIATELY call get_puja_details for the best result in the SAME turn. NEVER ask "would you like me to show the steps" — the panel beside the chat renders the steps, samagri and mantras automatically; your text is only a short commentary.
1c. If the user names a personal/family deity (ishta devata) — e.g. "we worship Vishnu", "Hanuman devotee" — call get_pujas_for_deity with that deity to walk the graph from the deity node, then continue with get_puja_details on the best candidate in the SAME turn. If the deity is not in the graph, say so honestly and list what is.
2. NEVER write out mantra text. get_mantra returns only a reference — tell the user the mantra card will display the verbatim text with its citation.
3. When a tool returns nothing or an error, say honestly that it is not in the verified graph yet, and offer to connect a pandit. Do not improvise.
4. When citing facts, mention corroboration naturally, e.g. "(4 sources agree, incl. canonical)".
5. If a puja result is a catalog stub (stub: true), say the coverage is thin and recommend pandit consultation. For single-source (non-verified, non-stub) pujas, STILL call get_puja_details immediately — the panel shows the steps with honest 1-source badges; briefly note it is single-source, pending cross-verification.
5b. NEVER invent verification mechanisms that do not exist (no "panel of pandits", no "our experts reviewed"). Describe verification state ONLY as: how many independent sources agree, canonical support, or "pending corroboration".
6. Keep answers short and warm. Ask one clarifying question when region/tradition matters (North/South Indian).
7. Never mention caste. Never invent dates — use check_dates.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: provider(process.env.LLM_MODEL ?? "qwen3:14b"),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools: {
      search_pujas: tool({
        description:
          "Search the verified puja knowledge graph by purpose, situation, occasion or name. Returns candidate pujas with corroboration level.",
        inputSchema: z.object({
          query: z.string().describe("purpose or situation keywords in English, e.g. 'moving into new home'"),
        }),
        execute: async ({ query }) => searchPujas(query),
      }),
      get_pujas_for_deity: tool({
        description:
          "Walk the knowledge graph from a deity node to every puja devoted to that deity (FOR_DEITY edges). Use when the user names their preferred deity (ishta devata). Returns pujas ranked by corroboration, with the traversed edges.",
        inputSchema: z.object({
          deity: z.string().describe("deity name, e.g. 'vishnu', 'lakshmi', 'hanuman', 'shiva'"),
        }),
        execute: async ({ deity }) => getPujasForDeity(deity),
      }),
      get_puja_details: tool({
        description:
          "Get the verified step spine, samagri checklist and mantra references for a puja. Every fact carries sources_agree (how many independent sources corroborate it) and canonical_support.",
        inputSchema: z.object({
          puja_id: z.string().describe("puja node id, e.g. 'puja:griha-pravesh'"),
        }),
        execute: async ({ puja_id }) => getPujaDetails(puja_id),
      }),
      get_mantra: tool({
        description:
          "Get a mantra REFERENCE (id, title, citation) — never the raw text. The UI renders the verbatim text client-side from the isolated mantra store.",
        inputSchema: z.object({
          mantra_id: z.string().describe("mantra node id from get_puja_details"),
        }),
        execute: async ({ mantra_id }) => getMantraRef(mantra_id),
      }),
      check_dates: tool({
        description: "Look up upcoming auspicious dates (real DrikPanchang anchors, Jul-Sep 2026, Delhi/Bengaluru).",
        inputSchema: z.object({
          keyword: z.string().optional().describe("optional filter, e.g. 'purnima', 'satyanarayan', 'griha pravesh'"),
        }),
        execute: async ({ keyword }) => {
          const anchors = (panchang as { anchors: { date: string; label: string; note: string }[] }).anchors;
          const k = keyword?.toLowerCase();
          const hits = k
            ? anchors.filter((a) => (a.label + " " + a.note).toLowerCase().includes(k))
            : anchors;
          return { source: (panchang as { source: string }).source, dates: hits.slice(0, 6) };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
