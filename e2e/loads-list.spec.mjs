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

test.describe("Loads list", () => {
  test("renders the desktop operations table and non-destructive filters", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/loads");

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("heading", { name: "LOADS", level: 1 }),
    ).toBeVisible();
    await expect(
      header.getByText("Active and historical freight operations.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Import PDF" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Create Load" }),
    ).toBeEnabled();

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Load ID" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Dispatch Date" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Route" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Carrier / Broker" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Rate" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();

    const bodyRows = table.getByRole("row").filter({
      has: page.getByRole("button", { name: /^Actions for / }),
    });
    await expect(bodyRows.first()).toBeVisible();

    const search = page.getByPlaceholder("Search load ID, city or state");
    await search.fill("__no_matching_load__");
    await expect(page.getByText("No loads found.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(table).toBeVisible();
    await expect(bodyRows.first()).toBeVisible();

    const statusFilter = page.getByRole("combobox");
    await statusFilter.click();
    await page.getByRole("option", { name: "Delivered" }).click();
    await expect(statusFilter).toContainText("Delivered");

    await expectNoHorizontalOverflow(page);
  });

  test("renders responsive load cards without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/loads");

    await expect(
      page.getByRole("heading", { name: "LOADS", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();

    const actionButton = page.getByRole("button", { name: /^Actions for / }).first();
    await expect(actionButton).toBeVisible();

    const card = actionButton.locator("xpath=ancestor::article");
    await expect(card.getByText("Dispatch Date:", { exact: false })).toBeVisible();
    await expect(card.getByText("Carrier", { exact: true })).toBeVisible();
    await expect(card.getByText("Broker", { exact: true })).toBeVisible();
    await expect(card.getByText("Rate", { exact: true })).toBeVisible();
    await expect(card.getByText("Status", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
