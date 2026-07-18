import scenariosJson from "@/data/scenarios.json";
import pujasJson from "@/data/puja-templates.json";
import panditsJson from "@/data/pandits.json";
import vendorsJson from "@/data/vendors.json";

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
