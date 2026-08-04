/**
 * Builds the standardised invoice line-item description.
 *
 * Format: `LOAD ID - YEAR MAKE MODEL`
 * e.g.   `LD-000123 - 2022 Toyota Camry`
 *
 * Rules (per spec):
 *  - space before and after the hyphen
 *  - space between Year, Make, Model
 *  - no commas, no slashes, no double spaces
 *  - no trailing / leading spaces
 *  - if one side is missing → omit the hyphen
 *  - if both sides are empty → "No description"
 */
export function buildInvoiceDescription({
  loadId,
  year,
  make,
  model,
}: {
  loadId?: string | null;
  year?: string | number | null;
  make?: string | null;
  model?: string | null;
}): string {
  const vehicleDescription = [year, make, model]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const normalizedLoadId = String(loadId ?? "").trim();

  if (normalizedLoadId && vehicleDescription) {
    return `${normalizedLoadId} - ${vehicleDescription}`;
  }

  return normalizedLoadId || vehicleDescription || "No description";
}
