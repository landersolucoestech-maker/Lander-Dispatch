import { expect, test } from "./playwright.mjs";

test.describe("GitHub Pages mockup preview", () => {
  test.skip(process.env.PAGES_PREVIEW_SMOKE !== "true", "Runs only against the Pages-style mockup bundle.");

  test("renders without browser runtime errors", async ({ page }) => {
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.stack || error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });

    const response = await page.goto("/Lander-Dispatch/", { waitUntil: "networkidle" });
    expect(response?.ok(), "Pages preview document should load").toBeTruthy();

    await page.waitForTimeout(1000);
    const bodyText = (await page.locator("body").innerText()).trim();
    console.log("PAGES_PREVIEW_URL", page.url());
    console.log("PAGES_PREVIEW_BODY", bodyText.slice(0, 1500));
    if (runtimeErrors.length) console.log("PAGES_PREVIEW_ERRORS", runtimeErrors.join("\n"));

    expect(runtimeErrors, "Pages preview must not emit runtime errors").toEqual([]);
    expect(bodyText.length, "Pages preview must render visible application content").toBeGreaterThan(50);
    await expect(page.getByText("Lander Dispatch", { exact: false }).first()).toBeVisible();
  });
});
