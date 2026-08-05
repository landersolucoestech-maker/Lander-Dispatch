import { expect, test } from "./playwright.mjs";

const DRIVER_ID = "d5000000-0000-4000-8000-000000000001";

test("loads a deterministic Driver qualification record", async ({ page }) => {
  await page.goto(`/crm/drivers/${DRIVER_ID}`);

  await expect(
    page.getByRole("heading", { name: "Marcus Reed", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Company Driver · Full Time", { exact: true }),
  ).toBeVisible();

  const summary = page.getByRole("region", { name: "Driver summary" });
  await expect(summary.getByText("9 years", { exact: true })).toBeVisible();
  await expect(summary.getByText("186", { exact: true })).toBeVisible();
  await expect(summary.getByText("Complete", { exact: true })).toBeVisible();

  const license = page
    .getByRole("heading", { name: "Driver License" })
    .locator("xpath=ancestor::section");
  await expect(
    license.getByText("FL-R300-540-88-214-0", { exact: true }),
  ).toBeVisible();
  await expect(license.getByText("E", { exact: true })).toBeVisible();

  const cdl = page
    .getByRole("heading", { name: "Commercial Driver License" })
    .locator("xpath=ancestor::section");
  await expect(cdl.getByText("FL-CDL-9100101", { exact: true })).toBeVisible();
  await expect(cdl.getByText("A", { exact: true })).toBeVisible();
  await expect(cdl.getByText("T", { exact: true })).toBeVisible();

  const medical = page
    .getByRole("heading", { name: "Medical Qualification" })
    .locator("xpath=ancestor::section");
  await expect(
    medical.getByText("MED-FL-100101", { exact: true }),
  ).toBeVisible();
  await expect(
    medical.getByText("Dr. Amelia Grant", { exact: true }),
  ).toBeVisible();

  const qualification = page
    .getByRole("heading", { name: "TWIC and Qualification File" })
    .locator("xpath=ancestor::section");
  await expect(
    qualification.getByText("TWIC-100101", { exact: true }),
  ).toBeVisible();
  await expect(
    qualification.getByText("Compliant", { exact: true }),
  ).toBeVisible();

  const mvr = page
    .getByRole("heading", { name: "MVR and Background" })
    .locator("xpath=ancestor::section");
  await expect(mvr.getByText("Clear", { exact: true })).toHaveCount(2);

  const tests = page
    .getByRole("heading", { name: "Drug, Alcohol and Clearinghouse" })
    .locator("xpath=ancestor::section");
  await expect(tests.getByText("Negative", { exact: true })).toHaveCount(2);
  await expect(tests.getByText("Clear", { exact: true })).toBeVisible();

  const assignments = page
    .getByRole("heading", { name: "Assignments" })
    .locator("xpath=ancestor::section");
  await expect(
    assignments.getByText(
      "d1000000-0000-4000-8000-000000000001",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    assignments.getByRole("button", { name: "Open Assigned Carrier" }),
  ).toBeEnabled();

  await expect(
    page.getByRole("button", { name: "Edit Driver" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Call Driver" }),
  ).toBeEnabled();
});
