import { expect, test } from "./playwright.mjs";

test("loads live reports and exposes detailed report navigation", async ({ page }) => {
  await page.goto("/reports");

  await expect(
    page.getByRole("heading", { name: "REPORTS", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Operational and financial performance using live system data.",
      { exact: true },
    ),
  ).toBeVisible();

  const exportButton = page.getByRole("button", { name: "Export CSV" });
  await expect(exportButton).toBeEnabled();

  await expect(page.getByText("Total Loads", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Gross Load Revenue", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Outstanding Balance", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pending Transactions", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Financial Summary" }),
  ).toBeVisible();
  await expect(
    page.getByText("Profit and loss for Month to Date.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Revenue", { exact: true })).toBeVisible();
  await expect(page.getByText("Expenses", { exact: true })).toBeVisible();
  await expect(page.getByText("Net Profit", { exact: true })).toBeVisible();
  await expect(page.getByText("Profit Margin", { exact: true })).toBeVisible();

  const periodTrigger = page.getByRole("combobox");
  await expect(periodTrigger).toContainText("Month to Date");
  await periodTrigger.click();
  await page.getByRole("option", { name: "Year to Date" }).click();

  await expect(periodTrigger).toContainText("Year to Date");
  await expect(
    page.getByText("Profit and loss for Year to Date.", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Detailed Reports" }),
  ).toBeVisible();

  const detailedReports = page
    .getByRole("heading", { name: "Detailed Reports" })
    .locator("xpath=ancestor::section");

  const reportLinks = detailedReports.getByRole("link");
  await expect(reportLinks).toHaveCount(4);
  await expect(reportLinks.nth(0)).toHaveAttribute("href", "/loads");
  await expect(reportLinks.nth(1)).toHaveAttribute(
    "href",
    "/accounting/invoices",
  );
  await expect(reportLinks.nth(2)).toHaveAttribute(
    "href",
    "/accounting/transactions",
  );
  await expect(reportLinks.nth(3)).toHaveAttribute(
    "href",
    "/accounting/profit-loss",
  );

  await expect(
    detailedReports.getByRole("button", { name: "Open report" }),
  ).toHaveCount(4);
});
