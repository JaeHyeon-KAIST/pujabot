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
  const [distanceOn, setDistanceOn] = useState(true);

  const visible = useMemo(() => {
    let list = pandits.filter((p) => !distanceOn || p.distanceKm <= 6);
    if (sort === "price") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "rating")
      list = [...list].sort(
        (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
      );
    return list;
  }, [pandits, sort, distanceOn]);

  function toggleDistance() {
    setDistanceOn((v) => !v);
    logEvent("pandit_filter_toggled", { which: "distance" });
  }

  return (
    <>
      <p className="text-[13px] text-inksoft">
        {visible.length} home-ritual specialists near {cityLabel} — pandits
        devoted to{" "}
        <b className="text-maroon">{scenario.deity}, your deity,</b> shown first.
        We never auto-assign.
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Chip on>{scenario.deity} devotees</Chip>
        <Chip>Sanskrit rituals</Chip>
        <button onClick={toggleDistance}>
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
                  : "pb-1.5 text-[13px] font-medium text-inksoft"
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
            scenario={scenario}
            scenarioId={scenario.id}
            best={sort === "best" && p.id === scenario.bestPanditId}
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
