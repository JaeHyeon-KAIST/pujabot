import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuspiciousDate, getPuja, getScenario, scenarios } from "@/lib/data";
import { Chat } from "@/components/icons";
import { FooterNote, Tag, TopBar } from "@/components/ui";
import PlanCards from "@/components/PlanCards";
import WhyExpander from "@/components/WhyExpander";
import YouSaid from "@/components/YouSaid";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { scenarioId } = await params;
  const { date } = await searchParams;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  if (!puja) notFound();
  const chosenDate = getAuspiciousDate(puja.id, date);

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="Your Puja" backHref="/" />

      <div className="mx-auto mt-1.5 w-full max-w-[640px] flex-1 px-5">
        <div className="flex flex-col gap-3">
          {/* You said — echo the seeker's own words, with an Edit affordance home */}
          <Suspense
            fallback={
              <div className="flex items-center justify-between gap-2.5 rounded-lg bg-cardwarm px-3.5 py-2.5">
                <span className="min-w-0 flex-1 text-[13px]">
                  You said: &ldquo;{scenario.sampleInput}&rdquo;
                </span>
                <span className="flex-none text-[13px] font-semibold text-maroon">
                  Edit
                </span>
              </div>
            }
          >
            <YouSaid fallback={scenario.sampleInput} />
          </Suspense>

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

          {/* Suggested puja — torana card */}
          <div className="torana mt-1 rounded-lg border border-hairline bg-card px-[18px] pb-[18px] pt-[26px] shadow-warm lg:px-6 lg:pb-[22px] lg:pt-[30px]">
            <span className="kicker">Suggested puja</span>
            <h2 className="mt-2 font-disp text-[25px] font-bold leading-tight text-maroon lg:text-[31px]">
              {puja.name}
            </h2>
            <div className="mt-1.5 font-scrip text-[18px] text-goldink lg:text-[20px]">
              {puja.dev}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Tag kind="match">{scenario.deity} · your deity</Tag>
              <Tag kind="over">{scenario.state} timings</Tag>
            </div>
            <p className="mt-3.5 lg:text-[17px]">{puja.benefit}</p>
            <p className="mt-2 text-[12px] text-inksoft">
              Based on: your intent + panchang · sourced from 7 verified guides
            </p>
          </div>

          {/* Why this puja matters — explainability, open by default */}
          <WhyExpander title="Why this puja matters" defaultOpen>
            {scenario.whyPuja}
          </WhyExpander>

          {/* Plan your puja — four next steps, any order */}
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <span className="kicker">Plan your puja</span>
              <span className="text-[12px] text-inksoft">in any order</span>
            </div>
            <div className="mt-2.5">
              <PlanCards scenario={scenario} puja={puja} chosen={chosenDate} />
            </div>
          </div>
        </div>
      </div>

      <FooterNote>
        PujaBot helps you prepare — it does not replace the guidance of a
        qualified pandit. Ritual content sourced from 7 verified guides — pandit
        review in progress. Never AI-generated.
      </FooterNote>
    </main>
  );
}
