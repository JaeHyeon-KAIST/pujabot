import { notFound } from "next/navigation";
import Link from "next/link";
import { getPuja, getScenario, scenarios } from "@/lib/data";
import { ArrowRight, Check, Clock, Play } from "@/components/icons";
import { TopBar } from "@/components/ui";
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

  return (
    <main className="flex min-h-dvh flex-col pb-6">
      <TopBar title={puja.name} backHref={`/result/${scenario.id}`} />

      <div className="mx-auto w-full max-w-[640px] px-5">
        {/* Deity artwork — full, uncropped, top placement (never footer/thumb zones), no overlays */}
        <figure className="mt-1.5 overflow-hidden rounded-md border border-hairgold bg-cardwarm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={puja.art.src}
            alt={puja.art.alt}
            className="mx-auto h-auto max-h-[300px] w-auto max-w-full py-3"
          />
          <figcaption className="border-t border-hairgold px-3 py-1.5 text-center text-[11px] text-goldink">
            <span className="font-semibold">{puja.art.caption}</span> ·{" "}
            {puja.art.credit}
          </figcaption>
        </figure>

        <p className="mt-4">
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
        <div className="mt-2 flex items-center gap-2 text-inksoft">
          <Clock />
          <span className="text-[13px]">{puja.when}</span>
        </div>

        <div className="mt-6">
          <span className="kicker">
            The ritual · {puja.steps.length} steps · follow along
          </span>
          <div className="mt-3">
            <StepsList steps={puja.steps} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-lg border border-hairline bg-card px-3.5 py-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-maroon text-ground">
            <Play />
          </span>
          <div>
            <div className="font-semibold text-maroon">How to perform — video</div>
            <div className="text-[13px] text-inksoft">
              Short clips per step, recorded with partner pandits · coming soon
            </div>
          </div>
        </div>

        {/* Retrieved scripture — Deep Sanctum block, visually distinct from UI text */}
        <div className="mt-5 flex flex-col gap-2 rounded-lg bg-sanctum px-[18px] py-5 text-sanctumtext">
          <span className="kicker" style={{ color: "#d4af37" }}>
            Mantra · retrieved template
          </span>
          <div className="font-scrip text-[23px] leading-[1.4]">
            {puja.mantra.dev}
          </div>
          <div className="font-scrip text-[15px] opacity-90">
            {puja.mantra.iast}
          </div>
          <div className="text-[12px] opacity-75">{puja.mantra.note}</div>
          <hr className="my-1.5 h-px border-none bg-sanctumgold/35" />
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-sanctumgreen">
            <Check size={15} />
            {puja.review.label}
          </span>
          <span className="text-[12px] opacity-70">
            Retrieved from a reviewed template — never AI-generated.
          </span>
        </div>

        <Link
          href={`/checklist/${scenario.id}`}
          className="mt-6 flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border-[1.5px] border-maroon text-[16px] font-semibold text-maroon"
        >
          Samagri checklist &amp; nearby vendors
        </Link>
        <Link
          href={`/pandits/${scenario.id}`}
          className="btn-key mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-saffron px-5 text-[16px] font-bold text-maroondeep"
        >
          Find My Pandit
          <ArrowRight />
        </Link>
      </div>
    </main>
  );
}
