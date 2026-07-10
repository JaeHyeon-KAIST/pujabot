"use client";

import { useState } from "react";
import type { Scenario } from "@/lib/data";
import { logEvent } from "@/lib/analytics";
import { Diya } from "./icons";
import { Chip } from "./ui";

export function altLabel(alt: string): string {
  return alt.replace(/^(Earlier|Also good|Festival option):\s*/, "");
}

/** Panchang date card with a selectable alternate — the muhurat-integrated picker moment. */
export default function DateBlock({ date }: { date: Scenario["date"] }) {
  const [choice, setChoice] = useState<"main" | "alt">("main");
  const alt = altLabel(date.alt);
  const altDay = alt.split("·")[0]?.trim() ?? alt;
  const altRest = alt.slice(altDay.length).replace(/^\s*·\s*/, "");

  function pick(next: "main" | "alt") {
    setChoice(next);
    logEvent("date_choice", { choice: next });
  }

  return (
    <div className="rounded-lg border border-hairgold bg-card px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="text-maroon">
          <Diya size={20} />
        </span>
        <span className="kicker">Auspicious date</span>
      </div>

      {choice === "main" ? (
        <>
          <div className="mt-2 font-disp text-[20px] font-bold text-maroon lg:text-[25px]">
            {date.day}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold">{date.detail}</div>
          <p className="mt-1 text-[13px] text-inksoft">
            Why this date: {date.why}
          </p>
        </>
      ) : (
        <>
          <div className="mt-2 font-disp text-[20px] font-bold text-maroon lg:text-[25px]">
            {altDay}
          </div>
          {altRest && (
            <div className="mt-0.5 text-[13px] font-semibold">{altRest}</div>
          )}
          <p className="mt-1 text-[13px] text-inksoft">
            Exact muhurat window for this date will be confirmed with your
            pandit — panchang detail pending review.
          </p>
        </>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button onClick={() => pick("main")}>
          <Chip on={choice === "main"}>{date.day.split("·")[0].trim()}</Chip>
        </button>
        <button onClick={() => pick("alt")}>
          <Chip on={choice === "alt"}>{alt}</Chip>
        </button>
      </div>
    </div>
  );
}
