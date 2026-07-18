import { notFound } from "next/navigation";
import { getAuspiciousDates, getPuja, getScenario, scenarios } from "@/lib/data";
import { TopBar } from "@/components/ui";
import AuspiciousDatesClient from "@/components/AuspiciousDatesClient";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function DatesPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  if (!puja) notFound();
  const data = getAuspiciousDates(puja.id);

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="Auspicious dates" backHref={`/result/${scenario.id}`} />
      <div className="mx-auto w-full max-w-[560px] px-5">
        <AuspiciousDatesClient scenarioId={scenario.id} data={data} />
      </div>
    </main>
  );
}
