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

test.describe("Profit and loss", () => {
  test("renders financial summary, category breakdowns and period selection", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/accounting/profit-loss");

    await expect(
      page.getByRole("heading", { name: "PROFIT & LOSS", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Financial performance based on recorded transactions.",
        { exact: true },
      ),
    ).toBeVisible();

    const exportButton = page.getByRole("button", { name: "Export CSV" });
    await expect(exportButton).toBeEnabled();

    await expect(page.getByText("Total Revenue", { exact: true })).toBeVisible();
    await expect(page.getByText("Total Expenses", { exact: true })).toBeVisible();
    await expect(page.getByText("Net Profit", { exact: true })).toBeVisible();

    const revenueBreakdown = page
      .getByRole("heading", { name: "Revenue Breakdown" })
      .locator("xpath=ancestor::section");
    const expenseBreakdown = page
      .getByRole("heading", { name: "Expense Breakdown" })
      .locator("xpath=ancestor::section");

    await expect(revenueBreakdown).toBeVisible();
    await expect(expenseBreakdown).toBeVisible();
    await expect(
      revenueBreakdown.getByText(
        "Recorded categories for the selected period.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      expenseBreakdown.getByText(
        "Recorded categories for the selected period.",
        { exact: true },
      ),
    ).toBeVisible();

    const periodTrigger = page.getByRole("combobox");
    await expect(periodTrigger).toContainText("Month to Date");

    await periodTrigger.click();
    await page.getByRole("option", { name: "Year to Date" }).click();

    await expect(periodTrigger).toContainText("Year to Date");
    await expect(page.getByText("Year to Date", { exact: true })).toHaveCount(2);
    await expect(exportButton).toBeEnabled();

    await expectNoHorizontalOverflow(page);
  });

  test("renders the report without horizontal overflow on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/accounting/profit-loss");

    await expect(
      page.getByRole("heading", { name: "PROFIT & LOSS", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revenue Breakdown" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Expense Breakdown" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export CSV" }),
    ).toBeEnabled();

    await expectNoHorizontalOverflow(page);
  });
});
