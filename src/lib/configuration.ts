import { z } from "zod";
import { CONFIG_KEYS, PRODUCTS, ROOM, productById } from "./catalog";
import type { Assessment, Category, Configuration, ConfigKey, Placement, Product, Proposal, ProposalRequest } from "./contracts";

export const PROPOSAL_MODEL = "gpt-6.1-sol";

function productIds(category: Category): [string, ...string[]] {
  return PRODUCTS.filter(product => product.category === category).map(product => product.id) as [string, ...string[]];
}

export const configurationSchema = z.strictObject({
  deskId: z.enum(productIds("desk")),
  chairId: z.enum(productIds("chair")),
  lampId: z.enum(productIds("lamp")).nullable(),
  storageId: z.enum(productIds("storage")).nullable(),
  finish: z.enum(["oak", "walnut", "chalk"]),
  fabric: z.enum(["sage", "sand", "charcoal"]),
  layout: z.enum(["left", "right"]),
  lighting: z.enum(["day", "evening"]),
});

export const budgetSchema = z.number().int().min(50_000).max(500_000);
export const proposalRequestSchema = z.strictObject({
  prompt: z.string().trim().min(1).max(600),
  current: configurationSchema,
  budgetCents: budgetSchema,
  locks: z.array(z.enum(CONFIG_KEYS)).max(CONFIG_KEYS.length).refine(keys => new Set(keys).size === keys.length),
  revision: z.string().min(1).max(80),
  consent: z.literal(true),
});

export const modelProposalSchema = z.strictObject({
  status: z.enum(["proposal", "unavailable"]),
  configuration: configurationSchema.nullable(),
  explanation: z.string().min(1).max(1_200),
  limitations: z.array(z.string().min(1).max(300)).max(4),
});

function place(product: Product, position: [number, number, number], surface: Placement["surface"]): Placement {
  const [x, , z] = position;
  return {
    category: product.category,
    productId: product.id,
    position,
    rotationY: 0,
    footprint: { minX: x - product.width / 2, maxX: x + product.width / 2, minZ: z - product.depth / 2, maxZ: z + product.depth / 2 },
    surface,
  };
}

export function getPlacements(configuration: Configuration): Placement[] {
  const config = configurationSchema.parse(configuration);
  const desk = productById(config.deskId)!;
  const deskX = config.layout === "left" ? -0.2 : 0.2;
  const deskZ = -0.85;
  const placements = [place(desk, [deskX, 0, deskZ], "floor"), place(productById(config.chairId)!, [deskX, 0, 0.35], "floor")];
  if (config.storageId) placements.push(place(productById(config.storageId)!, [config.layout === "left" ? 1.1 : -1.1, 0, -0.93], "floor"));
  if (config.lampId) placements.push(place(productById(config.lampId)!, [deskX + desk.width / 2 - 0.18, desk.height, deskZ + 0.02], "desktop"));
  return placements;
}

export function assessConfiguration(configuration: Configuration, budgetCents: number): Assessment {
  const budget = budgetSchema.parse(budgetCents);
  const placements = getPlacements(configuration);
  const totalCents = placements.reduce((sum, placement) => sum + productById(placement.productId)!.priceCents, 0);
  const issues: string[] = [];
  const floor = placements.filter(placement => placement.surface === "floor");
  const epsilon = 1e-9;
  for (const placement of floor) {
    const rect = placement.footprint;
    if (rect.minX < -ROOM.width / 2 + ROOM.minimumGap - epsilon || rect.maxX > ROOM.width / 2 - ROOM.minimumGap + epsilon || rect.minZ < -ROOM.depth / 2 + ROOM.minimumGap - epsilon || rect.maxZ > ROOM.depth / 2 - ROOM.minimumGap + epsilon) {
      issues.push(`${productById(placement.productId)!.name} needs more clearance from the room boundary.`);
    }
  }
  for (let index = 0; index < floor.length; index++) {
    for (let other = index + 1; other < floor.length; other++) {
      const a = floor[index].footprint;
      const b = floor[other].footprint;
      const separated = a.maxX + ROOM.minimumGap <= b.minX + epsilon || b.maxX + ROOM.minimumGap <= a.minX + epsilon || a.maxZ + ROOM.minimumGap <= b.minZ + epsilon || b.maxZ + ROOM.minimumGap <= a.minZ + epsilon;
      if (!separated) issues.push(`${productById(floor[index].productId)!.name} and ${productById(floor[other].productId)!.name} need more space between them.`);
    }
  }
  const desk = placements.find(placement => placement.category === "desk")!.footprint;
  for (const placement of placements.filter(item => item.surface === "desktop")) {
    const lamp = placement.footprint;
    if (lamp.minX < desk.minX - epsilon || lamp.maxX > desk.maxX + epsilon || lamp.minZ < desk.minZ - epsilon || lamp.maxZ > desk.maxZ + epsilon) issues.push(`${productById(placement.productId)!.name} must sit within the desk surface.`);
  }
  return { totalCents, withinBudget: totalCents <= budget, fitsRoom: issues.length === 0, issues, placements };
}

export function changedKeys(before: Configuration, after: Configuration): ConfigKey[] {
  return CONFIG_KEYS.filter(key => before[key] !== after[key]);
}

export class ProposalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProposalValidationError";
  }
}

export function validateProposal(candidate: unknown, request: ProposalRequest): Proposal {
  const input = proposalRequestSchema.safeParse(request);
  if (!input.success) throw new ProposalValidationError("The request could not be validated. Your scene has not changed.");
  const parsed = modelProposalSchema.safeParse(candidate);
  if (!parsed.success) throw new ProposalValidationError("The assistant could not produce a supported configuration. Your scene has not changed.");
  const result = parsed.data;
  const base = { explanation: result.explanation, limitations: result.limitations, revision: input.data.revision, model: PROPOSAL_MODEL };
  if (result.status === "unavailable") {
    if (result.configuration !== null) throw new ProposalValidationError("The assistant returned an inconsistent proposal. Your scene has not changed.");
    return { ...base, status: "unavailable", configuration: null, changedKeys: [], totalCents: null };
  }
  if (!result.configuration) throw new ProposalValidationError("The assistant did not return a configuration. Your scene has not changed.");
  if (input.data.locks.some(key => result.configuration![key] !== input.data.current[key])) throw new ProposalValidationError("The proposal changed a pinned choice and was rejected. Your scene has not changed.");
  const assessment = assessConfiguration(result.configuration, input.data.budgetCents);
  if (!assessment.fitsRoom) throw new ProposalValidationError("The proposal did not pass the room clearance checks. Your scene has not changed.");
  if (!assessment.withinBudget) throw new ProposalValidationError("The proposal exceeded your budget and was rejected. Your scene has not changed.");
  return { ...base, status: "proposal", configuration: result.configuration, changedKeys: changedKeys(input.data.current, result.configuration), totalCents: assessment.totalCents };
}
