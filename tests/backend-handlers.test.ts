import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProposalValidationError } from "../src/lib/configuration";
import { configResponse, proposeResponse } from "../src/lib/server/handlers";
import { PublicError } from "../src/lib/server/security";
import { configureEnvironment, origin, proposal, request, services, validRequest } from "./backend-fixtures";

beforeEach(configureEnvironment);
afterEach(() => vi.unstubAllEnvs());

describe("public proposal admission", () => {
  it("issues a private no-store signed visitor cookie", async () => {
    const response = configResponse(new Request(`${origin}/api/config`));
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("spatial_visitor=");
    expect(await response.json()).toEqual({ liveEnabled: true, model: "gpt-6.1-sol", unavailableReason: null });
  });

  it("keeps manual editing available when the live route is disabled", async () => {
    vi.stubEnv("SPATIAL_LIVE_ENABLED", "false");
    const response = configResponse(new Request(`${origin}/api/config`));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toMatchObject({ liveEnabled: false });
  });

  it("makes exactly one admitted provider call and releases only concurrency", async () => {
    const { dependencies, store } = services();
    const response = await proposeResponse(request(), dependencies);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(proposal);
    expect(dependencies.propose).toHaveBeenCalledExactlyOnceWith(validRequest);
    expect(store.reserve).toHaveBeenCalledOnce();
    expect(store.release).toHaveBeenCalledWith(...store.reserve.mock.calls[0]);
    expect(dependencies.verifyBrowser).toHaveBeenCalledOnce();
  });

  it("rejects missing or cross-origin requests before browser, storage and provider work", async () => {
    for (const origin of ["", "null", "https://attacker.example", "https://spatial.example.attacker.example"]) {
      const { dependencies, store } = services();
      expect((await proposeResponse(request(validRequest, { origin }), dependencies)).status).toBe(403);
      expect(store.reserve).not.toHaveBeenCalled();
      expect(dependencies.verifyBrowser).not.toHaveBeenCalled();
      expect(dependencies.propose).not.toHaveBeenCalled();
    }
  });

  it("requires a signed cookie instead of minting a quota bypass on POST", async () => {
    const { dependencies, store } = services();
    for (const cookie of ["", "spatial_visitor=tampered"]) {
      const response = await proposeResponse(request(validRequest, { cookie }), dependencies);
      expect(response.status).toBe(403);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
    expect(store.reserve).not.toHaveBeenCalled();
  });

  it.each([{ consent: false }, { prompt: "x".repeat(601) }, { prompt: " " }, { catalogue: [] }, { totalCents: 1 }, { budgetCents: 50_000.5 }, { locks: ["deskId", "deskId"] }, { current: { ...validRequest.current, chairId: "unknown" } }])("rejects unsupported or unconsented payload %#", async patch => {
    const { dependencies } = services();
    expect((await proposeResponse(request({ ...validRequest, ...patch }), dependencies)).status).toBe(400);
    expect(dependencies.propose).not.toHaveBeenCalled();
  });

  it("rejects missing browser proof and verification failures before admission", async () => {
    const { dependencies, store } = services();
    dependencies.verifyBrowser.mockResolvedValueOnce(false);
    expect((await proposeResponse(request(), dependencies)).status).toBe(403);
    dependencies.verifyBrowser.mockRejectedValueOnce(new Error("private verifier details"));
    const response = await proposeResponse(request(), dependencies);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private");
    expect(store.reserve).not.toHaveBeenCalled();
  });

  it("fails closed on Redis failure without leaking provider details", async () => {
    const { dependencies, store } = services();
    store.reserve.mockRejectedValueOnce(new Error("private Redis credentials"));
    const response = await proposeResponse(request(), dependencies);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("credentials");
    expect(dependencies.propose).not.toHaveBeenCalled();
  });

  it("preserves the reservation after uncertain provider failure without retry", async () => {
    const { dependencies, store } = services();
    dependencies.propose.mockRejectedValueOnce(new PublicError("The assistant is temporarily unavailable.", 502));
    expect((await proposeResponse(request(), dependencies)).status).toBe(502);
    expect(dependencies.propose).toHaveBeenCalledOnce();
    expect(store.release).not.toHaveBeenCalled();
  });

  it("returns infeasible proposals as unavailable, preserving the incoming revision", async () => {
    const { dependencies, store } = services();
    dependencies.propose.mockRejectedValueOnce(new ProposalValidationError("The proposal changed a pinned choice and was rejected. Your scene has not changed."));
    const response = await proposeResponse(request(), dependencies);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "unavailable", configuration: null, changedKeys: [], totalCents: null, revision: validRequest.revision });
    expect(store.release).toHaveBeenCalledOnce();
  });

  it("returns a completed proposal if releasing concurrency fails", async () => {
    const { dependencies, store } = services();
    store.release.mockRejectedValueOnce(new Error("Redis disconnected"));
    const response = await proposeResponse(request(), dependencies);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(proposal);
    expect(dependencies.propose).toHaveBeenCalledOnce();
  });
});
