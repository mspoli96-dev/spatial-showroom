import { randomUUID } from "node:crypto";
import { checkBotId } from "botid/server";
import { proposalRequestSchema, ProposalValidationError } from "../configuration";
import type { Proposal, ProposalRequest } from "../contracts";
import { hostedEnvironment, publicConfig } from "./config";
import { proposeConfiguration, unavailableProposal } from "./provider";
import { assertOrigin, newVisitor, PublicError, readBoundedJson, visitorFromRequest } from "./security";
import { createProposalStore, type ProposalStore } from "./store";

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export type ProposalDependencies = {
  store: () => ProposalStore;
  propose: (request: ProposalRequest) => Promise<Proposal>;
  verifyBrowser: () => Promise<boolean>;
};

const dependencies: ProposalDependencies = {
  store: createProposalStore,
  propose: proposeConfiguration,
  async verifyBrowser() {
    const result = await checkBotId({ advancedOptions: { checkLevel: "basic" }, developmentOptions: { isDevelopment: false } });
    return result?.isBot === false && result.bypassed === false;
  },
};

function errorResponse(error: unknown): Response {
  const known = error instanceof PublicError;
  return Response.json({ error: known ? error.message : "Live proposals are temporarily unavailable. Your scene has not changed." }, { status: known ? error.status : 503, headers: noStore });
}

export function configResponse(request: Request): Response {
  try {
    const config = publicConfig();
    const cookie = config.liveEnabled && !visitorFromRequest(request) ? newVisitor(request).cookie : undefined;
    return Response.json(config, { headers: { ...noStore, ...(cookie ? { "Set-Cookie": cookie } : {}) } });
  } catch (error) { return errorResponse(error); }
}

export async function proposeResponse(request: Request, services: ProposalDependencies = dependencies): Promise<Response> {
  try {
    assertOrigin(request);
    const parsed = proposalRequestSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) throw new PublicError("Enter a design request of up to 600 characters, valid catalogue choices and budget, and confirm AI processing.", 400);
    if (!publicConfig().liveEnabled) throw new PublicError("Live proposals are temporarily unavailable. You can still edit and share your room manually.", 503);
    const visitorId = visitorFromRequest(request);
    if (!visitorId) throw new PublicError("Refresh the Spatial Showroom page before requesting a proposal.", 403);
    if (hostedEnvironment()) {
      let verified = false;
      try { verified = await services.verifyBrowser(); } catch { throw new PublicError("Browser verification is temporarily unavailable.", 503); }
      if (!verified) throw new PublicError("Browser verification failed. Refresh the page and try again.", 403);
    }
    const store = services.store();
    const reservationId = randomUUID();
    await store.reserve(visitorId, reservationId);
    let proposal: Proposal;
    try { proposal = await services.propose(parsed.data); }
    catch (error) {
      if (!(error instanceof ProposalValidationError)) throw error;
      proposal = unavailableProposal(parsed.data, error.message);
    }
    try { await store.release(visitorId, reservationId); } catch {}
    return Response.json(proposal, { headers: noStore });
  } catch (error) { return errorResponse(error); }
}
