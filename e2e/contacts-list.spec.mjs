import { expect, test } from "./playwright.mjs";

test("renders the CRM Contacts directory and non-destructive search", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/crm/contacts");

  await expect(
    page.getByRole("heading", { name: "Contacts", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Global Address Book", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Contact" }),
  ).toBeEnabled();

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Company" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Contact Name" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Type" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Phone" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Email" }),
  ).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Status" }),
  ).toBeVisible();

  await expect(
    table.getByText("Southeast Auto Auction", { exact: true }),
  ).toBeVisible();
  await expect(table.getByText("Grace Palmer", { exact: true })).toBeVisible();
  await expect(table.getByText("Auction", { exact: true })).toBeVisible();

  const search = page.getByPlaceholder("Search Company, Name...");
  await search.fill("__no_matching_contact__");
  await expect(
    page.getByText("NO.RECORDS.FOUND", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "CLEAR.SEARCH" }).click();
  await expect(table).toBeVisible();
  await expect(
    table.getByText("Southeast Auto Auction", { exact: true }),
  ).toBeVisible();

  const firstRow = table
    .getByRole("row")
    .filter({ hasText: "Southeast Auto Auction" });
  await firstRow.click();

  await expect(
    page.getByText("Southeast Auto Auction", { exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText("Grace Palmer", { exact: true }).last()).toBeVisible();
});
