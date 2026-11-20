"use client";

/**
 * Firebase Realtime Database client for the live NFC demo.
 * Every screen subscribes to demos/{session}. Writes go through transactions so concurrent
 * phones never lose an award, and the database rules (database.rules.json) reject anything
 * that is not a valid demo operation.
 *
 * The Firebase web config is public by design (it ships to every browser). Access control lives
 * in the database rules, not in these values. Never put a service account key here.
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectDatabaseEmulator, getDatabase, onValue, ref, runTransaction, set, type Database } from "firebase/database";
import { applyAward, applyUnlock, initialState, isValidSession, normalize, validateAward, type AwardInput, type LiveDemoState, type Recognition } from "./model";

export class LiveConfigError extends Error {}

const DEFAULT_SESSION = process.env.NEXT_PUBLIC_DEMO_SESSION || "rbc-judges";

/** Session comes from ?s= when present (rehearsals), otherwise the deployment default (the NFC cards). */
export function resolveSession(search: string | null): string {
  const s = (search ?? "").trim().toLowerCase();
  const id = s || DEFAULT_SESSION;
  if (!isValidSession(id)) throw new LiveConfigError(`Invalid demo session "${id}". Use 3 to 40 lowercase letters, numbers or dashes.`);
  return id;
}

let db: Database | null = null;

function database(): Database {
  if (db) return db;
  // Referenced one by one so Next.js inlines them into the client bundle.
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
  };
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
  const required = {
    apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
    databaseURL: "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
    projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  } as const;
  const missing = (Object.keys(required) as (keyof typeof required)[]).filter((k) => !config[k]).map((k) => required[k]);
  if (missing.length && !emulator) {
    throw new LiveConfigError(`Firebase is not configured. Missing: ${missing.join(", ")}. See README → Live NFC demo.`);
  }
  const app: FirebaseApp =
    getApps()[0] ??
    initializeApp({
      ...config,
      apiKey: config.apiKey || "emulator",
      projectId: config.projectId || "demo-rbc-compass",
      databaseURL: config.databaseURL || "https://demo-rbc-compass-default-rtdb.firebaseio.com",
    });
  db = getDatabase(app);
  if (emulator) {
    const [host, port] = emulator.split(":");
    connectDatabaseEmulator(db, host, Number(port || 9000));
  }
  return db;
}

const path = (session: string) => `demos/${session}`;

export function subscribe(
  session: string,
  handlers: { onState: (s: LiveDemoState | null) => void; onError: (e: Error) => void; onConnection: (connected: boolean) => void },
): () => void {
  const d = database();
  const offState = onValue(
    ref(d, path(session)),
    (snap) => handlers.onState(normalize(snap.val())),
    (err) => handlers.onError(err),
  );
  const offConn = onValue(ref(d, ".info/connected"), (snap) => handlers.onConnection(snap.val() === true));
  return () => {
    offState();
    offConn();
  };
}

/** Creates the session with the initial state if nobody has yet. Safe to call from every screen. */
export async function ensureSession(session: string) {
  await runTransaction(ref(database(), path(session)), (cur) => (cur === null ? initialState() : undefined), { applyLocally: false });
}

export type AwardOutcome = { kind: "awarded" | "duplicate"; recognition: Recognition; state: LiveDemoState } | { kind: "limit" };

export async function awardRecognition(session: string, input: AwardInput): Promise<AwardOutcome> {
  const v = validateAward(input);
  if (!v.ok) throw new Error(v.error);
  let outcome: AwardOutcome | null = null;
  const res = await runTransaction(ref(database(), path(session)), (cur) => {
    const r = applyAward(normalize(cur), v.value, Date.now());
    if (r.kind === "awarded") {
      outcome = { kind: "awarded", recognition: r.recognition, state: r.state };
      return r.state;
    }
    outcome = r.kind === "duplicate" ? { kind: "duplicate", recognition: r.recognition, state: r.state } : { kind: "limit" };
    return undefined; // abort: nothing to write
  });
  if (!outcome) throw new Error("Award transaction did not run");
  if ((outcome as AwardOutcome).kind === "awarded" && !res.committed) throw new Error("Award was not saved. Try again.");
  return outcome;
}

export async function unlockWrapped(session: string): Promise<LiveDemoState> {
  const res = await runTransaction(ref(database(), path(session)), (cur) => applyUnlock(normalize(cur), Date.now()));
  if (!res.committed) throw new Error("Unlock was not saved. Try again.");
  return normalize(res.snapshot.val())!;
}

export async function resetDemo(session: string) {
  await set(ref(database(), path(session)), initialState());
}
