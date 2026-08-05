import { expect, test } from "./playwright.mjs";

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth,
  );
}

test.describe("Audit log", () => {
  test("renders read-only history, metrics and non-destructive filters", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/audit-log");

    await expect(
      page.getByRole("heading", { name: "AUDIT LOG", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Read-only operational history for security, accountability and troubleshooting.",
        { exact: true },
      ),
    ).toBeVisible();

    await expect(page.getByText("Recorded Events", { exact: true })).toBeVisible();
    await expect(page.getByText("Audit Mode", { exact: true })).toBeVisible();
    await expect(page.getByText("Read-only history", { exact: true })).toBeVisible();
    await expect(page.getByText("Current Coverage", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Operational and financial mutations", { exact: true }),
    ).toBeVisible();

    const entries = page.locator("article");
    await expect(entries.first()).toBeVisible();

    const filters = page.getByRole("combobox");
    await expect(filters).toHaveCount(2);

    await filters.nth(0).click();
    await page.getByRole("option", { name: "development.seed.completed" }).click();
    await expect(filters.nth(0)).toContainText("development.seed.completed");
    await expect(entries.first()).toBeVisible();

    await filters.nth(1).click();
    await page.getByRole("option", { name: "Development Dataset" }).click();
    await expect(filters.nth(1)).toContainText("Development Dataset");
    await expect(entries.first()).toBeVisible();

    const search = page.getByPlaceholder("Search summary or actor email");
    await search.fill("__no_matching_audit_event__");
    await expect(
      page.getByText("No audit events found.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Events will appear after audited operations are executed.",
        { exact: true },
      ),
    ).toBeVisible();

    await search.fill("");
    await expect(entries.first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("renders audit history without horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/audit-log");

    await expect(
      page.getByRole("heading", { name: "AUDIT LOG", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await expect(page.getByText("Read-only history", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
