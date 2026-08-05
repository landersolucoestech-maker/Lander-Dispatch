import { useEffect } from "react";
import {
  getGetCarrierQueryKey,
  useGetCarrier,
  useGetCompanyProfile,
  useGetLoad,
} from "@workspace/api-client-react";
import type {
  Invoice,
  LoadVehicle,
} from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
import { formatCurrency } from "@/shared/lib/utils";
import { Download, X } from "lucide-react";

type InvoiceWithCommission = Invoice & {
  subtotal?: number;
  commissionRate?: number;
};

interface LoadRowResult {
  description: string;
  date: string;
  rate: number;
  extraRows: Array<{ description: string }>;
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

function formatInvoiceDate(date?: string | null) {
  if (!date) return "—";
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function joinAddress(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function useLoadRow(loadId: string): LoadRowResult | null {
  const { data: load } = useGetLoad(loadId);
  if (!load) return null;

  const vehicles: Array<LoadVehicle | null> = load.vehicles?.length
    ? load.vehicles
    : [null];
  const [firstVehicle, ...otherVehicles] = vehicles;

  return {
    description: buildInvoiceDescription({
      loadId: load.loadId,
      year: firstVehicle?.year,
      make: firstVehicle?.make,
      model: firstVehicle?.model,
    }),
    date: formatInvoiceDate(load.dispatchDate),
    rate: load.rate ?? 0,
    extraRows: otherVehicles.map((vehicle) => ({
      description: buildInvoiceDescription({
        loadId: load.loadId,
        year: vehicle?.year,
        make: vehicle?.make,
        model: vehicle?.model,
      }),
    })),
  };
}

function LoadLineRows({ loadId }: { loadId: string }) {
  const row = useLoadRow(loadId);

  if (!row) {
    return (
      <tr>
        <td style={cellMuted}>—</td>
        <td style={cellDescription}>{buildInvoiceDescription({ loadId })}</td>
        <td style={cellRate}>—</td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td style={{ ...cellMuted, whiteSpace: "nowrap" }}>{row.date}</td>
        <td style={cellDescription}>{row.description}</td>
        <td style={cellRate}>{formatCurrency(row.rate)}</td>
      </tr>
      {row.extraRows.map((extraRow, index) => (
        <tr key={`${loadId}-${index}`}>
          <td style={cellMuted} />
          <td style={{ ...cellDescription, color: "#475569" }}>{extraRow.description}</td>
          <td style={cellRate} />
        </tr>
      ))}
    </>
  );
}

const cellMuted: React.CSSProperties = {
  padding: "7px 8px",
  color: "#64748b",
  fontSize: 11,
};

const cellDescription: React.CSSProperties = {
  padding: "7px 8px",
  color: "#0f172a",
  fontSize: 11,
  fontWeight: 500,
};

const cellRate: React.CSSProperties = {
  padding: "7px 8px",
  color: "#0f172a",
  fontSize: 11,
  fontWeight: 700,
  textAlign: "right",
  whiteSpace: "nowrap",
};

function PartyBlock({
  title,
  name,
  contact,
  address,
  phone,
  email,
  website,
}: {
  title: "PAY TO" | "BILL TO";
  name: string;
  contact?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          marginBottom: 8,
          color: "#2563eb",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.16em",
        }}
      >
        {title}
      </div>
      <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 800 }}>{name}</div>
      {contact ? <div style={partyLine}>{contact}</div> : null}
      {address ? <div style={{ ...partyLine, marginTop: 4 }}>{address}</div> : null}
      {phone ? <div style={partyLine}>{phone}</div> : null}
      {email ? <div style={partyLine}>{email}</div> : null}
      {website ? <div style={partyLine}>{website}</div> : null}
    </div>
  );
}

const partyLine: React.CSSProperties = {
  color: "#475569",
  fontSize: 11,
  lineHeight: 1.55,
};

