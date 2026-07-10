import { notFound } from "next/navigation";
import { getPandit, getPuja, getScenario, scenarios } from "@/lib/data";
import { TopBar } from "@/components/ui";
import BookingClient from "@/components/BookingClient";

export function generateStaticParams() {
  return scenarios.flatMap((s) =>
    s.panditIds.map((panditId) => ({ scenarioId: s.id, panditId })),
  );
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ scenarioId: string; panditId: string }>;
}) {
  const { scenarioId, panditId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  const puja = getPuja(scenario.pujaId);
  const pandit = getPandit(panditId);
  if (!puja || !pandit) notFound();

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="Pandit profile" backHref={`/pandits/${scenario.id}`} />
      <BookingClient scenario={scenario} puja={puja} pandit={pandit} />
    </main>
  );
}
