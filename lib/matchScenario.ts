import { scenarios } from "./data";

/**
 * Deterministic keyword matcher — NO LLM anywhere in this path.
 * Hard constraint: the matcher's output selects which pandit-reviewed
 * template renders, so the selection must be auditable.
 *
 * Scoring: count of distinct keywords contained in the input (case-insensitive).
 * Highest score wins; ties resolve to the earlier entry in scenarios.json.
 * No match -> null -> UI renders the human-review fallback (never generation).
 */
export function matchScenario(input: string): string | null {
  const norm = input.toLowerCase();
  let bestId: string | null = null;
  let bestScore = 0;
  for (const s of scenarios) {
    const score = s.keywords.filter((k) => norm.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = s.id;
    }
  }
  return bestId;
}
