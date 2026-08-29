import { expect, test } from "./playwright.mjs";

test("renders the CRM Leads demand pipeline and non-destructive filters", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/crm");

  await page.getByRole("button", { name: /Leads/ }).click();

  await expect(
    page.getByRole("heading", { name: "CRM", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Lead" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Create Contact" }),
  ).toHaveCount(0);

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Company" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Lead Type" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Contact" })).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Pipeline Stage" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Est. Weekly Revenue" }),
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
  await page.getByRole("option", { name: "Qualified" }).click();
  await expect(stageFilter).toContainText("Qualified");
  await expect(
    table.getByText("Granite Motors Network", { exact: true }),
  ).toBeVisible();

  const search = page.getByPlaceholder("Search company or contact");
  await search.fill("__no_matching_lead__");
  await expect(page.getByText("No leads found.", { exact: true })).toBeVisible();

  await search.fill("");
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
