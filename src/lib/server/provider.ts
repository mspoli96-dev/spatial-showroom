import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { CATALOG_VERSION, PRODUCTS, ROOM, productsFor } from "../catalog";
import { assessConfiguration, modelProposalSchema, proposalRequestSchema, ProposalValidationError, validateProposal } from "../configuration";
import type { Configuration, Proposal, ProposalRequest } from "../contracts";
import { MAX_OUTPUT_TOKENS, MODEL, PROVIDER_TIMEOUT_MS } from "./config";
import { SYSTEM_PROMPT } from "./prompt";
import { PublicError } from "./security";

function feasibleSelections(request: ProposalRequest) {
  const feasible: Pick<Configuration, "deskId" | "chairId" | "lampId" | "storageId" | "layout">[] = [];
  for (const desk of productsFor("desk")) for (const chair of productsFor("chair")) for (const lamp of [null, ...productsFor("lamp")]) for (const storage of [null, ...productsFor("storage")]) for (const layout of ["left", "right"] as const) {
    const configuration = { ...request.current, deskId: desk.id, chairId: chair.id, lampId: lamp?.id ?? null, storageId: storage?.id ?? null, layout };
    if (request.locks.some(key => configuration[key] !== request.current[key])) continue;
    const assessment = assessConfiguration(configuration, request.budgetCents);
    if (assessment.fitsRoom && assessment.withinBudget) feasible.push({ deskId: configuration.deskId, chairId: configuration.chairId, lampId: configuration.lampId, storageId: configuration.storageId, layout });
  }
  return feasible;
}

export function buildProviderRequest(request: ProposalRequest) {
  const input = proposalRequestSchema.parse(request);
  const context = {
    catalogVersion: CATALOG_VERSION,
    currency: "CAD",
    catalogue: PRODUCTS,
    room: ROOM,
    current: input.current,
    budgetCents: input.budgetCents,
    pinnedChoices: Object.fromEntries(input.locks.map(key => [key, input.current[key]])),
    feasibleSelections: feasibleSelections(input),
    prompt: input.prompt,
  };
  return {
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    store: false,
    service_tier: "default" as const,
    reasoning: { effort: "low" as const },
    max_output_tokens: MAX_OUTPUT_TOKENS,
    input: [{ role: "user" as const, content: [{ type: "input_text" as const, text: JSON.stringify(context) }] }],
    text: { format: zodTextFormat(modelProposalSchema, "spatial_proposal") },
  };
}

export function unavailableProposal(request: ProposalRequest, explanation: string): Proposal {
  return { status: "unavailable", configuration: null, explanation, limitations: [], revision: request.revision, changedKeys: [], totalCents: null, model: MODEL };
}

export async function proposeConfiguration(request: ProposalRequest): Promise<Proposal> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: PROVIDER_TIMEOUT_MS, maxRetries: 0 });
  try {
    const response = await client.responses.parse(buildProviderRequest(request));
    if (response.status !== "completed" || !response.output_parsed) return unavailableProposal(request, "The assistant could not complete a supported proposal. Your scene has not changed.");
    return validateProposal(response.output_parsed, request);
  } catch (error) {
    if (error instanceof ProposalValidationError) return unavailableProposal(request, error.message);
    throw new PublicError("The assistant is temporarily unavailable. Your scene has not changed.", 502);
  }
}
