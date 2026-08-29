import { expect, test } from "./playwright.mjs";

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth,
  );
}

async function selectDriverContacts(page) {
  const typeFilter = page.getByRole("combobox").first();
  await typeFilter.click();
  await page.getByRole("option", { name: "Driver", exact: true }).click();
  await expect(typeFilter).toContainText("Driver");
}

test.describe("CRM driver contacts", () => {
  test("renders driver records through the Contacts directory", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/crm");

    await expect(
      page.getByRole("heading", { name: "CRM", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Contacts/ })).toBeVisible();
    await selectDriverContacts(page);

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Company / Contact" }),
    ).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Source" })).toBeVisible();

    await expect(table.getByText("Marcus Reed", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Driver", { exact: true }).first()).toBeVisible();

    const search = page.getByPlaceholder("Search company, contact, phone or driver");
    await search.fill("__no_matching_driver__");
    await expect(page.getByText("No contacts found.", { exact: true })).toBeVisible();

    await search.fill("");
    await expect(table.getByText("Marcus Reed", { exact: true }).first()).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test("renders driver contacts without horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/crm");
    await selectDriverContacts(page);

    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByText("Marcus Reed", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Driver", { exact: true }).first()).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
