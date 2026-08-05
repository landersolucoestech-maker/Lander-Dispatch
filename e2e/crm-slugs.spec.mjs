import { expect, test } from "./playwright.mjs";

const CONTACT_ID = "d3000000-0000-4000-8000-000000000001";
const LEAD_ID = "d4000000-0000-4000-8000-000000000001";

test.describe("CRM slug pages", () => {
  test("loads a deterministic generic contact record", async ({ page }) => {
    await page.goto(`/crm/contacts/${CONTACT_ID}`);

    await expect(
      page.getByRole("heading", {
        name: "Southeast Auto Auction",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Auction · CRM relationship record"),
    ).toBeVisible();
    await expect(page.getByText("Grace Palmer")).toBeVisible();
    await expect(page.getByText("Florida and Southeast")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Contact" }),
    ).toBeEnabled();
  });

  test("loads a deterministic demand Lead without mutating it", async ({
    page,
  }) => {
    await page.goto(`/crm/leads/${LEAD_ID}`);

    await expect(
      page.getByRole("heading", {
        name: "Granite Motors Network",
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByText("Qualified", { exact: true })).toBeVisible();
    await expect(page.getByText("Dealer · Demand prospect")).toBeVisible();
    await expect(page.getByText("Estimated Weekly Revenue")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit Lead" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Convert to Contact" }),
    ).toBeEnabled();
  });
});
