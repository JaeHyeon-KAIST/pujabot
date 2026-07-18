/**
 * 결정론 상세 조회 — LLM 무관여 경로.
 * 검색이 푸자를 식별하면 UI가 이 엔드포인트로 그래프를 직접 조회해 단계 패널을 그린다.
 * (실제 앱 임포트 시에도 이 경로가 본선: 결과는 항상 그래프에서, LLM은 의도 해석만.)
 */
import { getPujaDetails } from "@/lib/kb/graph";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return Response.json(getPujaDetails(id));
}
