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

test.describe("Transactions list", () => {
  test("renders financial KPIs, desktop table and non-destructive filters", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/accounting/transactions");

    await expect(
      page.getByRole("heading", { name: "TRANSACTIONS", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Income, expenses and general-ledger activity.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Transaction" }),
    ).toBeEnabled();

    await expect(page.getByText("Total Income", { exact: true })).toBeVisible();
    await expect(page.getByText("Total Expenses", { exact: true })).toBeVisible();
    await expect(page.getByText("Net Balance", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Transaction ID" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Date" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Category" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Type" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Amount" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /^Actions for / }).first(),
    ).toBeVisible();

    const search = page.getByPlaceholder("Search description or category");
    await search.fill("__no_matching_transaction__");
    await expect(
      page.getByText("No transactions found.", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(table).toBeVisible();

    const filters = page.getByRole("combobox");
    await expect(filters).toHaveCount(2);

    await filters.nth(0).click();
    await page.getByRole("option", { name: "Expense" }).click();
    await expect(filters.nth(0)).toContainText("Expense");

    await filters.nth(1).click();
    await page.getByRole("option", { name: "Pending" }).click();
    await expect(filters.nth(1)).toContainText("Pending");

    await expectNoHorizontalOverflow(page);
  });

  test("renders responsive transaction cards without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/accounting/transactions");

    await expect(
      page.getByRole("heading", { name: "TRANSACTIONS", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();

    const actionButton = page
      .getByRole("button", { name: /^Actions for / })
      .first();
    await expect(actionButton).toBeVisible();

    const card = actionButton.locator("xpath=ancestor::article");
    await expect(card.getByText("Type", { exact: true })).toBeVisible();
    await expect(card.getByText("Amount", { exact: true })).toBeVisible();
    await expect(card.getByText("Status", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
