import { expect, test } from "./playwright.mjs";

test("renders the CRM Leads demand pipeline and non-destructive filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/crm/leads");

  await expect(
    page.getByRole("heading", { name: "Leads", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("CRM Pipeline", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Lead" }),
  ).toBeEnabled();

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Company" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Contact" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Stage" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Est. Weekly Rev" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Next Follow-Up" }),
  ).toBeVisible();

  await expect(
    table.getByText("Granite Motors Network", { exact: true }),
  ).toBeVisible();
  await expect(table.getByText("Qualified", { exact: true })).toBeVisible();

  const stageFilter = page.getByRole("combobox");
  await stageFilter.click();
  await page.getByRole("option", { name: "QUALIFIED" }).click();
  await expect(stageFilter).toContainText("QUALIFIED");
  await expect(
    table.getByText("Granite Motors Network", { exact: true }),
  ).toBeVisible();

  const search = page.getByPlaceholder("Search Company, Contact...");
  await search.fill("__no_matching_lead__");
  await expect(
    page.getByText("NO.RECORDS.FOUND", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "CLEAR.FILTERS" }).click();
  await expect(table).toBeVisible();
  await expect(
    table.getByText("Granite Motors Network", { exact: true }),
  ).toBeVisible();

  const leadRow = table
    .getByRole("row")
    .filter({ hasText: "Granite Motors Network" });
  await leadRow.click();

  await expect(
    page.getByText("Granite Motors Network", { exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText("Qualified", { exact: true }).last()).toBeVisible();
});
