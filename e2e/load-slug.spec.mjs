import { expect, test } from "./playwright.mjs";

const LOAD_ID = "d6000000-0000-4000-8000-000000000001";

test("loads a deterministic operational Load with route, parties and vehicle", async ({
  page,
}) => {
  await page.goto(`/loads/${LOAD_ID}`);

  await expect(
    page.getByRole("heading", { name: "Load LD-DEV-1001", level: 1 }),
  ).toBeVisible();

  const summary = page.getByRole("region", { name: "Load summary" });
  await expect(summary.getByText("420.00 mi", { exact: true })).toBeVisible();
  await expect(summary.getByText("$1,250.00", { exact: true })).toBeVisible();
  await expect(summary.getByText("$1,050.00", { exact: true })).toBeVisible();
  await expect(summary.getByText("Paid", { exact: true })).toBeVisible();

  const route = page
    .getByRole("heading", { name: "Route" })
    .locator("xpath=ancestor::section");
  await expect(route.getByText("Sanford, FL", { exact: true })).toBeVisible();
  await expect(route.getByText("Columbia, SC", { exact: true })).toBeVisible();

  const pickup = page
    .getByRole("heading", { name: "Pickup Facility" })
    .locator("xpath=ancestor::section");
  await expect(
    pickup.getByText("Southeast Auto Auction", { exact: true }),
  ).toBeVisible();
  await expect(pickup.getByText("Grace Palmer", { exact: true })).toBeVisible();
  await expect(
    pickup.getByText("1200 Auction Lane, Sanford, FL, 32771", { exact: true }),
  ).toBeVisible();

  const delivery = page
    .getByRole("heading", { name: "Delivery Facility" })
    .locator("xpath=ancestor::section");
  await expect(
    delivery.getByText("Palmetto Motors Group", { exact: true }),
  ).toBeVisible();
  await expect(delivery.getByText("Eric Dawson", { exact: true })).toBeVisible();

  const carrier = page
    .getByRole("heading", { name: "Carrier" })
    .locator("xpath=ancestor::section");
  await expect(
    carrier.getByText("Atlantic Auto Transport LLC", { exact: true }),
  ).toBeVisible();

  const broker = page
    .getByRole("heading", { name: "Broker" })
    .locator("xpath=ancestor::section");
  await expect(
    broker.getByText("Meridian Auto Freight", { exact: true }),
  ).toBeVisible();

  const vehicles = page
    .getByRole("heading", { name: /^Vehicles \(1\)$/ })
    .locator("xpath=ancestor::section");
  await expect(
    vehicles.getByRole("heading", {
      name: "2022 Toyota Highlander XLE",
      level: 3,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    vehicles.getByText("5TDGZRBH2NS100001", { exact: true }),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Edit Load" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Open Carrier" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Open Broker" })).toBeEnabled();
});
