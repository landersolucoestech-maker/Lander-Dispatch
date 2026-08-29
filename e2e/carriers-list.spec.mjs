import { expect, test } from "./playwright.mjs";

test("renders the Carrier directory and non-destructive filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/carriers");

  const header = page.getByRole("banner");
  await expect(
    header.getByRole("heading", { name: "Carrier Network", level: 1 }),
  ).toBeVisible();
  await expect(header.getByText("Directory & Status", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Carrier" }),
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
    table.getByRole("columnheader", { name: "Rating" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Last Load" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Status" }),
  ).toBeVisible();

  const atlanticRow = table.getByRole("row").filter({
    hasText: "Atlantic Auto Transport LLC",
  });
  await expect(atlanticRow).toBeVisible();
  await expect(atlanticRow.getByText("MC: MC-1045827", { exact: true })).toBeVisible();
  await expect(
    atlanticRow.getByText("DOT: USDOT-3178421", { exact: true }),
  ).toBeVisible();
  await expect(atlanticRow.getByText("Marcus Reed", { exact: true })).toBeVisible();
  await expect(atlanticRow.getByText("4.9", { exact: true })).toBeVisible();

  const statusFilter = page.getByRole("combobox");
  await statusFilter.click();
  await page.getByRole("option", { name: "PENDING" }).click();
  await expect(statusFilter).toContainText("PENDING");
  await expect(
    table.getByText("Sunline Hauling Group", { exact: true }),
  ).toBeVisible();

  const search = page.getByPlaceholder("Search Name, MC#, DOT#...");
  await search.fill("__no_matching_carrier__");
  await expect(
    page.getByText("NO.RECORDS.FOUND", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "CLEAR.FILTERS" }).click();
  await expect(table).toBeVisible();
  await expect(atlanticRow).toBeVisible();

  await atlanticRow.getByRole("button", { name: "VIEW" }).click();
  await expect(
    page.getByText("Atlantic Auto Transport LLC", { exact: true }).last(),
  ).toBeVisible();
});
