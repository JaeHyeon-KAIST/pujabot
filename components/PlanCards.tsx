import Link from "next/link";
import { Check, ChevronRight, Diya, ListDots, Person, Urn } from "@/components/icons";
import { BadgeGreen } from "@/components/ui";
import {
  formatINR,
  getAuspiciousDates,
  panditsForScenario,
  type AuspiciousDate,
  type Puja,
  type Scenario,
} from "@/lib/data";

/** One "Plan your puja" tile — icon, title, subtitle, and a bottom CTA row. */
function PlanCard({
  href,
  icon,
  title,
  subtitle,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-lg border border-hairline bg-card p-3.5 shadow-warm"
    >
      <span className="text-maroon">{icon}</span>
      <div className="mt-2.5 text-[15px] font-bold text-maroon">{title}</div>
      <div className="mt-1 text-[12px] leading-snug text-inksoft">{subtitle}</div>
      <span className="mt-auto flex items-center gap-1 pt-3 text-[12px] font-semibold text-maroon">
        {cta}
        <ChevronRight size={12} />
      </span>
    </Link>
  );
}

/** The four next-step tiles on the recommendation screen (V2). Any order. */
export default function PlanCards({
  scenario,
  puja,
  chosen,
}: {
  scenario: Scenario;
  puja: Puja;
  chosen?: AuspiciousDate;
}) {
  const pandits = panditsForScenario(scenario);
  const fromPrice = pandits.length
    ? formatINR(Math.min(...pandits.map((p) => p.price)))
    : "";
  const nearest = getAuspiciousDates(puja.id).dates[0].nearestLabel ?? "";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* a) Auspicious dates — chosen vs. not-yet-chosen */}
      {chosen ? (
        <Link
          href={`/dates/${scenario.id}`}
          className="flex flex-col rounded-lg border border-hairgold bg-cardwarm p-3.5 shadow-warm"
        >
          <div className="flex items-center justify-between">
            <span className="text-maroon">
              <Diya size={24} />
            </span>
            <BadgeGreen>
              <Check size={13} />
              Date set
            </BadgeGreen>
          </div>
          <div className="mt-2.5 text-[15px] font-bold text-maroon">
            {chosen.shortWhen}
          </div>
          <div className="mt-1 text-[12px] leading-snug text-inksoft">
            {chosen.shortSub}
          </div>
          <span className="mt-auto flex items-center gap-1 pt-3 text-[12px] font-semibold text-maroon">
            Change date
            <ChevronRight size={12} />
          </span>
        </Link>
      ) : (
        <PlanCard
          href={`/dates/${scenario.id}`}
          icon={<Diya size={24} />}
          title="Auspicious dates"
          subtitle={nearest}
          cta="View dates"
        />
      )}

      {/* b) Book a pandit */}
      <PlanCard
        href={`/pandits/${scenario.id}`}
        icon={<Person size={24} />}
        title="Book a pandit"
        subtitle={`4 nearby · ${scenario.deity}-devoted first · from ${fromPrice}`}
        cta="See pandits"
      />

      {/* c) Samagri checklist */}
      <PlanCard
        href={`/checklist/${scenario.id}`}
        icon={<Urn size={24} />}
        title="Samagri checklist"
        subtitle="22 essentials · delivery or stores nearby"
        cta="Open checklist"
      />

      {/* d) Puja process */}
      <PlanCard
        href={`/puja/${scenario.id}`}
        icon={<ListDots size={24} />}
        title="Puja process"
        subtitle="7 steps · 1.5–2 hrs · follow along"
        cta="See the ritual"
      />
    </div>
  );
}
