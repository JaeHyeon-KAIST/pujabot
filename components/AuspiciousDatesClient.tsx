"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AuspiciousDate, AuspiciousDates, DateTagKind } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import { Calendar, Check, Diya } from "./icons";
import { BadgeGreen, Tag } from "./ui";

type Sort = "auspicious" | "soonest";

/** Calendar-date rank for "Soonest first": Jul 16 < Jul 29 < Aug 23 < Aug 27. */
const SOONEST_RANK: Record<string, number> = {
  jul16: 0,
  jul29: 1,
  aug23: 2,
  aug27: 3,
};

const TAG_KIND: Record<DateTagKind, "match" | "budget" | "over"> = {
  match: "match",
  budget: "budget",
  maroon: "over",
};

/** Screen 2b (V2) — panchang date picker replicating PanchangDatesV2. */
export default function AuspiciousDatesClient({
  scenarioId,
  data,
}: {
  scenarioId: string;
  data: AuspiciousDates;
}) {
  const [sort, setSort] = useState<Sort>("auspicious");

  const ordered = useMemo(() => {
    if (sort === "soonest") {
      return [...data.dates].sort(
        (a, b) => (SOONEST_RANK[a.id] ?? 99) - (SOONEST_RANK[b.id] ?? 99),
      );
    }
    return data.dates;
  }, [data.dates, sort]);

  function selectSort(next: Sort) {
    setSort(next);
    logEvent("dates_sort", { sort: next });
  }

  return (
    <div className="pb-10">
      <p className="pt-1 text-[13px] text-inksoft">
        Panchang-based dates for{" "}
        <b className="font-semibold text-maroon">{data.pujaName}</b> ·{" "}
        {data.cityTimings}
      </p>

      {/* Sort toggle */}
      <div className="mt-3 flex rounded-md bg-cardwarm p-[3px]">
        {(
          [
            ["auspicious", "Most auspicious"],
            ["soonest", "Soonest first"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => selectSort(value)}
            className={`flex-1 rounded-[6px] px-1.5 py-[9px] text-[13px] ${
              sort === value
                ? "bg-card font-bold text-maroon shadow-warm"
                : "text-inksoft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Range window (decorative) */}
      <div className="mt-3 flex items-stretch rounded-lg border border-hairline bg-card">
        <RangeHalf label="FROM" value="Any date" />
        <span className="w-px flex-none self-stretch bg-hairline" />
        <RangeHalf label="TO" value="Any date" />
      </div>
      <p className="mt-1.5 text-[12px] text-inksoft">
        Optional — narrow to a window that suits your family, like booking a
        stay.
      </p>

      {/* Date cards */}
      <div className="mt-4 flex flex-col gap-2.5">
        {ordered.map((date, i) => {
          const emphasized = sort === "auspicious" && i === 0;
          return (
            <DateCard
              key={date.id}
              date={date}
              scenarioId={scenarioId}
              emphasized={emphasized}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-1.5">
        <Check size={15} className="text-green" />
        <BadgeGreen>Panchang data · pandit review in progress</BadgeGreen>
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.45] text-inksoft">
        Ordered by ritual suitability — Purnima first for this puja. The exact
        muhurat is confirmed by your pandit at booking.
      </p>
    </div>
  );
}

function RangeHalf({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
      <Calendar size={16} className="flex-none text-goldink" />
      <div className="flex min-w-0 flex-col">
        <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-goldink">
          {label}
        </span>
        <span className="text-[13px] text-inksoft">{value}</span>
      </div>
    </div>
  );
}

function DateCard({
  date,
  scenarioId,
  emphasized,
}: {
  date: AuspiciousDate;
  scenarioId: string;
  emphasized: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border bg-card p-[14px_16px] ${
        emphasized ? "border-hairgold shadow-warm" : "border-hairline"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {emphasized && (
            <span className="text-maroon">
              <Diya size={20} />
            </span>
          )}
          <span
            className={`font-disp font-bold text-maroon ${
              emphasized ? "text-[20px]" : "text-[17px]"
            }`}
          >
            {date.day}
          </span>
        </div>
        <Tag kind={TAG_KIND[date.tagKind]}>{date.tag}</Tag>
      </div>

      <div className="text-[14px] font-semibold leading-snug text-ink">
        {date.time}
      </div>
      <p className="text-[13px] leading-[1.5] text-inksoft">{date.note}</p>

      <Link
        href={`/result/${scenarioId}?date=${date.id}`}
        onClick={() => logEvent("date_choose", { scenarioId, dateId: date.id })}
        className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-maroon text-[16px] font-semibold text-maroon"
      >
        Choose this date
      </Link>
    </div>
  );
}
