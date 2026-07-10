/**
 * Follow-along ritual guide: every step's explanation stays visible —
 * this screen is read DURING the puja, so nothing opens, closes, or toggles.
 */
import StepIcon from "./StepIcon";

export default function StepsList({
  steps,
}: {
  steps: { sanskrit: string; en: string; detail: string }[];
}) {
  return (
    <div className="relative flex flex-col gap-5">
      {/* timeline through the icon tiles: 16px number + 12px gap + half tile (28px) */}
      <span
        aria-hidden
        className="absolute bottom-7 top-7 w-px bg-hairgold"
        style={{ left: "55px" }}
      />
      {steps.map((s, i) => (
        <div key={s.sanskrit} className="relative flex items-start gap-3">
          <span className="mt-4 w-4 flex-none font-disp text-[15px] font-bold text-goldink">
            {i + 1}
          </span>
          <StepIcon name={s.sanskrit} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-maroon">{s.sanskrit}</div>
            <div className="text-[13px] text-inksoft">{s.en}</div>
            <p className="mt-1 text-[13px] leading-relaxed">{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
