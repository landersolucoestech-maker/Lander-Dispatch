import { expect, test } from "./playwright.mjs";

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

  await expect(page.getByDisplayValue("Lander Dispatch")).toBeVisible();
  await expect(
    page.getByDisplayValue("Lander Dispatch Services LLC"),
  ).toBeVisible();
  await expect(page.getByDisplayValue("88-1047296")).toBeVisible();
  await expect(page.getByDisplayValue("MC-1548207")).toBeVisible();
  await expect(page.getByDisplayValue("USDOT-4027815")).toBeVisible();
  await expect(
    page.getByDisplayValue("operations@landerdispatch.test"),
  ).toBeVisible();
  await expect(
    page.getByDisplayValue("6900 Tavistock Lakes Blvd"),
  ).toBeVisible();
  await expect(page.getByDisplayValue("Orlando")).toBeVisible();
  await expect(page.getByDisplayValue("FL")).toBeVisible();
  await expect(page.getByDisplayValue("32827")).toBeVisible();

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
  await expect(
    page.getByDisplayValue("operations@landerdispatch.test"),
  ).toBeVisible();
  await expect(saveButton).toBeDisabled();
});
