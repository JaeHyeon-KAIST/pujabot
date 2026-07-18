import scenariosJson from "@/data/scenarios.json";
import pujasJson from "@/data/puja-templates.json";
import panditsJson from "@/data/pandits.json";
import vendorsJson from "@/data/vendors.json";
import reelStepsJson from "@/data/reel-steps.json";
import samagriPricedJson from "@/data/samagri-priced.json";
import auspiciousDatesJson from "@/data/auspicious-dates.json";

export type City = "bengaluru" | "delhi";

export interface Scenario {
  id: string;
  label: string;
  sampleInput: string;
  keywords: string[];
  city: City;
  chips: string[];
  traditionChip: string;
  pujaId: string;
  matchBadge: string;
  whyPuja: string;
  basisTag: string;
  date: { day: string; detail: string; window: string; why: string; alt: string };
  alsoConsider: { pujaId: string; reason: string };
  panditIds: string[];
  bestPanditId: string;
  budgetRange: [number, number];
  sankalpaPrefill: string;
  /** Ishta devata (V2) — the deity the family feels closest to. */
  deity: string;
  /** Region / state (V2) — sets regional ritual style & local panchang timings. */
  state: string;
}

export interface Puja {
  id: string;
  name: string;
  dev: string;
  benefit: string;
  what: string;
  when: string;
  steps: { sanskrit: string; en: string; detail: string }[];
  mantra: { dev: string; iast: string; note: string };
  samagri: { essential: string[]; offerings: string[]; optional: string[] };
  samagriNote: string;
  priceRange: string;
  demoPrice: number;
  samagriKitPrice: number;
  review: { status: string; label: string };
  art: { src: string; alt: string; caption: string; credit: string };
}

export interface Pandit {
  id: string;
  name: string;
  initials: string;
  city: City;
  rating: number;
  ratingCount: number;
  years: number;
  distanceKm: number;
  tradition: string;
  langLine: string;
  credential: string;
  specializes: string[];
  price: number;
  verified: boolean;
  reviews: { quote: string; author: string; area: string; date: string }[];
  /** Deity the pandit is devoted to (V2) — matched against the seeker's ishta devata. */
  deity: string;
  /** Home temple the pandit serves (V2). */
  temple: {
    name: string;
    purohitType: "resident" | "visiting";
    distanceKm: number;
    /** The temple's own presiding deity (may differ from the pandit's ishta devata). */
    mainDeity: string;
    worshippedAs: string;
    lineage: string;
  };
}

export interface Vendor {
  name: string;
  area: string;
  distanceKm: number;
  status: string;
  lat: number;
  lng: number;
}

export const scenarios = scenariosJson as unknown as Scenario[];
export const pujas = pujasJson as unknown as Puja[];
export const pandits = panditsJson as unknown as Pandit[];
export const vendors = vendorsJson as unknown as Record<City, Vendor[]>;

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getPuja(id: string): Puja | undefined {
  return pujas.find((p) => p.id === id);
}

export function getPandit(id: string): Pandit | undefined {
  return pandits.find((p) => p.id === id);
}

export function panditsForScenario(scenario: Scenario): Pandit[] {
  const list = scenario.panditIds
    .map((id) => getPandit(id))
    .filter((p): p is Pandit => Boolean(p));
  // Best match first, keep the rest in listed order
  return [
    ...list.filter((p) => p.id === scenario.bestPanditId),
    ...list.filter((p) => p.id !== scenario.bestPanditId),
  ];
}

export function inBudget(price: number, [, hi]: [number, number]): boolean {
  return price <= hi; // lower bound is informational; "in budget" = under the ceiling
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

/** True when the pandit is devoted to the same deity the seeker chose. */
export function panditMatchesDeity(pandit: Pandit, scenario: Scenario): boolean {
  return pandit.deity.toLowerCase() === scenario.deity.toLowerCase();
}

/* ── Step-by-step reels (V2) ─────────────────────────────────────────── */
export interface ReelMantra {
  title: string;
  dev: string; // Devanagari (may be empty when only a roman line exists)
  rom: string;
  cite: string;
  meaning: string;
  more?: string;
}
export interface ReelStep {
  n: number;
  title: string;
  sub: string;
  dur: string;
  images: string[];
  body: string;
  detail: string;
  src: string;
  callouts?: string[];
  mantra?: ReelMantra;
}
const reelSteps = reelStepsJson as unknown as Record<string, ReelStep[]>;
export function getReelSteps(pujaId: string): ReelStep[] {
  return reelSteps[pujaId] ?? reelSteps["satyanarayan"];
}

/* ── Samagri with prices + delivery (V2) ─────────────────────────────── */
export interface SamagriItem {
  label: string;
  price: number;
  checked: boolean;
}
export interface SamagriPriced {
  pricedStore: string;
  pricesArea: string;
  groups: { title: string; items: SamagriItem[] }[];
  delivery: {
    store: string;
    address: string;
    arrival: string;
    payOnDelivery: boolean;
  };
  vendors: {
    name: string;
    area: string;
    distanceKm: number;
    status: string;
    estimate: number;
  }[];
}
const samagriPriced = samagriPricedJson as unknown as Record<string, SamagriPriced>;
export function getSamagriPriced(pujaId: string): SamagriPriced {
  return samagriPriced[pujaId] ?? samagriPriced["satyanarayan"];
}

/* ── Auspicious (panchang) dates (V2) ────────────────────────────────── */
export type DateTagKind = "match" | "budget" | "maroon";
export interface AuspiciousDate {
  id: string;
  day: string;
  tag: string;
  tagKind: DateTagKind;
  time: string;
  note: string;
  shortWhen: string;
  shortSub: string;
  nearestLabel?: string;
}
export interface AuspiciousDates {
  pujaName: string;
  cityTimings: string;
  dates: AuspiciousDate[];
}
const auspiciousDates = auspiciousDatesJson as unknown as Record<string, AuspiciousDates>;
export function getAuspiciousDates(pujaId: string): AuspiciousDates {
  return auspiciousDates[pujaId] ?? auspiciousDates["satyanarayan"];
}
export function getAuspiciousDate(
  pujaId: string,
  id: string | undefined,
): AuspiciousDate | undefined {
  if (!id) return undefined;
  return getAuspiciousDates(pujaId).dates.find((d) => d.id === id);
}
