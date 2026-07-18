import Link from "next/link";
import type { Pandit } from "@/lib/data";
import { formatINR } from "@/lib/data";
import { Check, Star } from "./icons";
import { Avatar, Tag } from "./ui";

export default function PanditCard({
  pandit,
  scenarioId,
  best = false,
  inBudget,
}: {
  pandit: Pandit;
  scenarioId: string;
  best?: boolean;
  inBudget: boolean;
}) {
  const href = `/book/${scenarioId}/${pandit.id}`;
  const cardClass = `flex flex-col rounded-lg border bg-card px-4 py-3.5 ${
    best ? "gap-2.5 border-hairgold shadow-warm" : "gap-2 border-hairline"
  }`;

  const content = (
    <>
      <div className="flex items-start gap-3">
        <Avatar initials={pandit.initials} size={best ? 52 : 44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-disp text-[17px] font-bold text-maroon">
              {pandit.name}
            </span>
            {best && (
              <span className="flex-none">
                <Tag kind="match">Best match</Tag>
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
            <Star />
            <span className="font-semibold">
              {pandit.rating} ({pandit.ratingCount})
            </span>
            <span className="text-inksoft">
              · {pandit.years} yrs · {pandit.distanceKm.toFixed(1)} km
            </span>
          </div>
        </div>
      </div>

      <span className="text-[13px]">{pandit.langLine}</span>
      {best && (
        <span className="text-[13px] text-inksoft">
          {pandit.credential} · {pandit.specializes.join(" · ")}
        </span>
      )}

      <div className="flex items-end justify-between">
        <div>
          <div
            className={`font-disp font-bold text-maroon ${
              best ? "text-[20px]" : "text-[17px]"
            }`}
          >
            {formatINR(pandit.price)}
          </div>
          <div className="text-[12px] text-inksoft">
            {best
              ? "pandit dakshina · samagri separate"
              : "dakshina · samagri separate"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Tag kind={inBudget ? "budget" : "over"}>
            {inBudget ? "In budget" : "Above budget"}
          </Tag>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-green">
            <Check size={13} strokeWidth={2.4} />
            {best ? "Verified in person" : "Verified"}
          </span>
        </div>
      </div>

      {best && (
        <Link
          href={href}
          className="flex min-h-[44px] items-center justify-center rounded-md border-[1.5px] border-maroon text-[16px] font-semibold text-maroon"
        >
          View profile
        </Link>
      )}
    </>
  );

  if (best) {
    return <div className={cardClass}>{content}</div>;
  }
  return (
    <Link href={href} className={cardClass}>
      {content}
    </Link>
  );
}
