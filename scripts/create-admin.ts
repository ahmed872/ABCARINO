import { closeDb } from "../src/lib/db";
import { ensureSuperAdmin } from "./admin-lib";

ensureSuperAdmin({ reset: process.argv.includes("--reset") })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
