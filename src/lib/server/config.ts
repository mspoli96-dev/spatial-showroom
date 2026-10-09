import type { LiveConfig } from "../contracts";
import { PROPOSAL_MODEL } from "../configuration";

export const MODEL = PROPOSAL_MODEL;
export const VISITOR_COOKIE = "spatial_visitor";
export const VISITOR_DAILY_LIMIT = 5;
export const GLOBAL_DAILY_LIMIT = 30;
export const CONCURRENT_LIMIT = 2;
export const RESERVATION_SECONDS = 120;
export const MAX_OUTPUT_TOKENS = 1_600;
export const PROVIDER_TIMEOUT_MS = 45_000;

export function hostedEnvironment(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

export function redisConfiguration(): { url: string; token: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || "",
  };
}

function monthlyBudget(): number {
  const value = process.env.SPATIAL_MONTHLY_BUDGET_USD;
  if (value === undefined) return 18_000_000;
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return 0;
  const result = Math.round(Number(value) * 1_000_000);
  return Number.isSafeInteger(result) && result > 0 && result <= 18_000_000 ? result : 0;
}

export function budgetLimits(): { monthlyMicroUsd: number; reserveMicroUsd: number } {
  return { monthlyMicroUsd: monthlyBudget(), reserveMicroUsd: 250_000 };
}

export function publicConfig(): LiveConfig {
  const redis = redisConfiguration();
  const budget = budgetLimits();
  let originReady = false;
  try {
    const origin = new URL(process.env.APP_ORIGIN ?? "");
    originReady = origin.origin === process.env.APP_ORIGIN && (origin.protocol === "https:" || (!hostedEnvironment() && origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)));
  } catch {}
  const liveEnabled = process.env.SPATIAL_LIVE_ENABLED === "true"
    && Boolean(process.env.OPENAI_API_KEY?.trim())
    && (process.env.SESSION_SECRET?.length ?? 0) >= 32
    && Boolean(redis.url && redis.token)
    && originReady
    && process.env.OPENAI_PROJECT_HARD_LIMIT_CONFIRMED === "true"
    && process.env.SPATIAL_COST_RESERVATION_CONFIRMED === "true"
    && budget.monthlyMicroUsd >= budget.reserveMicroUsd
    && (!hostedEnvironment() || (process.env.VERCEL_BOTID_ENABLED === "true" && process.env.VERCEL_RATE_LIMIT_CONFIRMED === "true"));
  return { liveEnabled, model: MODEL, unavailableReason: liveEnabled ? null : "Live design proposals are temporarily unavailable. You can still edit and share your room manually." };
}
