import crypto from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";
import scenarios from "@/data/scenarios.json";
import pujas from "@/data/puja-templates.json";
import maps from "@/data/maps.json";

// One revision per build: any deploy re-precaches the demo routes.
const revision = crypto.randomUUID();

/**
 * Precache every route of the scripted demo so the ENTIRE flow
 * (home → result → puja → pandits → book → confirmed → checklist)
 * works with zero connectivity after one visit (05-dev-field-readiness §2).
 */
const demoRoutes: string[] = [
  "/",
  "/confirmed",
  "/~offline",
  ...scenarios.flatMap((s) => [
    `/result/${s.id}`,
    `/puja/${s.id}`,
    `/pandits/${s.id}`,
    `/checklist/${s.id}`,
    ...s.panditIds.map((p) => `/book/${s.id}/${p}`),
  ]),
  // Static imagery the demo depends on: deity art + offline map tiles
  ...pujas.map((p) => p.art.src),
  ...Object.values(maps).flatMap((m) => m.tiles.map((t) => t.src)),
];

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: demoRoutes.map((url) => ({ url, revision })),
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
