import { notFound } from "next/navigation";
import { getPuja, getReelSteps, getScenario, scenarios } from "@/lib/data";
import StepReels from "@/components/StepReels";

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}

export default async function StepsPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  if (!puja) notFound();
  const steps = getReelSteps(puja.id);

  return (
    <StepReels
      steps={steps}
      pujaName={puja.name}
      backHref={`/puja/${scenario.id}`}
    />
  );
}