export function InvoicePDFPreview({ invoice, onClose }: Props) {
  const invoiceData = invoice as InvoiceWithCommission;
  const carrierId = invoice.carrierId ?? "";
  const carrierQuery = useGetCarrier(carrierId, {
    query: {
      enabled: Boolean(carrierId),
      queryKey: getGetCarrierQueryKey(carrierId),
    },
  });
  const companyQuery = useGetCompanyProfile();

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "invoice-print-css";
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #invoice-pdf-root {
          display: block !important;
          position: fixed !important;
          inset: 0 !important;
          z-index: 9999 !important;
          background: #fff !important;
        }
        #invoice-pdf-toolbar { display: none !important; }
        #invoice-pdf-paper {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
        @page { size: A4 portrait; margin: 12mm 14mm; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById("invoice-print-css")?.remove();
    };
  }, []);

  const carrier = carrierQuery.data;
  const company = companyQuery.data;
  const subtotal = invoiceData.subtotal ?? 0;
  const commissionRate = invoiceData.commissionRate ?? 0;
  const loadIds = invoice.loadIds ?? [];

  const payToName =
    company?.legalCompanyName || company?.companyName || "Lander Dispatch";
  const payToAddress = joinAddress([
    company?.streetAddress,
    company?.city,
    company?.state,
    company?.zipCode,
    company?.country,
  ]);
  const billToAddress = joinAddress([
    carrier?.companyAddress,
    carrier?.companyCity,
    carrier?.companyState,
    carrier?.companyZip,
  ]);

  return (
    <div
      id="invoice-pdf-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0f172a",
      }}
    >
      <div
        id="invoice-pdf-toolbar"
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #334155",
          background: "#020617",
          padding: "10px 20px",
        }}
      >
        <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>
          INVOICE — {invoice.invoiceNumber}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Close invoice preview">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "center",
          overflow: "auto",
          padding: "32px 24px",
        }}
      >
        <article
          id="invoice-pdf-paper"
          style={{
            width: 794,
            minHeight: 1123,
            flexShrink: 0,
            background: "#fff",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            color: "#0f172a",
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 12,
            lineHeight: 1.5,
            padding: "48px 56px",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 32,
              marginBottom: 30,
            }}
          >
            <div>
              <div style={{ color: "#0f172a", fontSize: 20, fontWeight: 900 }}>
                {company?.companyName || "LANDER DISPATCH"}
              </div>
              <div style={{ marginTop: 4, color: "#2563eb", fontSize: 10, fontWeight: 700 }}>
                DISPATCH MANAGEMENT SERVICES
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "0.05em" }}>
                INVOICE
              </div>
              <div style={{ marginTop: 4, color: "#475569", fontSize: 11 }}>
                {invoice.invoiceNumber}
              </div>
            </div>
          </header>

          <div style={{ borderTop: "3px solid #2563eb", marginBottom: 28 }} />

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              marginBottom: 28,
            }}
          >
            <PartyBlock
              title="PAY TO"
              name={payToName}
              address={payToAddress || "Company address not configured"}
              phone={company?.companyPhone}
              email={company?.companyEmail}
              website={company?.website}
            />
            <PartyBlock
              title="BILL TO"
              name={carrier?.companyName || invoice.carrierName || "Carrier not available"}
              contact={carrier?.primaryContact}
              address={billToAddress || "Carrier address not configured"}
              phone={carrier?.phone}
              email={carrier?.email}
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              marginBottom: 28,
              background: "#cbd5e1",
              border: "1px solid #cbd5e1",
            }}
          >
            {[
              ["INVOICE #", invoice.invoiceNumber],
              ["ISSUE DATE", formatInvoiceDate(invoice.issueDate)],
              ["DUE DATE", formatInvoiceDate(invoice.dueDate)],
              ["STATUS", invoice.status],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "#f8fafc", padding: "10px 12px" }}>
                <div style={{ color: "#64748b", fontSize: 8, fontWeight: 800, letterSpacing: "0.12em" }}>
                  {label}
                </div>
                <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </section>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                <th style={{ ...headerCell, width: 90 }}>DATE</th>
                <th style={headerCell}>DESCRIPTION</th>
                <th style={{ ...headerCell, width: 110, textAlign: "right" }}>RATE</th>
              </tr>
            </thead>
            <tbody>
              {loadIds.length ? (
                loadIds.map((loadId) => <LoadLineRows key={loadId} loadId={loadId} />)
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                    No loads linked to this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <section style={{ display: "flex", justifyContent: "flex-end" }}>
            <table style={{ minWidth: 300, borderCollapse: "collapse" }}>
              <tbody>
                <SummaryRow
                  label={`Subtotal (${loadIds.length} load${loadIds.length === 1 ? "" : "s"})`}
                  value={formatCurrency(subtotal)}
                />
                <SummaryRow
                  label={`Commission (${commissionRate.toFixed(2)}%)`}
                  value={formatCurrency(invoice.total)}
                />
                <tr>
                  <td colSpan={2} style={{ borderTop: "1px solid #cbd5e1", paddingTop: 8 }} />
                </tr>
                <tr style={{ background: "#eff6ff" }}>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800 }}>
                    TOTAL DUE
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 15, fontWeight: 900 }}>
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
                <SummaryRow label="AMOUNT PAID" value={formatCurrency(invoice.amountPaid)} />
                <SummaryRow label="BALANCE" value={formatCurrency(invoice.balance)} emphasized />
              </tbody>
            </table>
          </section>

          {invoice.notes ? (
            <section style={{ marginTop: 32, borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
              <div style={{ color: "#64748b", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em" }}>
                NOTES
              </div>
              <p style={{ marginTop: 7, whiteSpace: "pre-wrap", color: "#334155", fontSize: 11 }}>
                {invoice.notes}
              </p>
            </section>
          ) : null}

          <footer
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 48,
              borderTop: "1px solid #e2e8f0",
              paddingTop: 14,
              color: "#94a3b8",
              fontSize: 9,
            }}
          >
            <span>{payToName}</span>
            <span>Invoice {invoice.invoiceNumber}</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

const headerCell: React.CSSProperties = {
  padding: "9px 8px",
  color: "#fff",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textAlign: "left",
};

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          padding: "5px 14px 5px 0",
          color: emphasized ? "#0f172a" : "#475569",
          fontSize: 11,
          fontWeight: emphasized ? 800 : 500,
          textAlign: "right",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "5px 0",
          color: emphasized ? "#0f172a" : "#334155",
          fontSize: emphasized ? 13 : 11,
          fontWeight: emphasized ? 900 : 600,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </td>
    </tr>
  );
}
