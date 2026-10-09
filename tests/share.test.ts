import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIGURATION } from "../src/lib/catalog";
import { decodeShare, encodeShare } from "../src/lib/share";

const raw = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const payload = { version: 1, configuration: DEFAULT_CONFIGURATION, budgetCents: 150_000 };
afterEach(() => vi.unstubAllGlobals());

describe("versioned configuration links", () => {
  it("round-trips only catalogue selections and budget, including over-budget manual rooms", () => {
    const value = encodeShare(DEFAULT_CONFIGURATION, 50_000);
    expect(value.length).toBeLessThan(2_048);
    expect(decodeShare(value)).toEqual({ configuration: DEFAULT_CONFIGURATION, budgetCents: 50_000 });
    expect(JSON.parse(Buffer.from(value, "base64url").toString("utf8"))).toEqual({ ...payload, budgetCents: 50_000 });
  });

  it("runs without Node Buffer in a browser", () => {
    vi.stubGlobal("Buffer", undefined);
    const value = encodeShare(DEFAULT_CONFIGURATION, 150_000);
    expect(decodeShare(value)).toEqual({ configuration: DEFAULT_CONFIGURATION, budgetCents: 150_000 });
  });

  it.each(["", "a".repeat(2_049), "!!", "e30=", "e30+", "e30/", "a", "eyJ", "_w"])("rejects malformed or noncanonical encoding %#", value => {
    expect(decodeShare(value)).toBeNull();
  });

  it("rejects unsupported versions, unknown fields and invalid choices", () => {
    for (const value of [{ ...payload, version: 2 }, { ...payload, prompt: "secret" }, { ...payload, locks: ["deskId"] }, { ...payload, budgetCents: 150_000.5 }, { ...payload, configuration: { ...DEFAULT_CONFIGURATION, deskId: "other" } }]) expect(decodeShare(raw(value))).toBeNull();
  });

  it("rejects a room collision on both encoding and decoding", () => {
    const configuration = { ...DEFAULT_CONFIGURATION, deskId: "span-180", storageId: "wide-shelf" };
    expect(() => encodeShare(configuration, 150_000)).toThrow("clearance");
    expect(decodeShare(raw({ ...payload, configuration }))).toBeNull();
  });
});
