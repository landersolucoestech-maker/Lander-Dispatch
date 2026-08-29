import { expect, test } from "./playwright.mjs";

test("renders the unified CRM Contacts directory and non-destructive search", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/crm");

  await expect(
    page.getByRole("heading", { name: "CRM", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Contacts/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Contact" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Create Lead" }),
  ).toHaveCount(0);

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Company / Contact" }),
  ).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Type" })).toBeVisible();
  await expect(
    table.getByRole("columnheader", { name: "Primary Contact" }),
  ).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Phone" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Email" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: "Source" })).toBeVisible();

  await expect(
    table.getByText("Southeast Auto Auction", { exact: true }),
  ).toBeVisible();
  await expect(table.getByText("Grace Palmer", { exact: true })).toBeVisible();
  await expect(table.getByText("Auction", { exact: true })).toBeVisible();

  const search = page.getByPlaceholder("Search company, contact, phone or driver");
  await search.fill("__no_matching_contact__");
  await expect(page.getByText("No contacts found.", { exact: true })).toBeVisible();

  await search.fill("");
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
