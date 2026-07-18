import { notFound } from "next/navigation";
import Link from "next/link";
import { getPuja, getReelSteps, getScenario, scenarios } from "@/lib/data";
import { ArrowRight, Clock } from "@/components/icons";
import { FooterNote, TopBar } from "@/components/ui";
import StepsList from "@/components/StepsList";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function PujaDetailPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  if (!puja) notFound();

  const isSatya = puja.id === "satyanarayan";
  const steps = getReelSteps(puja.id);

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="Puja process" backHref={`/result/${scenario.id}`} />

      <div className="mx-auto w-full max-w-[640px] px-5">
        {/* Deity artwork — full, uncropped, top placement (never footer/thumb zones), no overlays */}
        <figure className="mt-1.5 overflow-hidden rounded-md border border-hairgold bg-cardwarm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              isSatya
                ? "/steps/hero_vishnu-shesha_ravi-varma.jpg"
                : puja.art.src
            }
            alt={
              isSatya
                ? "Vishnu on Shesha, with Lakshmi & Saraswati"
                : puja.art.alt
            }
            className="mx-auto h-auto max-h-[300px] w-auto max-w-full py-3"
          />
          <figcaption className="border-t border-hairgold px-3 py-1.5 text-center text-[11px] text-goldink">
            {isSatya ? (
              <>
                <span className="font-semibold">
                  Vishnu on Shesha, with Lakshmi &amp; Saraswati
                </span>{" "}
                · Raja Ravi Varma oleograph, c. 1900 · public domain
              </>
            ) : (
              <>
                <span className="font-semibold">{puja.art.caption}</span> ·{" "}
                {puja.art.credit}
              </>
            )}
          </figcaption>
        </figure>

        <h3 className="mt-5 font-disp text-[20px] font-bold text-maroon">
          {puja.name}, at a glance
        </h3>
        {isSatya ? (
          <p className="mt-2 text-[14px] leading-[1.55]">
            A thanksgiving ritual to Lord Vishnu, centered on the 5-chapter{" "}
            <span className="font-semibold">Satyanarayan Katha</span>. Seven
            steps, in this order — your pandit leads every one.
          </p>
        ) : (
          <p className="mt-2 text-[14px] leading-[1.55]">
            {puja.what.split("**").map((part, i) =>
              i % 2 === 1 ? (
                <span key={i} className="font-semibold">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-inksoft">
          <Clock />
          <span className="text-[13px]">
            1.5 – 2 hours in total · at home · times are estimates
          </span>
        </div>

        {isSatya && (
          <div className="mt-5 flex flex-col rounded-lg bg-cardwarm p-[14px_16px]">
            <span className="kicker">Before you begin</span>
            <p className="mt-2 text-[14px] leading-[1.55]">
              Clean and decorate the puja area and set a wooden chowki (low
              platform) in the north-east corner, cover it with a red or yellow
              cloth, and place the idols or photo of Lord Satyanarayan and
              Goddess Lakshmi on it. Decorate the mandap with mango leaves and
              banana stems, and sit facing east or north.
            </p>
            <p className="mt-2 text-[12px] text-inksoft">
              Sources: 99pandit · panditjionway · smartpuja
            </p>
          </div>
        )}

        <div className="mt-6">
          <span className="kicker">The ritual · {steps.length} steps</span>
          <div className="mt-3">
            <StepsList steps={steps} />
          </div>
        </div>

        <Link
          href={`/steps/${scenario.id}`}
          className="btn-key mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
        >
          Step-by-step guide
          <ArrowRight />
        </Link>
        <p className="mt-2 text-center text-[12px] text-inksoft">
          One card per step · pictures · mantras with meaning &amp; audio
        </p>
      </div>

      <FooterNote>
        Ritual content sourced from 7 verified guides — pandit review in
        progress. Never AI-generated.
      </FooterNote>
    </main>
  );
}
