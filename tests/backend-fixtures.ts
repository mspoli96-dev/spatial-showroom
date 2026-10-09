import { vi } from "vitest";
import { DEFAULT_CONFIGURATION } from "../src/lib/catalog";
import type { Proposal, ProposalRequest } from "../src/lib/contracts";
import type { ProposalDependencies } from "../src/lib/server/handlers";
import { newVisitor } from "../src/lib/server/security";

export const origin = "https://spatial.example";
export const validRequest: ProposalRequest = { prompt: "Make it warmer.", current: DEFAULT_CONFIGURATION, budgetCents: 150_000, locks: [], revision: "test-revision-1", consent: true };
export const proposal: Proposal = { status: "proposal", configuration: { ...DEFAULT_CONFIGURATION, finish: "walnut" }, explanation: "A warmer wood finish.", limitations: [], revision: validRequest.revision, changedKeys: ["finish"], totalCents: 118_500, model: "gpt-6.1-sol" };

export function configureEnvironment(): void {
  vi.stubEnv("APP_ORIGIN", origin);
  vi.stubEnv("SESSION_SECRET", "test-only-signing-secret-with-at-least-32-characters");
  vi.stubEnv("OPENAI_API_KEY", "test-only-nonfunctional-value");
  vi.stubEnv("KV_REST_API_URL", "https://test-redis.example");
  vi.stubEnv("KV_REST_API_TOKEN", "test-only-redis-value");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("SPATIAL_LIVE_ENABLED", "true");
  vi.stubEnv("SPATIAL_COST_RESERVATION_CONFIRMED", "true");
  vi.stubEnv("OPENAI_PROJECT_HARD_LIMIT_CONFIRMED", "true");
  vi.stubEnv("VERCEL_BOTID_ENABLED", "true");
  vi.stubEnv("VERCEL_RATE_LIMIT_CONFIRMED", "true");
  vi.stubEnv("SPATIAL_MONTHLY_BUDGET_USD", "18");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "production");
}

export function request(body: unknown = validRequest, headers: Record<string, string> = {}): Request {
  return new Request(`${origin}/api/propose`, { method: "POST", headers: { origin, "content-type": "application/json", cookie: newVisitor(new Request(origin)).cookie.split(";")[0], ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
}

export function services() {
  const store = { reserve: vi.fn().mockResolvedValue(undefined), release: vi.fn().mockResolvedValue(undefined) };
  const dependencies = { store: vi.fn(() => store), propose: vi.fn().mockResolvedValue(proposal), verifyBrowser: vi.fn().mockResolvedValue(true) } satisfies ProposalDependencies;
  return { dependencies, store };
}
