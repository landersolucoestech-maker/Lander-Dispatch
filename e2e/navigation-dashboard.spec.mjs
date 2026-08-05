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

test.describe("Shell and dashboard", () => {
  test("renders the operational dashboard and supports quick module navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "DASHBOARD", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Local development mode")).toBeVisible();

    const kpis = page.getByRole("region", {
      name: "Dashboard key performance indicators",
    });
    await expect(kpis.getByText("Active Carriers")).toBeVisible();
    await expect(kpis.getByText("Inactive Carriers")).toBeVisible();
    await expect(kpis.getByText("Loads Booked")).toBeVisible();
    await expect(kpis.getByText("Monthly Revenue")).toBeVisible();

    const quickNavigation = page.getByRole("textbox", {
      name: "Quick module navigation",
    });
    await quickNavigation.fill("Documents");
    await quickNavigation.press("Enter");

    await expect(page).toHaveURL(/\/documents$/);
    await expect(
      page.getByRole("heading", { name: "DOCUMENTS", level: 1 }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("opens and closes the mobile navigation without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByText("Local development mode")).toBeVisible();

    await page.getByRole("link", { name: "Audit Log" }).click();

    await expect(page).toHaveURL(/\/audit-log$/);
    await expect(
      page.getByRole("heading", { name: "AUDIT LOG", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
