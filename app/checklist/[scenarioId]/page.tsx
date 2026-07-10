import { notFound } from "next/navigation";
import { getPuja, getScenario, scenarios, vendors } from "@/lib/data";
import { TopBar } from "@/components/ui";
import BackChevron from "@/components/BackChevron";
import ChecklistClient from "@/components/ChecklistClient";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function ChecklistPage({
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
      <TopBar title="Samagri checklist" leading={<BackChevron />} />
      <ChecklistClient
        scenario={scenario}
        puja={puja}
        vendors={vendors[scenario.city]}
      />
    </main>
  );
}
