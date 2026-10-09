import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "../src/lib/catalog";
import { assessConfiguration } from "../src/lib/configuration";
import { buildProviderRequest, proposeConfiguration } from "../src/lib/server/provider";
import { configureEnvironment, validRequest } from "./backend-fixtures";

beforeEach(configureEnvironment);
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const completed = (value: unknown) => new Response(JSON.stringify({ id: "resp_fixture", object: "response", status: "completed", model: "gpt-6.1-sol", output: [{ type: "message", id: "msg_fixture", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(value), annotations: [] }] }] }), { status: 200, headers: { "content-type": "application/json" } });

describe("canonical provider context", () => {
  it("sends the authoritative catalogue with feasible selections calculated by code", () => {
    const input = { ...validRequest, locks: ["deskId", "finish"] as const };
    const payload = buildProviderRequest({ ...input, locks: [...input.locks] });
    const context = JSON.parse(payload.input[0].content[0].text);
    expect(context.catalogue).toEqual(PRODUCTS);
    expect(context.pinnedChoices).toEqual({ deskId: validRequest.current.deskId, finish: validRequest.current.finish });
    expect(context.feasibleSelections.length).toBeGreaterThan(0);
    for (const selection of context.feasibleSelections) {
      expect(selection.deskId).toBe(validRequest.current.deskId);
      expect(assessConfiguration({ ...validRequest.current, ...selection }, validRequest.budgetCents)).toMatchObject({ fitsRoom: true, withinBudget: true });
    }
    expect(payload.text.format).toMatchObject({ type: "json_schema", strict: true, name: "spatial_proposal" });
    expect(payload.text.format.schema).toMatchObject({ additionalProperties: false });
    expect(JSON.stringify(payload)).not.toContain("SESSION_SECRET");
    expect(context).not.toHaveProperty("consent");
    expect(context).not.toHaveProperty("revision");
  });

  it("allows a clear infeasible response when all catalogue selections exceed the budget", () => {
    const payload = buildProviderRequest({ ...validRequest, budgetCents: 50_000 });
    expect(JSON.parse(payload.input[0].content[0].text).feasibleSelections).toEqual([]);
  });
});

describe("Responses SDK boundary with offline HTTP fixtures", () => {
  it("parses a completed proposal with no storage, no tools and Standard service tier", async () => {
    const fetch = vi.fn().mockResolvedValue(completed({ status: "proposal", configuration: { ...validRequest.current, finish: "walnut" }, explanation: "A warmer wood finish.", limitations: [] }));
    vi.stubGlobal("fetch", fetch);
    const result = await proposeConfiguration(validRequest);
    expect(result).toMatchObject({ status: "proposal", changedKeys: ["finish"], totalCents: 118_500, revision: validRequest.revision });
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload).toMatchObject({ store: false, service_tier: "default", model: "gpt-6.1-sol", reasoning: { effort: "low" }, max_output_tokens: 1_600 });
    expect(payload).not.toHaveProperty("tools");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("never retries a provider server error and suppresses raw diagnostics", async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ error: { message: "private provider details", type: "server_error" } }), { status: 500, headers: { "content-type": "application/json" } })));
    vi.stubGlobal("fetch", fetch);
    await expect(proposeConfiguration(validRequest)).rejects.toMatchObject({ status: 502, message: "The assistant is temporarily unavailable. Your scene has not changed." });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns unavailable for incomplete output without repair or retry", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "resp_fixture", object: "response", status: "incomplete", output: [] }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await proposeConfiguration(validRequest)).toMatchObject({ status: "unavailable", configuration: null, revision: validRequest.revision });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns unavailable for a schema-valid proposal that changes a pinned field", async () => {
    const fetch = vi.fn().mockResolvedValue(completed({ status: "proposal", configuration: { ...validRequest.current, finish: "walnut" }, explanation: "Changed the finish.", limitations: [] }));
    vi.stubGlobal("fetch", fetch);
    const result = await proposeConfiguration({ ...validRequest, locks: ["finish"] });
    expect(result).toMatchObject({ status: "unavailable", configuration: null, changedKeys: [], totalCents: null });
    expect(result.explanation).toContain("pinned");
    expect(fetch).toHaveBeenCalledOnce();
  });
});
