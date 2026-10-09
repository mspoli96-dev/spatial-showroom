import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIGURATION, PRODUCTS, productsFor } from "../src/lib/catalog";
import { assessConfiguration, changedKeys, configurationSchema, getPlacements, proposalRequestSchema, validateProposal } from "../src/lib/configuration";
import type { Configuration, ProposalRequest } from "../src/lib/contracts";

const input: ProposalRequest = { prompt: "Make it warmer.", current: DEFAULT_CONFIGURATION, budgetCents: 150_000, locks: [], revision: "scene-1", consent: true };
const candidate = (configuration: Configuration = DEFAULT_CONFIGURATION) => ({ status: "proposal", configuration, explanation: "A warmer workspace.", limitations: [] });

describe("catalogue contracts", () => {
  it.each([
    { ...DEFAULT_CONFIGURATION, deskId: "unknown" },
    { ...DEFAULT_CONFIGURATION, deskId: "arc-chair" },
    { ...DEFAULT_CONFIGURATION, lampId: "tower-shelf" },
    { ...DEFAULT_CONFIGURATION, finish: "marble" },
    { ...DEFAULT_CONFIGURATION, priceCents: 1 },
    { ...DEFAULT_CONFIGURATION, lighting: "night" },
  ])("rejects unsupported catalogue choices %#", configuration => {
    expect(configurationSchema.safeParse(configuration).success).toBe(false);
  });

  it("validates optional products and all integer catalogue prices", () => {
    expect(configurationSchema.safeParse({ ...DEFAULT_CONFIGURATION, lampId: null, storageId: null }).success).toBe(true);
    for (const product of PRODUCTS) expect(Number.isSafeInteger(product.priceCents) && product.priceCents > 0).toBe(true);
  });

  it.each([49_999, 500_001, 50_000.01, NaN, Infinity])("rejects invalid budget %s", budgetCents => {
    expect(proposalRequestSchema.safeParse({ ...input, budgetCents }).success).toBe(false);
  });

  it("rejects unknown and repeated locks, oversized prompts and arbitrary client metadata", () => {
    for (const patch of [{ locks: ["price"] }, { locks: ["deskId", "deskId"] }, { prompt: "x".repeat(601) }, { catalogue: [] }, { revision: "x".repeat(81) }, { consent: false }]) expect(proposalRequestSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  });
});

describe("room and budget assessment", () => {
  it("computes totals from selected products and accepts the exact budget boundary", () => {
    const result = assessConfiguration(DEFAULT_CONFIGURATION, 118_500);
    expect(result.totalCents).toBe(118_500);
    expect(result.withinBudget).toBe(true);
    expect(result.fitsRoom).toBe(true);
    const over = assessConfiguration(DEFAULT_CONFIGURATION, 118_499);
    expect(over.withinBudget).toBe(false);
    expect(over.fitsRoom).toBe(true);
  });

  it.each(["left", "right"] as const)("uses catalogue footprints and floor origins for layout %s", layout => {
    const placements = getPlacements({ ...DEFAULT_CONFIGURATION, layout });
    const desk = placements.find(item => item.category === "desk")!;
    const shelf = placements.find(item => item.category === "storage")!;
    expect(desk.position).toEqual([layout === "left" ? -0.2 : 0.2, 0, -0.85]);
    expect(shelf.position).toEqual([layout === "left" ? 1.1 : -1.1, 0, -0.93]);
    expect(desk.footprint.maxX - desk.footprint.minX).toBeCloseTo(1.4);
    expect(desk.footprint.maxZ - desk.footprint.minZ).toBeCloseTo(0.7);
  });

  it("checks every available floor combination, including the wide shelf's clearance", () => {
    for (const desk of productsFor("desk")) for (const chair of productsFor("chair")) for (const storage of [null, ...productsFor("storage")]) for (const layout of ["left", "right"] as const) {
      const result = assessConfiguration({ ...DEFAULT_CONFIGURATION, deskId: desk.id, chairId: chair.id, storageId: storage?.id ?? null, layout }, 500_000);
      const expectedFit = storage?.id !== "wide-shelf" || desk.id === "folio-110";
      expect(result.fitsRoom, `${desk.id}/${chair.id}/${storage?.id}/${layout}`).toBe(expectedFit);
      if (!expectedFit) expect(result.issues.some(issue => issue.includes("space between"))).toBe(true);
    }
  });

  it("contains each desktop lamp within every desk without treating it as a floor collision", () => {
    for (const desk of productsFor("desk")) for (const lamp of productsFor("lamp")) for (const layout of ["left", "right"] as const) {
      const result = assessConfiguration({ ...DEFAULT_CONFIGURATION, deskId: desk.id, lampId: lamp.id, storageId: null, layout }, 500_000);
      expect(result.fitsRoom).toBe(true);
      const placement = result.placements.find(item => item.category === "lamp")!;
      expect(placement.surface).toBe("desktop");
      expect(placement.position[1]).toBe(desk.height);
      expect(placement.position[0]).toBeCloseTo((layout === "left" ? -0.2 : 0.2) + desk.width / 2 - 0.18);
    }
  });
});

describe("proposal trust boundary", () => {
  it("computes changed keys and totals while preserving input and revision", () => {
    const before = structuredClone(input);
    Object.freeze(input.current);
    const result = validateProposal(candidate({ ...DEFAULT_CONFIGURATION, finish: "walnut", lampId: null }), input);
    expect(result.changedKeys).toEqual(["lampId", "finish"]);
    expect(result.totalCents).toBe(110_000);
    expect(result.revision).toBe(input.revision);
    expect(input).toEqual(before);
    result.configuration!.finish = "chalk";
    expect(input.current.finish).toBe("oak");
  });

  it("makes every pinned field immutable", () => {
    const changed: Configuration = { deskId: "folio-110", chairId: "arc-chair", lampId: null, storageId: null, finish: "walnut", fabric: "sand", layout: "right", lighting: "evening" };
    for (const key of changedKeys(DEFAULT_CONFIGURATION, changed)) expect(() => validateProposal(candidate({ ...DEFAULT_CONFIGURATION, [key]: changed[key] }), { ...input, locks: [key] })).toThrow("pinned");
  });

  it("rejects collisions, overspend and forged arithmetic", () => {
    expect(() => validateProposal(candidate({ ...DEFAULT_CONFIGURATION, deskId: "span-180", storageId: "wide-shelf" }), input)).toThrow("clearance");
    expect(() => validateProposal(candidate(), { ...input, budgetCents: 118_499 })).toThrow("budget");
    for (const patch of [{ totalCents: 1 }, { changedKeys: [] }, { revision: "other" }, { model: "other" }]) expect(() => validateProposal({ ...candidate(), ...patch }, input)).toThrow("supported configuration");
  });

  it("enforces semantic status/configuration consistency", () => {
    expect(() => validateProposal({ ...candidate(), status: "applied" }, input)).toThrow();
    expect(() => validateProposal({ ...candidate(), status: "unavailable" }, input)).toThrow("inconsistent");
    expect(() => validateProposal({ ...candidate(), configuration: null }, input)).toThrow("did not return");
    const result = validateProposal({ ...candidate(), status: "unavailable", configuration: null }, input);
    expect(result).toMatchObject({ status: "unavailable", configuration: null, changedKeys: [], totalCents: null, revision: input.revision });
  });
});
