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

test.describe("CRM Drivers list", () => {
  test("renders qualification records and non-destructive filters", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/crm");

    await expect(
      page.getByRole("heading", { name: "CRM", level: 1 }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Drivers/ }).click();

    await expect(
      page.getByRole("button", { name: "Create Driver" }),
    ).toBeEnabled();

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Driver" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Phone" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "License" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "CDL" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "TWIC" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Compliance" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();

    await expect(table.getByText("Marcus Reed", { exact: true })).toBeVisible();
    await expect(table.getByText("E · FL", { exact: true })).toBeVisible();
    await expect(table.getByText("A · FL", { exact: true })).toBeVisible();
    await expect(table.getByText("Configured", { exact: true })).toBeVisible();
    await expect(table.getByText("Compliant", { exact: true })).toBeVisible();

    const statusFilter = page.getByRole("combobox");
    await statusFilter.click();
    await page.getByRole("option", { name: "Active" }).click();
    await expect(statusFilter).toContainText("Active");
    await expect(table.getByText("Marcus Reed", { exact: true })).toBeVisible();

    const search = page.getByPlaceholder(
      "Search driver name, phone or license",
    );
    await search.fill("__no_matching_driver__");
    await expect(
      page.getByText("No drivers found.", { exact: true }),
    ).toBeVisible();

    await search.fill("");
    await expect(table.getByText("Marcus Reed", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test("renders responsive driver cards without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/crm");
    await page.getByRole("button", { name: /Drivers/ }).click();

    await expect(page.getByRole("table")).toBeHidden();

    const actionButton = page
      .getByRole("button", { name: /^Actions for Marcus Reed$/ })
      .first();
    await expect(actionButton).toBeVisible();

    const card = actionButton.locator("xpath=ancestor::article");
    await expect(card.getByText("License", { exact: true })).toBeVisible();
    await expect(card.getByText("CDL", { exact: true })).toBeVisible();
    await expect(card.getByText("TWIC", { exact: true })).toBeVisible();
    await expect(card.getByText("Compliance", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
