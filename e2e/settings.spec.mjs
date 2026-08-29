import { expect, test } from "./playwright.mjs";

async function expectInputValue(page, value) {
  await expect
    .poll(() =>
      page.locator("input").evaluateAll(
        (inputs, expected) => inputs.some((input) => input.value === expected),
        value,
      ),
    )
    .toBe(true);
}

test("loads company settings and enforces non-destructive form validation", async ({
  page,
}) => {
  await page.goto("/settings");

  await expect(
    page.getByRole("heading", { name: "SETTINGS", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Company profile used in invoices, documents and operational communication.",
      { exact: true },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Company Identity" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Regulatory Identifiers" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contact Information" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Company Address" }),
  ).toBeVisible();

  await expectInputValue(page, "Lander Dispatch");
  await expectInputValue(page, "Lander Dispatch Services LLC");
  await expectInputValue(page, "88-1047296");
  await expectInputValue(page, "MC-1548207");
  await expectInputValue(page, "USDOT-4027815");
  await expectInputValue(page, "operations@landerdispatch.test");
  await expectInputValue(page, "6900 Tavistock Lakes Blvd");
  await expectInputValue(page, "Orlando");
  await expectInputValue(page, "FL");
  await expectInputValue(page, "32827");

  const saveButton = page.getByRole("button", { name: "Save Changes" });
  await expect(saveButton).toBeDisabled();

  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill("invalid-email");

  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();
  await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
  await expect(saveButton).toBeDisabled();

  await emailInput.fill("operations+qa@landerdispatch.test");
  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toHaveCount(0);
  await expect(emailInput).toHaveAttribute("aria-invalid", "false");
  await expect(saveButton).toBeEnabled();

  await page.reload();
  await expectInputValue(page, "operations@landerdispatch.test");
  await expect(saveButton).toBeDisabled();
});
