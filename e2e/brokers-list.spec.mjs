import { expect, test } from "./playwright.mjs";

test("renders the Broker directory and non-destructive filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/brokers");

  await expect(
    page.getByRole("heading", { name: "Broker Partners", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Directory & Status", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Broker" }),
  ).toBeEnabled();

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Company" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Identifiers" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Contact" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Terms" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Rating" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Status" }),
  ).toBeVisible();

  await expect(
    table.getByText("Meridian Auto Freight", { exact: true }),
  ).toBeVisible();
  await expect(table.getByText("MC: MC-812340", { exact: true })).toBeVisible();
  await expect(
    table.getByText("DOT: USDOT-2481063", { exact: true }),
  ).toBeVisible();
  await expect(table.getByText("Net 15", { exact: true })).toBeVisible();
  await expect(table.getByText("4.8", { exact: true })).toBeVisible();

  const statusFilter = page.getByRole("combobox");
  await statusFilter.click();
  await page.getByRole("option", { name: "ACTIVE" }).click();
  await expect(statusFilter).toContainText("ACTIVE");
  await expect(
    table.getByText("Meridian Auto Freight", { exact: true }),
  ).toBeVisible();

  const search = page.getByPlaceholder("Search Name, MC#, DOT#...");
  await search.fill("__no_matching_broker__");
  await expect(
    page.getByText("NO.RECORDS.FOUND", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "CLEAR.FILTERS" }).click();
  await expect(table).toBeVisible();
  await expect(
    table.getByText("Meridian Auto Freight", { exact: true }),
  ).toBeVisible();

  const firstViewButton = page.getByRole("button", { name: "VIEW" }).first();
  await firstViewButton.click();
  await expect(
    page.getByText("Meridian Auto Freight", { exact: true }).last(),
  ).toBeVisible();
});
