import { proposeResponse } from "../../../lib/server/handlers";

export const runtime = "nodejs";
export const maxDuration = 60;

export function POST(request: Request): Promise<Response> {
  return proposeResponse(request);
}
