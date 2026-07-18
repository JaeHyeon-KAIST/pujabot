import Link from "next/link";
import type { Pandit, Scenario } from "@/lib/data";
import { formatINR, panditMatchesDeity } from "@/lib/data";
import { Check, Star, Temple } from "./icons";
import { Avatar, Tag } from "./ui";

export default function PanditCard({
  pandit,
  scenario,
  scenarioId,
  best = false,
}: {
  pandit: Pandit;
  scenario: Scenario;
  scenarioId: string;
  best?: boolean;
}) {
  const href = `/book/${scenarioId}/${pandit.id}`;
  const { temple } = pandit;
  const cardClass = `flex flex-col rounded-lg border bg-card px-4 py-3.5 ${
    best ? "gap-2.5 border-hairgold shadow-warm" : "gap-2 border-hairline"
  }`;

  return (
    <div className={cardClass}>
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

      <div className="flex flex-wrap items-center gap-1.5">
        {panditMatchesDeity(pandit, scenario) ? (
          <Tag kind="match">Devoted to {pandit.deity} — your deity</Tag>
        ) : (
          <Tag kind="over">Devoted to {pandit.deity}</Tag>
        )}
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-green">
          <Check size={13} strokeWidth={2.4} />
          {best ? "Verified in person" : "Verified"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-md bg-cardwarm px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Temple size={17} className="flex-none text-maroon" />
          <span className="text-[13px] font-bold text-maroon">
            {temple.name}
          </span>
          <span className="text-[12px] text-inksoft">
            · {temple.purohitType} purohit · {temple.distanceKm} km
          </span>
        </div>
        <p className="text-[13px]">
          Main deity: <b className="text-maroon">{temple.mainDeity}</b> —
          worshipped as {temple.worshippedAs}
          {temple.lineage ? ` · ${temple.lineage} lineage` : ""}
        </p>
      </div>

      <span className="text-[13px]">{pandit.langLine}</span>

      <div className="flex flex-col">
        <span
          className={`font-disp font-bold text-maroon ${
            best ? "text-[20px]" : "text-[17px]"
          }`}
        >
          from {formatINR(pandit.price)}
        </span>
        <span className="text-[12px] text-inksoft">
          minimum dakshina — offer more if you wish
        </span>
      </div>

      <Link
        href={href}
        className={
          best
            ? "btn-key flex min-h-[46px] items-center justify-center rounded-md bg-saffron text-[16px] font-bold text-maroondeep"
            : "flex min-h-[46px] items-center justify-center rounded-md border-[1.5px] border-maroon text-[16px] font-semibold text-maroon"
        }
      >
        Book
      </Link>
    </div>
  );
}
