import { expect, test } from "./playwright.mjs";

const BROKER_ID = "d2000000-0000-4000-8000-000000000001";

test("loads a deterministic Broker with authority and payment profile", async ({
  page,
}) => {
  await page.goto(`/brokers/${BROKER_ID}`);

  await expect(
    page.getByRole("heading", { name: "Meridian Auto Freight", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Freight Broker · MC MC-812340", { exact: true }),
  ).toBeVisible();

  const summary = page.getByRole("region", { name: "Broker summary" });
  await expect(summary.getByText("High", { exact: true })).toBeVisible();
  await expect(summary.getByText("4.8 / 5.0", { exact: true })).toBeVisible();
  await expect(summary.getByText("Completed", { exact: true })).toBeVisible();

  const authority = page
    .getByRole("heading", { name: "Authority" })
    .locator("xpath=ancestor::section");
  await expect(authority.getByText("MC-812340", { exact: true })).toBeVisible();
  await expect(
    authority.getByText("USDOT-2481063", { exact: true }),
  ).toBeVisible();

  const coverage = page
    .getByRole("heading", { name: "Coverage" })
    .locator("xpath=ancestor::section");
  await expect(coverage.getByText("Nationwide", { exact: true })).toBeVisible();
  await expect(
    coverage.getByText("Auto Transport", { exact: true }),
  ).toBeVisible();
  await expect(
    coverage.getByText("Dealer Transfers", { exact: true }),
  ).toBeVisible();

  const payment = page
    .getByRole("heading", { name: "Payment Profile" })
    .locator("xpath=ancestor::section");
  await expect(payment.getByText("Net 15", { exact: true })).toBeVisible();
  await expect(payment.getByText("14 days", { exact: true })).toBeVisible();
  await expect(
    payment.getByText("Available · 2.00% fee", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Edit Broker" }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Call" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Email" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Website" })).toBeEnabled();
});
