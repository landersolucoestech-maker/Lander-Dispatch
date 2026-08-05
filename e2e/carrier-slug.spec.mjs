import { expect, test } from "./playwright.mjs";

const CARRIER_ID = "d1000000-0000-4000-8000-000000000001";

test("loads a deterministic Carrier operational record", async ({ page }) => {
  await page.goto(`/carriers/${CARRIER_ID}`);

  await expect(
    page.getByRole("heading", {
      name: "Atlantic Auto Transport LLC",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("MC MC-1045827 · USDOT USDOT-3178421", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();

  await expect(page.getByText("Marcus Reed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("4.9 / 5.0", { exact: true })).toBeVisible();

  const contacts = page
    .getByRole("heading", { name: "Contacts" })
    .locator("xpath=ancestor::section");
  await expect(
    contacts.getByText("+1 (904) 555-0101", { exact: true }),
  ).toBeVisible();
  await expect(
    contacts.getByText("dispatch@atlantic-auto.test", { exact: true }),
  ).toBeVisible();
  await expect(contacts.getByText("Dana Reed", { exact: true })).toBeVisible();

  const compliance = page
    .getByRole("heading", { name: "Authority & Compliance" })
    .locator("xpath=ancestor::section");
  await expect(
    compliance.getByText("USDOT-3178421", { exact: true }),
  ).toBeVisible();
  await expect(
    compliance.getByText("MC-1045827", { exact: true }),
  ).toBeVisible();
  await expect(
    compliance.getByText("59-8742103", { exact: true }),
  ).toBeVisible();

  const operations = page
    .getByRole("heading", { name: "Operations" })
    .locator("xpath=ancestor::section");
  await expect(
    operations.getByText("FL, GA, SC, NC, AL", { exact: true }),
  ).toBeVisible();
  await expect(operations.getByText("5", { exact: true })).toBeVisible();

  const fleet = page
    .getByRole("heading", { name: "Fleet Equipment" })
    .locator("xpath=ancestor::section");
  await expect(fleet.getByText("Equipment #1", { exact: true })).toBeVisible();
  await expect(
    fleet.getByText("2022 Ram 3500 Limited", { exact: true }),
  ).toBeVisible();
  await expect(
    fleet.getByText("2023 Kaufman EZ-4 Car Hauler", { exact: true }),
  ).toBeVisible();
  await expect(
    fleet.getByText("3C63RRGL7NG100101", { exact: true }),
  ).toBeVisible();
  await expect(
    fleet.getByText("5VGFE4823PC100101", { exact: true }),
  ).toBeVisible();

  const payment = page
    .getByRole("heading", { name: "Payment & Factoring" })
    .locator("xpath=ancestor::section");
  await expect(payment.getByText("Net 7", { exact: true })).toBeVisible();
  await expect(
    payment.getByText("Triumph Business Capital", { exact: true }),
  ).toBeVisible();
  await expect(payment.getByText("2.50%", { exact: true })).toBeVisible();

  const banking = page
    .getByRole("heading", { name: "Banking" })
    .locator("xpath=ancestor::section");
  await expect(
    banking.getByText("Development Bank", { exact: true }),
  ).toBeVisible();
  await expect(banking.getByText("•••• 4821", { exact: true })).toBeVisible();
  await expect(banking.getByText("•••• 0098", { exact: true })).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Edit Carrier" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Back to carriers" }),
  ).toBeEnabled();
});
