import { z } from "zod";
import { assessConfiguration, budgetSchema, configurationSchema } from "./configuration";
import type { Configuration } from "./contracts";

const shareSchema = z.strictObject({ version: z.literal(1), configuration: configurationSchema, budgetCents: budgetSchema });
const MAX_SHARE_LENGTH = 2_048;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const base64 = typeof Buffer !== "undefined" ? Buffer.from(bytes).toString("base64") : btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = typeof Buffer !== "undefined" ? new Uint8Array(Buffer.from(base64, "base64")) : Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodeShare(configuration: Configuration, budgetCents: number): string {
  const payload = shareSchema.parse({ version: 1, configuration, budgetCents });
  if (!assessConfiguration(payload.configuration, payload.budgetCents).fitsRoom) throw new Error("Only configurations that pass room clearance checks can be shared.");
  const encoded = toBase64Url(JSON.stringify(payload));
  if (encoded.length > MAX_SHARE_LENGTH) throw new Error("This configuration cannot be shared.");
  return encoded;
}

export function decodeShare(value: string): { configuration: Configuration; budgetCents: number } | null {
  if (!value || value.length > MAX_SHARE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded = fromBase64Url(value);
    if (toBase64Url(decoded) !== value) return null;
    const parsed = shareSchema.safeParse(JSON.parse(decoded));
    if (!parsed.success || !assessConfiguration(parsed.data.configuration, parsed.data.budgetCents).fitsRoom) return null;
    return { configuration: parsed.data.configuration, budgetCents: parsed.data.budgetCents };
  } catch { return null; }
}
