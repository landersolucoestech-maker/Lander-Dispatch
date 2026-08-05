import { expect, test } from "./playwright.mjs";

test("uploads and deletes a private document with audited browser lifecycle", async ({
  page,
}) => {
  const documentName = `playwright-document-${Date.now()}.txt`;
  let uploaded = false;

  try {
    await page.goto("/documents");
    await page.getByRole("button", { name: "Upload Document" }).click();

    const dialog = page.getByRole("dialog", { name: "Upload Document" });
    await expect(dialog).toBeVisible();

    await dialog.locator('input[type="file"]').setInputFiles({
      name: documentName,
      mimeType: "text/plain",
      buffer: Buffer.from(
        `Lander Dispatch Playwright document lifecycle ${documentName}\n`,
        "utf8",
      ),
    });
    await dialog.locator('input[type="text"]').first().fill(documentName);
    await dialog
      .getByRole("button", { name: "Upload Document", exact: true })
      .click();

    await expect(dialog).toBeHidden();

    const documentCard = page
      .getByRole("article")
      .filter({ hasText: documentName });
    await expect(documentCard).toBeVisible();
    uploaded = true;

    await page.goto("/audit-log");
    await page
      .getByPlaceholder("Search summary or actor email")
      .fill(documentName);
    await expect(
      page.getByText(`Uploaded document ${documentName}`),
    ).toBeVisible();
  } finally {
    if (uploaded) {
      await page.goto("/documents");
      await page
        .getByPlaceholder("Search document name or notes")
        .fill(documentName);

      const documentCard = page
        .getByRole("article")
        .filter({ hasText: documentName });
      await expect(documentCard).toBeVisible();

      page.once("dialog", (dialog) => {
        void dialog.accept();
      });
      await documentCard
        .getByRole("button", { name: `Actions for ${documentName}` })
        .click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await expect(documentCard).toBeHidden();

      await page.goto("/audit-log");
      await page
        .getByPlaceholder("Search summary or actor email")
        .fill(documentName);
      await expect(
        page.getByText(`Deleted document ${documentName}`),
      ).toBeVisible();
    }
  }
});
