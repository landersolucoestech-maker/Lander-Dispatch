import { expect, test } from "./playwright.mjs";

const TRANSACTION_ID = "d8000000-0000-4000-8000-000000000001";

test("loads a deterministic linked accounting transaction", async ({ page }) => {
  await page.goto(`/accounting/transactions/${TRANSACTION_ID}`);

  await expect(
    page.getByRole("heading", { name: "TXN-DEV-0001", level: 1 }),
  ).toBeVisible();

  const amountRegion = page.getByRole("region", {
    name: "Transaction amount and status",
  });
  await expect(
    amountRegion.getByText("+$155.00", { exact: true }),
  ).toBeVisible();

  const classification = page
    .getByRole("heading", { name: "Classification" })
    .locator("xpath=ancestor::section");
  await expect(classification.getByText("Cleared", { exact: true })).toBeVisible();
  await expect(classification.getByText("Income", { exact: true })).toBeVisible();
  await expect(
    classification.getByText("Commission", { exact: true }),
  ).toBeVisible();

  await expect(page.getByText("Atlantic Auto Transport LLC")).toBeVisible();
  await expect(page.getByText("INV-DEV-0001", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Transaction" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Open Carrier" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Open Invoice" }),
  ).toBeEnabled();
});
