import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPuja, getScenario, scenarios } from "@/lib/data";
import { ArrowRight, Chat, Check, ChevronRight } from "@/components/icons";
import { DISCLAIMER, FooterNote, Tag, TopBar } from "@/components/ui";
import DateBlock from "@/components/DateBlock";
import WhyExpander from "@/components/WhyExpander";
import YouSaid from "@/components/YouSaid";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  if (!puja) notFound();

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="Your Puja" backHref="/" />

      <div className="mx-auto w-full max-w-[1080px] flex-1 px-5 lg:mt-2 lg:grid lg:grid-cols-[minmax(0,1.6fr)_400px] lg:items-start lg:gap-6">
        {/* Left column: what we understood + the recommendation */}
        <div className="flex flex-col gap-3">
          <Suspense
            fallback={
              <div className="rounded-lg bg-cardwarm px-3.5 py-2.5 text-[13px]">
                You said: &ldquo;{scenario.sampleInput}&rdquo;
              </div>
            }
          >
            <YouSaid fallback={scenario.sampleInput} />
          </Suspense>

          {/* Read-only "what we understood" facets — deliberately NOT chip/button styled */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12px] font-semibold text-inksoft">
              We read:
            </span>
            {scenario.chips.map((c, i) => (
              <span
                key={c}
                className={`inline-flex items-center rounded-sm px-2 py-[3px] text-[12px] ${
                  i === 0
                    ? "bg-maroon/8 font-semibold text-maroon"
                    : "bg-cardwarm text-ink/80"
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          {scenario.id === "general" && (
            <div className="flex items-start gap-2.5 rounded-lg border border-wa/20 bg-wabubble px-3.5 py-3">
              <span className="mt-0.5 flex-none text-wa">
                <Chat size={16} />
              </span>
              <p className="text-[13px] leading-relaxed text-waink">
                We&rsquo;ve noted your exact words —{" "}
                <span className="font-semibold">
                  a pandit will review them and confirm or adjust this on
                  WhatsApp.
                </span>{" "}
                Meanwhile, here&rsquo;s the most widely performed blessing
                ritual. Nothing is ever auto-generated.
              </p>
            </div>
          )}

          <div className="torana rounded-lg border border-hairline bg-card px-[18px] pb-[18px] pt-[26px] shadow-warm lg:px-6 lg:pb-[22px] lg:pt-[30px]">
            <span className="kicker">Suggested puja</span>
            <h2 className="mt-1 font-disp text-[25px] font-bold leading-tight text-maroon lg:text-[31px]">
              {puja.name}
            </h2>
            <div className="mt-0.5 font-scrip text-[18px] text-goldink lg:text-[20px]">
              {puja.dev}
            </div>
            <div className="mt-2">
              <Tag kind="match">{scenario.matchBadge}</Tag>
            </div>
            <p className="mt-2.5 lg:text-[17px]">{puja.benefit}</p>
            <p className="mt-1 text-[12px] text-inksoft">{scenario.basisTag}</p>
            <Link
              href={`/puja/${scenario.id}`}
              className="mt-3.5 flex min-h-[42px] items-center justify-center gap-1.5 rounded-md border-[1.5px] border-maroon text-[14px] font-semibold text-maroon"
            >
              Ritual steps · mantra · samagri
              <ChevronRight size={14} />
            </Link>
          </div>

          <WhyExpander title="Why this puja?">{scenario.whyPuja}</WhyExpander>
        </div>

        {/* Right rail: date + trust + next step */}
        <div className="mt-3 flex flex-col gap-3 lg:mt-0">
          <DateBlock date={scenario.date} />

          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-green">
            <Check size={15} />
            {puja.review.label}
          </span>

          {(() => {
            // Tap-through: open the alternative puja's detail (steps · mantra · samagri)
            const altScenario = scenarios.find(
              (s) => s.pujaId === scenario.alsoConsider.pujaId,
            );
            const inner = (
              <>
                <span className="min-w-0 flex-1 text-[13px]">
                  <span className="font-semibold text-maroon">
                    Also consider:
                  </span>{" "}
                  {scenario.alsoConsider.reason}
                </span>
                <span className="flex-none text-maroon">
                  <ChevronRight />
                </span>
              </>
            );
            const cls =
              "flex items-center justify-between gap-2.5 rounded-lg bg-cardwarm px-3.5 py-3";
            return altScenario ? (
              <Link href={`/puja/${altScenario.id}`} className={cls}>
                {inner}
              </Link>
            ) : (
              <div className={cls}>{inner}</div>
            );
          })()}

          <Link
            href={`/pandits/${scenario.id}`}
            className="btn-key mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
          >
            Find My Pandit
            <ArrowRight />
          </Link>
        </div>
      </div>

      <FooterNote>{DISCLAIMER}</FooterNote>
    </main>
  );
}
