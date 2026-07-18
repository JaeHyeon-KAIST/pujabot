/**
 * Compact numbered overview of the ritual — one line per step, read BEFORE
 * the puja to see the shape of the day. The full, follow-along walk-through
 * (pictures, mantras, audio) lives on the step-by-step guide.
 */
import { Fragment } from "react";
import { Hairline } from "./ui";

export default function StepsList({
  steps,
}: {
  steps: { n?: number; title: string; sub: string; dur: string }[];
}) {
  return (
    <div className="flex flex-col">
      {steps.map((s, i) => (
        <Fragment key={s.n ?? i}>
          {i > 0 && <Hairline />}
          <div className="flex items-start gap-3 py-2.5">
            <span className="w-5 flex-none font-disp text-[15px] font-bold text-goldink">
              {s.n ?? i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-maroon">{s.title}</div>
              <div className="text-[13px] text-inksoft">{s.sub}</div>
            </div>
            <span className="flex-none pl-2 text-[12px] text-inksoft">
              {s.dur}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
