"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_KEYS, CONFIG_KEYS, DEFAULT_BUDGET_CENTS, DEFAULT_CONFIGURATION, FABRICS, FINISHES, productById } from "@/lib/catalog";
import { assessConfiguration, changedKeys, configurationSchema } from "@/lib/configuration";
import type { Category, ConfigKey, Configuration, LiveConfig, ProposalRequest } from "@/lib/contracts";
import { decodeShare, encodeShare } from "@/lib/share";

type Snapshot = { configuration: Configuration; budgetCents: number; locks: ConfigKey[] };
export type Notice = { kind: "info" | "success" | "error"; text: string; changes?: string[]; rationale?: string };
const initialSnapshot = (): Snapshot => ({ configuration: { ...DEFAULT_CONFIGURATION }, budgetCents: DEFAULT_BUDGET_CENTS, locks: [] });

function changeLabel(key: ConfigKey, configuration: Configuration): string {
  if (key.endsWith("Id")) {
    const id = configuration[key];
    return typeof id === "string" ? productById(id)?.name ?? "Collection updated" : `${key === "lampId" ? "Lamp" : "Storage"} removed`;
  }
  if (key === "finish") return `${FINISHES.find(finish => finish.id === configuration.finish)?.label} finish`;
  if (key === "fabric") return `${FABRICS.find(fabric => fabric.id === configuration.fabric)?.label} upholstery`;
  if (key === "lighting") return configuration.lighting === "day" ? "Daylight" : "Evening light";
  return configuration.layout === "left" ? "Desk on the left" : "Desk on the right";
}

