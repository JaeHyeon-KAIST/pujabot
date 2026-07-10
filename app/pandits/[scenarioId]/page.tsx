import { notFound } from "next/navigation";
import { getScenario, panditsForScenario, scenarios } from "@/lib/data";
import PanditListClient from "@/components/PanditListClient";
import { TopBar } from "@/components/ui";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

const CITY_LABEL: Record<string, string> = {
  bengaluru: "HSR Layout, Bengaluru",
  delhi: "Lajpat Nagar, Delhi",
};

export default async function PanditsPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const list = panditsForScenario(scenario);

  return (
    <main className="flex min-h-dvh flex-col pb-6">
      <TopBar title="Choose your pandit" backHref={`/result/${scenario.id}`} />
      <div className="mx-auto w-full max-w-[1080px] px-5">
        <PanditListClient
          scenario={scenario}
          pandits={list}
          cityLabel={CITY_LABEL[scenario.city]}
        />
      </div>
    </main>
  );
}
