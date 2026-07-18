/**
 * Demo pin: every query routes to the pandit-reviewed Satyanarayan flow
 * ("new-business") so live walkthroughs are deterministic. Still NO LLM
 * anywhere in this path — the output selects a reviewed template only.
 * The original keyword scorer lives in git history (pre-ec333d4 HEAD);
 * restore it to bring back per-scenario routing.
 */
export function matchScenario(_input: string): string | null {
  return "new-business";
}
