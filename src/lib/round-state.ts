"use client";

import { useCallback, useEffect, useState } from "react";
import { readJson, writeJson } from "./safe-storage";

/**
 * Lifecycle of a competition round, controlled by the organizer and obeyed by
 * every participant screen.
 */
export type RoundStatus = "Lobby" | "Live" | "Paused" | "Ended";

export const ROUND_KEY = "hackday-round";

/** Same-tab event, so two components in one tab stay in sync instantly. */
const ROUND_EVENT = "hackday:round-change";

const VALID_STATUSES: RoundStatus[] = ["Lobby", "Live", "Paused", "Ended"];

export function isRoundStatus(value: unknown): value is RoundStatus {
  return (
    typeof value === "string" &&
    (VALID_STATUSES as string[]).includes(value)
  );
}

/**
 * Current round status. Defaults to "Live" so a fresh browser is immediately
 * playable instead of showing a locked screen.
 */
export function readRoundStatus(): RoundStatus {
  return readJson<RoundStatus>(ROUND_KEY, "Live", isRoundStatus);
}

/** Persists the round status and notifies this tab. */
export function writeRoundStatus(status: RoundStatus): void {
  writeJson(ROUND_KEY, status);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RoundStatus>(ROUND_EVENT, { detail: status }),
  );
}

/**
 * Subscribes to round changes coming from this tab (custom event) and from
 * other tabs of the same browser (storage event).
 */
export function subscribeRoundStatus(
  callback: (status: RoundStatus) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onLocalChange = (event: Event) => {
    const detail = (event as CustomEvent<RoundStatus>).detail;
    callback(isRoundStatus(detail) ? detail : readRoundStatus());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ROUND_KEY) return;
    callback(readRoundStatus());
  };

  window.addEventListener(ROUND_EVENT, onLocalChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(ROUND_EVENT, onLocalChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * React binding for the round status. Reading is side-effect free on the
 * server, so it is safe in client components that still prerender.
 */
export function useRoundStatus(): {
  status: RoundStatus;
  setStatus: (status: RoundStatus) => void;
} {
  const [status, setLocalStatus] = useState<RoundStatus>("Live");

  useEffect(() => {
    setLocalStatus(readRoundStatus());
    return subscribeRoundStatus(setLocalStatus);
  }, []);

  const setStatus = useCallback((next: RoundStatus) => {
    writeRoundStatus(next);
    setLocalStatus(next);
  }, []);

  return { status, setStatus };
}
