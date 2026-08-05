export const DEV_SEED_CONFIRMATION = "LANDER_DISPATCH_DEV_ONLY";

export interface DevSeedGuardInput {
  nodeEnv?: string;
  appEnv?: string;
  confirmation?: string;
  branch?: string;
  databaseUrl?: string;
  allowedRemoteDatabase?: string;
}

export interface DevSeedTarget {
  branch: string;
  databaseTarget: string;
  isLocal: boolean;
}

const FORBIDDEN_MARKERS = [
  "prod",
  "production",
  "staging",
  "stage",
  "main",
  "master",
];

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function databaseTarget(url: URL): string {
  const port = url.port || (url.protocol === "postgresql:" ? "5432" : "");
  const database = url.pathname.replace(/^\/+/, "");
  return `${url.hostname.toLowerCase()}:${port}/${database.toLowerCase()}`;
}

function hasForbiddenMarker(value: string): boolean {
  const normalized = normalize(value);
  return FORBIDDEN_MARKERS.some((marker) =>
    new RegExp(`(^|[._:/-])${marker}($|[._:/-])`, "i").test(normalized),
  );
}

export function assertDevSeedTarget(input: DevSeedGuardInput): DevSeedTarget {
  if (normalize(input.nodeEnv) !== "development") {
    throw new Error("Development seed refused: NODE_ENV must be exactly development.");
  }

  if (normalize(input.appEnv) !== "development") {
    throw new Error("Development seed refused: APP_ENV must be exactly development.");
  }

  if (input.confirmation !== DEV_SEED_CONFIRMATION) {
    throw new Error(
      `Development seed refused: SEED_DEV_CONFIRM must equal ${DEV_SEED_CONFIRMATION}.`,
    );
  }

  const branch = input.branch?.trim() ?? "";
  if (branch !== "dev") {
    throw new Error(`Development seed refused: current branch is ${branch || "unknown"}, not dev.`);
  }

  if (!input.databaseUrl) {
    throw new Error("Development seed refused: DATABASE_URL is missing.");
  }

  let url: URL;
  try {
    url = new URL(input.databaseUrl);
  } catch {
    throw new Error("Development seed refused: DATABASE_URL is invalid.");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Development seed refused: DATABASE_URL must use PostgreSQL.");
  }

  const target = databaseTarget(url);
  if (hasForbiddenMarker(target)) {
    throw new Error(
      `Development seed refused: database target contains a forbidden environment marker (${target}).`,
    );
  }

  const hostname = url.hostname.toLowerCase();
  const database = url.pathname.replace(/^\/+/, "").toLowerCase();
  const isLocal = hostname === "127.0.0.1" || hostname === "localhost";

  if (isLocal) {
    if (database !== "lander_dispatch") {
      throw new Error(
        `Development seed refused: local database must be lander_dispatch, received ${database || "empty"}.`,
      );
    }
  } else {
    const allowlistedTarget = normalize(input.allowedRemoteDatabase);
    if (!allowlistedTarget || allowlistedTarget !== target) {
      throw new Error(
        "Development seed refused: remote database requires an exact SEED_DEV_ALLOWED_DATABASE host:port/database match.",
      );
    }
  }

  return {
    branch,
    databaseTarget: target,
    isLocal,
  };
}
