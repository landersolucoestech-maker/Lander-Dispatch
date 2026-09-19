import { expect, test } from "./playwright.mjs";

test.describe("GitHub Pages mockup preview", () => {
  test.skip(process.env.PAGES_PREVIEW_SMOKE !== "true", "Runs only against the Pages-style mockup bundle.");

  test("renders without browser runtime errors", async ({ page }) => {
    const runtimeErrors = [];
    const requestFailures = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.stack || error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => {
      requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
    });

    const base = process.env.E2E_BASE_URL ?? "";
    const isLivePages = base.includes("github.io");
    if (!isLivePages) {
      await page.route("**/api/auth/user", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: "frontend-preview",
              email: "preview@landerdispatch.local",
              firstName: "Lander",
              lastName: "Dispatch",
              profileImageUrl: null,
            },
          }),
        });
      });
    }

    const response = await page.goto("/Lander-Dispatch/?utm_source=chatgpt.com&mockReset=1", { waitUntil: "networkidle" });
    expect(response?.ok(), "Pages preview document should load").toBeTruthy();

    await page.waitForTimeout(1000);
    const bodyText = (await page.locator("body").innerText()).trim();
    console.log("PAGES_PREVIEW_URL", page.url());
    console.log("PAGES_PREVIEW_BODY", bodyText.slice(0, 2000));
    if (runtimeErrors.length) console.log("PAGES_PREVIEW_ERRORS", runtimeErrors.join("\n"));
    if (requestFailures.length) console.log("PAGES_PREVIEW_REQUEST_FAILURES", requestFailures.join("\n"));

    expect(runtimeErrors, "Pages preview must not emit runtime errors").toEqual([]);
    expect(bodyText.length, "Pages preview must render visible application content").toBeGreaterThan(50);
    await expect(page.getByText("Lander Dispatch", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Dashboard", { exact: false }).first()).toBeVisible();
  });
});
