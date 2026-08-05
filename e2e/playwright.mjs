import { createRequire } from "node:module";

const packageJsonPath = process.env.PLAYWRIGHT_PACKAGE_JSON;

if (!packageJsonPath) {
  throw new Error(
    "PLAYWRIGHT_PACKAGE_JSON must point to the temporary Playwright installation.",
  );
}

const require = createRequire(packageJsonPath);
const playwrightTest = require("@playwright/test");

export const test = playwrightTest.test;
export const expect = playwrightTest.expect;
