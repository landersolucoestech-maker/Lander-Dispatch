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

test.describe("Invoices list", () => {
  test("renders the desktop receivables table and non-destructive filters", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/accounting/invoices");

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("heading", { name: "INVOICES", level: 1 }),
    ).toBeVisible();
    await expect(
      header.getByText(
        "Commission receivables, balances and payment status.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Invoice" }),
    ).toBeEnabled();

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Invoice #" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Carrier" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Issue Date" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Due Date" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Total" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Balance" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Actions for / }).first(),
    ).toBeVisible();

    const search = page.getByPlaceholder("Search invoice number or carrier");
    await search.fill("__no_matching_invoice__");
    await expect(
      page.getByText("No invoices found.", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(table).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Actions for / }).first(),
    ).toBeVisible();

    const statusFilter = page.getByRole("combobox");
    await statusFilter.click();
    await page.getByRole("option", { name: "Overdue" }).click();
    await expect(statusFilter).toContainText("Overdue");

    await expectNoHorizontalOverflow(page);
  });

  test("renders responsive invoice cards without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/accounting/invoices");

    await expect(
      page.getByRole("heading", { name: "INVOICES", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();

    const actionButton = page
      .getByRole("button", { name: /^Actions for / })
      .first();
    await expect(actionButton).toBeVisible();

    const card = actionButton.locator("xpath=ancestor::article");
    await expect(card.getByText("Issue Date", { exact: true })).toBeVisible();
    await expect(card.getByText("Due Date", { exact: true })).toBeVisible();
    await expect(card.getByText("Total", { exact: true })).toBeVisible();
    await expect(card.getByText("Balance", { exact: true })).toBeVisible();
    await expect(card.getByText("Status", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