export function useShowroom() {
  const [snapshot, setSnapshot] = useState<Snapshot>(initialSnapshot);
  const snapshotRef = useRef(snapshot);
  const initialRef = useRef<Snapshot>(initialSnapshot());
  const history = useRef<Snapshot[]>([]);
  const [historySize, setHistorySize] = useState(0);
  const revision = useRef("initial");
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<LiveConfig | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [budgetInput, setBudgetInput] = useState(String(DEFAULT_BUDGET_CENTS / 100));
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void fetch("/api/config", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json() as LiveConfig;
        if (mounted.current) setLive({ liveEnabled: data.liveEnabled === true, model: typeof data.model === "string" ? data.model : "", unavailableReason: typeof data.unavailableReason === "string" ? data.unavailableReason : null });
      })
      .catch(() => {
        if (mounted.current && !controller.signal.aborted) setLive({ liveEnabled: false, model: "", unavailableReason: "Live design is temporarily unavailable. You can still edit every piece by hand." });
      });
    const value = new URLSearchParams(window.location.search).get("design");
    if (value !== null) {
      const shared = decodeShare(value);
      if (shared) {
        const restored: Snapshot = { ...shared, locks: [] };
        snapshotRef.current = restored;
        initialRef.current = restored;
        setSnapshot(restored);
        setBudgetInput(String(shared.budgetCents / 100));
        setNotice({ kind: "success", text: "Shared room loaded. Make it your own." });
      } else {
        setNotice({ kind: "error", text: "This room link could not be opened. The original studio is ready to explore." });
      }
    }
    return () => { mounted.current = false; controller.abort(); pending.current?.abort(); };
  }, []);

  function invalidate() {
    revision.current = crypto.randomUUID();
    if (pending.current) {
      pending.current.abort();
      pending.current = null;
      setBusy(false);
      setNotice({ kind: "info", text: "Your room changed while the design was in progress. Send your brief again when you are ready." });
    }
    setShareUrl("");
  }

  function commit(next: Snapshot, record = true) {
    if (record) {
      history.current = [...history.current.slice(-39), snapshotRef.current];
      setHistorySize(history.current.length);
    }
    invalidate();
    snapshotRef.current = next;
    setSnapshot(next);
  }

  function edit(patch: Partial<Configuration>) {
    const current = snapshotRef.current;
    const configuration = { ...current.configuration, ...patch };
    const assessment = assessConfiguration(configuration, current.budgetCents);
    if (!assessment.fitsRoom) {
      invalidate();
      setNotice({ kind: "error", text: `That combination needs more space. ${assessment.issues.join(" ")} Your room has been kept as it was.` });
      return;
    }
    if (!changedKeys(current.configuration, configuration).length) return;
    const wasPending = !!pending.current;
    commit({ ...current, configuration });
    if (!wasPending) setNotice(null);
  }

  function togglePin(category: Category) {
    const keys: ConfigKey[] = category === "chair" ? ["chairId", "fabric"] : [CATEGORY_KEYS[category]];
    const current = snapshotRef.current;
    const isPinned = keys.every(key => current.locks.includes(key));
    const locks = isPinned ? current.locks.filter(key => !keys.includes(key)) : [...new Set([...current.locks, ...keys])];
    commit({ ...current, locks });
    setNotice({ kind: "info", text: isPinned ? `${category === "chair" ? "Chair and upholstery" : `${category[0].toUpperCase()}${category.slice(1)}`} unpinned.` : `${category === "chair" ? "Chair and upholstery are" : `${category[0].toUpperCase()}${category.slice(1)} is`} pinned. AI will keep your choice; you can still edit it yourself.` });
  }

  function changeBudget(value: string) {
    setBudgetInput(value);
    const amount = Number(value);
    if (value.trim() && Number.isInteger(amount) && amount >= 500 && amount <= 5000) {
      if (amount * 100 !== snapshotRef.current.budgetCents) commit({ ...snapshotRef.current, budgetCents: amount * 100 });
    } else invalidate();
  }

  function settleBudget() {
    if (!budgetValid) {
      setBudgetInput(String(snapshotRef.current.budgetCents / 100));
      setNotice({ kind: "info", text: "Choose a whole-dollar budget from CAD 500 to CAD 5,000." });
    }
  }

  function undo() {
    const previous = history.current.pop();
    if (!previous) return;
    commit(previous, false);
    setHistorySize(history.current.length);
    setBudgetInput(String(previous.budgetCents / 100));
    setNotice({ kind: "info", text: "Last change undone." });
  }

  function reset() {
    commit({ ...initialRef.current, configuration: { ...initialRef.current.configuration }, locks: [] });
    setBudgetInput(String(initialRef.current.budgetCents / 100));
    setNotice({ kind: "info", text: "Room and budget reset. All pins cleared. You can undo this." });
  }

  async function share() {
    const current = snapshotRef.current;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("design", encodeShare(current.configuration, current.budgetCents));
    const value = url.toString();
    setShareUrl(value);
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ kind: "success", text: "Room link copied. Your brief and pins stay private." });
    } catch {
      setShareUrl(value);
      setNotice({ kind: "info", text: "Copy the room link below to share your design." });
    }
  }

  async function propose(prompt: string, consent: boolean) {
    if (pending.current || !live?.liveEnabled || !consent || !budgetValid || !prompt.trim() || prompt.length > 600) return;
    const current = snapshotRef.current;
    const request: ProposalRequest = { prompt: prompt.trim(), current: current.configuration, budgetCents: current.budgetCents, locks: current.locks, revision: revision.current, consent: true };
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setNotice(null);
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
    try {
      const response = await fetch("/api/propose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal: controller.signal });
      const data = await response.json() as Record<string, unknown>;
      if (!mounted.current || pending.current !== controller) return;
      if (revision.current !== request.revision) {
        setNotice({ kind: "info", text: "Your room changed while the design was in progress. Send your brief again to use your latest choices." });
        return;
      }
      if (!response.ok || data.status !== "proposal") {
        setNotice({ kind: "info", text: typeof data.explanation === "string" ? data.explanation.slice(0, 600) : typeof data.error === "string" ? data.error.slice(0, 600) : "Live design is unavailable right now. Your room is unchanged, and the collection is ready to explore." });
        return;
      }
      const parsed = configurationSchema.safeParse(data.configuration);
      if (!parsed.success || data.revision !== request.revision) throw new Error("Invalid proposal");
      const configuration = parsed.data;
      const assessment = assessConfiguration(configuration, request.budgetCents);
      if (!assessment.fitsRoom || !assessment.withinBudget || request.locks.some(key => configuration[key] !== request.current[key])) throw new Error("Invalid proposal");
      const changes = changedKeys(request.current, configuration).filter(key => CONFIG_KEYS.includes(key)).map(key => changeLabel(key, configuration));
      pending.current = null;
      if (changes.length) commit({ ...current, configuration });
      setNotice({ kind: "success", text: changes.length ? "Your new room is ready." : "Your current room already matches this direction.", changes, rationale: typeof data.explanation === "string" ? data.explanation.slice(0, 600) : undefined });
    } catch {
      if (!mounted.current || pending.current !== controller) return;
      setNotice({ kind: "error", text: timedOut ? "The design request timed out. Your room is unchanged. You can try again when you are ready." : "We could not apply this design safely. Your room is unchanged. Try another brief or explore the collection." });
    } finally {
      window.clearTimeout(timer);
      if (pending.current === controller) pending.current = null;
      if (mounted.current && !pending.current) setBusy(false);
    }
  }

  const budgetValid = budgetInput.trim() !== "" && Number.isInteger(Number(budgetInput)) && Number(budgetInput) >= 500 && Number(budgetInput) <= 5000;
  return { ...snapshot, assessment: assessConfiguration(snapshot.configuration, snapshot.budgetCents), historySize, notice, live, busy, shareUrl, budgetInput, budgetValid, edit, togglePin, changeBudget, settleBudget, undo, reset, share, propose };
}
