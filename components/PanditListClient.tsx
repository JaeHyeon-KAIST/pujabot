"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Pandit, Scenario } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import PanditCard from "./PanditCard";
import { Chat } from "./icons";
import { Chip } from "./ui";

type SortKey = "best" | "price" | "rating";

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "best", label: "Best match" },
  { key: "price", label: "Price" },
  { key: "rating", label: "Rating" },
];

export default function PanditListClient({
  scenario,
  pandits,
  cityLabel,
}: {
  scenario: Scenario;
  pandits: Pandit[]; // best-match order, best first
  cityLabel: string;
}) {
  const [sort, setSort] = useState<SortKey>("best");
  const [budgetOn, setBudgetOn] = useState(true);
  const [distanceOn, setDistanceOn] = useState(true);

  const [, hi] = scenario.budgetRange;
  const budgetChip =
    scenario.budgetRange[0] === 0
      ? `Under ₹${hi / 1000}K`
      : `₹${scenario.budgetRange[0] / 1000}–${hi / 1000}K`;

  const visible = useMemo(() => {
    let list = pandits.filter(
      (p) =>
        (!budgetOn || p.price <= hi) && (!distanceOn || p.distanceKm <= 6),
    );
    if (sort === "price") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "rating")
      list = [...list].sort(
        (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
      );
    return list;
  }, [pandits, sort, budgetOn, distanceOn, hi]);

  function toggle(which: "budget" | "distance") {
    if (which === "budget") setBudgetOn((v) => !v);
    else setDistanceOn((v) => !v);
    logEvent("pandit_filter_toggled", { which });
  }

  return (
    <>
      <p className="text-[13px] text-inksoft">
        {visible.length} home-ritual specialists (purohit) near {cityLabel} —
        browse and choose; we never auto-assign.
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Chip on>{scenario.chips[0] ?? scenario.label}</Chip>
        <Chip>Sanskrit rituals</Chip>
        <button onClick={() => toggle("budget")}>
          <Chip on={budgetOn}>{budgetChip}</Chip>
        </button>
        <button onClick={() => toggle("distance")}>
          <Chip on={distanceOn}>Within 6 km</Chip>
        </button>
        <Link href="/" className="ml-0.5 text-[13px] font-semibold text-maroon">
          Edit
        </Link>
      </div>

      {/* Sort bar sticks just under the (sticky) TopBar; intro + filters scroll away */}
      <div className="sticky top-[52px] z-30 -mx-5 bg-ground px-5 lg:top-[62px]">
        <div className="flex gap-5 border-b border-hairline pt-2.5">
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setSort(t.key);
                logEvent("pandit_sort_changed", { sort: t.key });
              }}
              className={
                sort === t.key
                  ? "border-b-2 border-maroon pb-1.5 text-[13px] font-bold text-maroon"
                  : "pb-1.5 text-[13px] text-inksoft"
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {visible.map((p) => (
          <PanditCard
            key={p.id}
            pandit={p}
            scenarioId={scenario.id}
            best={sort === "best" && p.id === scenario.bestPanditId}
            inBudget={p.price <= hi}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-lg bg-cardwarm px-4 py-4">
          <span className="mt-0.5 flex-none text-wa">
            <Chat size={16} />
          </span>
          <p className="text-[13px] leading-relaxed">
            No pandits match those filters —{" "}
            <span className="font-semibold text-maroon">
              relax the budget or distance
            </span>
            , or we&rsquo;ll have a pandit coordinator reach out on WhatsApp.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-cardwarm px-3.5 py-3 text-[13px]">
        Don&rsquo;t see the right fit? We&rsquo;ll have a pandit review your
        request and reply on WhatsApp.
      </div>
    </>
  );
}
