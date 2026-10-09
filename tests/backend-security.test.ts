import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { budgetLimits, publicConfig, redisConfiguration } from "../src/lib/server/config";
import { newVisitor, readBoundedJson, visitorFromRequest } from "../src/lib/server/security";
import { configureEnvironment, origin, request } from "./backend-fixtures";

beforeEach(configureEnvironment);
afterEach(() => vi.unstubAllEnvs());

describe("visitor identity and bounded input", () => {
  it("signs a secure private cookie and rejects tampering, expiry and future lifetimes", () => {
    const now = Date.now();
    const visitor = newVisitor(new Request(origin), now);
    expect(visitor.cookie).toContain("HttpOnly; SameSite=Strict; Max-Age=86400; Secure");
    const signed = new Request(origin, { headers: { cookie: visitor.cookie } });
    expect(visitorFromRequest(signed, now)).toBe(visitor.id);
    expect(visitorFromRequest(signed, now + 86_400_001)).toBeNull();
    expect(visitorFromRequest(signed, now - 1)).toBeNull();
    expect(visitorFromRequest(new Request(origin, { headers: { cookie: visitor.cookie.replace(visitor.id, "00000000-0000-4000-8000-000000000000") } }), now)).toBeNull();
  });

  it("rejects malformed or missing cookies", () => {
    for (const cookie of ["", "spatial_visitor=bad", "spatial_visitor=../../secret", "spatial_visitor=a.b.c.d", "sceneops_visitor=unrelated"]) expect(visitorFromRequest(new Request(origin, { headers: { cookie } }))).toBeNull();
  });

  it("enforces actual body bytes even without Content-Length", async () => {
    await expect(readBoundedJson(request("x".repeat(8_193)))).rejects.toMatchObject({ status: 413 });
    await expect(readBoundedJson(request({ prompt: "é".repeat(4_096) }))).rejects.toMatchObject({ status: 413 });
  });

  it("rejects excessive declared bytes before parsing", async () => {
    await expect(readBoundedJson(request("{}", { "content-length": "8193" }))).rejects.toMatchObject({ status: 413 });
    await expect(readBoundedJson(request("{}", { "content-length": "invalid" }))).rejects.toMatchObject({ status: 413 });
  });

  it("rejects unsupported types, empty streams and malformed JSON", async () => {
    await expect(readBoundedJson(request("{}", { "content-type": "text/plain" }))).rejects.toMatchObject({ status: 415 });
    await expect(readBoundedJson(request("{bad"))).rejects.toMatchObject({ status: 400 });
    await expect(readBoundedJson(new Request(origin, { method: "POST", headers: { "content-type": "application/json" } }))).rejects.toMatchObject({ status: 400 });
  });
});

describe("fail-closed live configuration", () => {
  it("requires every paid-route prerequisite", () => {
    expect(publicConfig().liveEnabled).toBe(true);
    for (const flag of ["SPATIAL_LIVE_ENABLED", "SPATIAL_COST_RESERVATION_CONFIRMED", "OPENAI_PROJECT_HARD_LIMIT_CONFIRMED", "VERCEL_BOTID_ENABLED", "VERCEL_RATE_LIMIT_CONFIRMED"]) {
      vi.stubEnv(flag, "false");
      expect(publicConfig().liveEnabled).toBe(false);
      vi.stubEnv(flag, "true");
    }
    vi.stubEnv("SESSION_SECRET", "short");
    expect(publicConfig().liveEnabled).toBe(false);
  });

  it("uses native Vercel Redis credentials when custom variables are blank", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "  ");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "  ");
    expect(redisConfiguration()).toEqual({ url: "https://test-redis.example", token: "test-only-redis-value" });
    vi.stubEnv("KV_REST_API_TOKEN", "");
    expect(publicConfig().liveEnabled).toBe(false);
  });

  it("cannot raise the application budget or lower the fixed reservation via configuration", () => {
    expect(budgetLimits()).toEqual({ monthlyMicroUsd: 18_000_000, reserveMicroUsd: 250_000 });
    for (const value of ["20", "-1", "NaN", "1e2", "0", "0.2"]) {
      vi.stubEnv("SPATIAL_MONTHLY_BUDGET_USD", value);
      expect(publicConfig().liveEnabled).toBe(false);
    }
    vi.stubEnv("SPATIAL_MONTHLY_BUDGET_USD", "5");
    vi.stubEnv("SPATIAL_QUERY_RESERVE_USD", "0");
    expect(budgetLimits()).toEqual({ monthlyMicroUsd: 5_000_000, reserveMicroUsd: 250_000 });
  });

  it("requires a single exact HTTPS production origin", () => {
    for (const value of ["https://spatial.example/", "http://spatial.example", "*", "https://spatial.example/path"]) {
      vi.stubEnv("APP_ORIGIN", value);
      expect(publicConfig().liveEnabled).toBe(false);
    }
  });
});
