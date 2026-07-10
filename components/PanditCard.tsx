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
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-lg border bg-card px-4 py-3.5 ${
        best ? "border-hairgold shadow-warm" : "border-hairline"
      }`}
    >
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
              · {pandit.years} yrs · {pandit.distanceKm} km
            </span>
          </div>
        </div>
      </div>

      <span className="text-[13px]">{pandit.langLine}</span>
      <span className="text-[13px] text-inksoft">
        {pandit.credential} · {pandit.specializes.join(" · ")}
      </span>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-disp text-[20px] font-bold text-maroon">
            {formatINR(pandit.price)}
          </div>
          <div className="text-[12px] text-inksoft">
            pandit dakshina · samagri separate
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Tag kind={inBudget ? "budget" : "over"}>
            {inBudget ? "In budget" : "Above budget"}
          </Tag>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-green">
            <Check size={13} />
            Verified
          </span>
        </div>
      </div>

      <Link
        href={`/book/${scenarioId}/${pandit.id}`}
        className="flex min-h-[44px] items-center justify-center rounded-md border-[1.5px] border-maroon text-[15px] font-semibold text-maroon"
      >
        View profile
      </Link>
    </div>
  );
}
