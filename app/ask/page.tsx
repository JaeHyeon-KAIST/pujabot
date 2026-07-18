import { graphForViz } from "@/lib/kb/graph";
import AskDemo from "@/components/AskDemo";

export const metadata = { title: "Ask PujaBot — verified graph demo" };

export default function AskPage() {
  const viz = graphForViz();
  return <AskDemo viz={viz} />;
}
