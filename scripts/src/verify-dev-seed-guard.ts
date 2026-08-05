import assert from "node:assert/strict";
import {
  assertDevSeedTarget,
  DEV_SEED_CONFIRMATION,
  type DevSeedGuardInput,
} from "./dev-seed-guard";

const localInput: DevSeedGuardInput = {
  nodeEnv: "development",
  appEnv: "development",
  confirmation: DEV_SEED_CONFIRMATION,
  branch: "dev",
  databaseUrl: "postgresql://postgres:postgres@127.0.0.1:55432/lander_dispatch",
};

const localTarget = assertDevSeedTarget(localInput);
assert.equal(localTarget.isLocal, true);
assert.equal(localTarget.databaseTarget, "127.0.0.1:55432/lander_dispatch");

assert.throws(
  () => assertDevSeedTarget({ ...localInput, nodeEnv: "production" }),
  /NODE_ENV must be exactly development/,
);
assert.throws(
  () => assertDevSeedTarget({ ...localInput, appEnv: "staging" }),
  /APP_ENV must be exactly development/,
);
assert.throws(
  () => assertDevSeedTarget({ ...localInput, confirmation: "yes" }),
  /SEED_DEV_CONFIRM/,
);
assert.throws(
  () => assertDevSeedTarget({ ...localInput, branch: "staging" }),
  /current branch is staging/,
);
assert.throws(
  () =>
    assertDevSeedTarget({
      ...localInput,
      databaseUrl: "postgresql://postgres:postgres@127.0.0.1:55432/lander_dispatch_prod",
    }),
  /forbidden environment marker/,
);
assert.throws(
  () =>
    assertDevSeedTarget({
      ...localInput,
      databaseUrl: "postgresql://postgres:postgres@127.0.0.1:55432/another_database",
    }),
  /local database must be lander_dispatch/,
);
assert.throws(
  () =>
    assertDevSeedTarget({
      ...localInput,
      databaseUrl: "postgresql://seed:secret@db.dev.example.test:5432/lander_dispatch_dev",
    }),
  /requires an exact SEED_DEV_ALLOWED_DATABASE/,
);

const remoteTarget = assertDevSeedTarget({
  ...localInput,
  databaseUrl: "postgresql://seed:secret@db.dev.example.test:5432/lander_dispatch_dev",
  allowedRemoteDatabase: "db.dev.example.test:5432/lander_dispatch_dev",
});
assert.equal(remoteTarget.isLocal, false);
assert.equal(
  remoteTarget.databaseTarget,
  "db.dev.example.test:5432/lander_dispatch_dev",
);

console.log("Development seed guard tests passed.");
