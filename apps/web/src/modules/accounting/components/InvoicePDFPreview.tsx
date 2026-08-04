/**
 * InvoicePDFPreview
 * Full-screen, print-ready invoice document with a "Download PDF" button.
 * Uses the browser's native print-to-PDF — no external libs required.
 */
import { useEffect } from "react";
import type { Invoice } from "@workspace/api-client-react";
import { useGetLoad, useGetCarrier, getGetCarrierQueryKey, useGetCompanyProfile } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/shared/lib/utils";
import { buildInvoiceDescription } from "@/shared/lib/invoice-utils";
import { Download, X } from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// ── load rows ─────────────────────────────────────────────────────────────────

interface LoadRowResult {
  description: string;
  date: string;
  rate: number;
  extraRows: Array<{ description: string }>;
}

function useLoadRow(loadId: string): LoadRowResult | null {
  const { data: load } = useGetLoad(loadId);
  if (!load) return null;
  const vehicles: any[] = (load as any).vehicles ?? [];
  const rate = parseFloat(String((load as any).rate ?? "0")) || 0;
  const dispatchDate: string | null = (load as any).dispatchDate ?? null;
  const date = dispatchDate ? fmt(dispatchDate) : "—";
  const [first, ...rest] = vehicles.length > 0 ? vehicles : [null];
  return {
    description: buildInvoiceDescription({ loadId: (load as any).loadId, year: first?.year, make: first?.make, model: first?.model }),
    date,
    rate,
    extraRows: rest.map((v) => ({
      description: buildInvoiceDescription({ loadId: (load as any).loadId, year: v?.year, make: v?.make, model: v?.model }),
    })),
  };
}

function LoadLineRows({ loadId }: { loadId: string }) {
  const row = useLoadRow(loadId);
  if (!row) {
    return (
      <tr>
        <td style={{ padding: "6px 8px", color: "#888", fontFamily: "monospace", fontSize: 11 }}>{fmt(null)}</td>
        <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#444" }}>
          {buildInvoiceDescription({ loadId })}
        </td>
        <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 11 }}>—</td>
      </tr>
    );
  }
  return (
    <>
      <tr>
        <td style={{ padding: "6px 8px", color: "#888", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{row.date}</td>
        <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#111" }}>{row.description}</td>
        <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#111" }}>
          {formatCurrency(row.rate)}
        </td>
      </tr>
      {row.extraRows.map((r, i) => (
        <tr key={i}>
          <td style={{ padding: "6px 8px" }} />
          <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#444" }}>{r.description}</td>
          <td style={{ padding: "6px 8px" }} />
        </tr>
      ))}
    </>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoicePDFPreview({ invoice, onClose }: Props) {
  const d = invoice as any;

  const { data: carrier } = useGetCarrier(d.carrierId ?? "", {
    query: { enabled: !!d.carrierId, queryKey: getGetCarrierQueryKey(d.carrierId ?? "") },
  });
  const { data: company } = useGetCompanyProfile();

  // Inject print CSS once on mount, remove on unmount
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "invoice-print-css";
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #invoice-pdf-root { display: block !important; position: fixed !important; inset: 0 !important; z-index: 9999 !important; background: #fff !important; }
        #invoice-pdf-toolbar { display: none !important; }
        #invoice-pdf-paper { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; width: 100% !important; max-width: 100% !important; }
        @page { size: A4 portrait; margin: 12mm 14mm; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("invoice-print-css")?.remove(); };
  }, []);

  const subtotal = Number(d.subtotal ?? 0);
  const commissionRate = Number(d.commissionRate ?? 0);
  const total = Number(invoice.total ?? 0);
  const loadIds: string[] = d.loadIds ?? [];

  const payName = company?.companyName ?? "LANDER DISPATCH";
  const payAddr = [company?.streetAddress, [company?.city, company?.state, company?.zipCode].filter(Boolean).join(", ")].filter(Boolean);
  const payPhone = company?.companyPhone;
  const payEmail = company?.companyEmail;
  const payWeb = company?.website;

  const billName = carrier?.companyName ?? "—";
  const billContact = carrier?.primaryContact;
  const billAddr = carrier?.companyAddress;
  const billCityStateZip = [carrier?.companyCity, carrier?.companyState, (carrier as any)?.companyZip].filter(Boolean).join(", ");
  const billPhone = carrier?.phone;
  const billEmail = carrier?.email;

  return (
    <div
      id="invoice-pdf-root"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#1a1a1a",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        id="invoice-pdf-toolbar"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", background: "#111", borderBottom: "1px solid #333",
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 13, color: "#aaa", letterSpacing: "0.1em" }}>
          INVOICE — {invoice.invoiceNumber}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable paper area */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 24px", display: "flex", justifyContent: "center" }}>
        <div
          id="invoice-pdf-paper"
          style={{
            background: "#fff",
            width: 794,
            minHeight: 1123,
            borderRadius: 4,
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
            padding: "48px 56px",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            color: "#111",
            fontSize: 12,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          {/* ── 1. Header: Pay To (sender) + Invoice Info ── */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
            {/* Pay To */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.05em", marginBottom: 6, textTransform: "uppercase" }}>
                {payName}
              </div>
              {payAddr.map((line, i) => (
                <div key={i} style={{ fontSize: 11, color: "#555" }}>{line}</div>
              ))}
              {payPhone && <div style={{ fontSize: 11, color: "#555" }}>{payPhone}</div>}
              {payEmail && <div style={{ fontSize: 11, color: "#555" }}>{payEmail}</div>}
              {payWeb && <div style={{ fontSize: 11, color: "#555" }}>{payWeb}</div>}
            </div>

            {/* Invoice meta */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
                Invoice
              </div>
              <table style={{ marginLeft: "auto", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 10, color: "#888", textTransform: "uppercase", paddingRight: 16, paddingBottom: 3 }}>Invoice #</td>
                    <td style={{ fontSize: 11, fontWeight: 700, textAlign: "right", paddingBottom: 3 }}>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 10, color: "#888", textTransform: "uppercase", paddingRight: 16, paddingBottom: 3 }}>Issue Date</td>
                    <td style={{ fontSize: 11, textAlign: "right", paddingBottom: 3 }}>{fmt(invoice.issueDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 10, color: "#888", textTransform: "uppercase", paddingRight: 16, paddingBottom: 3 }}>Due Date</td>
                    <td style={{ fontSize: 11, textAlign: "right", paddingBottom: 3 }}>{fmt(invoice.dueDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 10, color: "#888", textTransform: "uppercase", paddingRight: 16 }}>Status</td>
                    <td style={{ fontSize: 11, fontWeight: 700, textAlign: "right", textTransform: "uppercase", color: invoice.status === "Paid" ? "#16a34a" : invoice.status === "Overdue" ? "#dc2626" : "#111" }}>
                      {invoice.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 2. Divider ── */}
          <div style={{ borderTop: "2px solid #111", marginBottom: 28 }} />

          {/* ── 3. Bill To ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888", marginBottom: 6 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{billName}</div>
            {billContact && <div style={{ fontSize: 11, color: "#555" }}>{billContact}</div>}
            {billAddr && <div style={{ fontSize: 11, color: "#555" }}>{billAddr}</div>}
            {billCityStateZip && <div style={{ fontSize: 11, color: "#555" }}>{billCityStateZip}</div>}
            {billPhone && <div style={{ fontSize: 11, color: "#555" }}>{billPhone}</div>}
            {billEmail && <div style={{ fontSize: 11, color: "#555" }}>{billEmail}</div>}
          </div>

          {/* ── 4. Items Table ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                <th style={{ padding: "8px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#fff", fontWeight: 600, width: 80 }}>Date</th>
                <th style={{ padding: "8px", textAlign: "left", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#fff", fontWeight: 600 }}>Description</th>
                <th style={{ padding: "8px", textAlign: "right", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#fff", fontWeight: 600, width: 90 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {loadIds.length > 0 ? (
                loadIds.map((id) => <LoadLineRows key={id} loadId={id} />)
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: "12px 8px", fontFamily: "monospace", fontSize: 11, color: "#888", textAlign: "center" }}>
                    No loads linked.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── 5. Totals ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            <table style={{ borderCollapse: "collapse", minWidth: 260 }}>
              <tbody>
                {subtotal > 0 && (
                  <tr>
                    <td style={{ padding: "4px 16px 4px 0", fontSize: 11, color: "#555", textAlign: "right" }}>
                      Subtotal ({loadIds.length} load{loadIds.length !== 1 ? "s" : ""})
                    </td>
                    <td style={{ padding: "4px 0", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(subtotal)}</td>
                  </tr>
                )}
                {commissionRate > 0 && (
                  <tr>
                    <td style={{ padding: "4px 16px 4px 0", fontSize: 11, color: "#555", textAlign: "right" }}>Commission ({commissionRate}%)</td>
                    <td style={{ padding: "4px 0", fontSize: 11, textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(total)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2}><div style={{ borderTop: "1px solid #ddd", margin: "6px 0" }} /></td>
                </tr>
                <tr style={{ background: "#f5f5f5" }}>
                  <td style={{ padding: "8px 16px 8px 8px", fontSize: 12, fontWeight: 700, textAlign: "right" }}>Total Due</td>
                  <td style={{ padding: "8px 0", fontSize: 13, fontWeight: 800, textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(total)}</td>
                </tr>
                {invoice.amountPaid > 0 && (
                  <>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", fontSize: 11, color: "#16a34a", textAlign: "right" }}>Amount Paid</td>
                      <td style={{ padding: "4px 0", fontSize: 11, color: "#16a34a", textAlign: "right", fontFamily: "monospace" }}>({formatCurrency(invoice.amountPaid)})</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 16px 4px 0", fontSize: 12, fontWeight: 700, textAlign: "right" }}>Balance Due</td>
                      <td style={{ padding: "4px 0", fontSize: 12, fontWeight: 700, textAlign: "right", fontFamily: "monospace", color: invoice.balance > 0 ? "#dc2626" : "#16a34a" }}>{formatCurrency(invoice.balance)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── 6. Bank Details ── */}
          {invoice.notes && (
            <div style={{ borderTop: "1px solid #ddd", paddingTop: 20, marginTop: 8 }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#888", marginBottom: 8 }}>Bank Details</div>
              <div style={{ fontSize: 11, color: "#333", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.7 }}>
                {invoice.notes}
              </div>
            </div>
          )}

          {/* ── 7. Footer ── */}
          <div style={{ borderTop: "1px solid #eee", marginTop: 48, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {payName}
            </span>
            <span style={{ fontSize: 9, color: "#bbb", fontFamily: "monospace" }}>
              Invoice #{invoice.invoiceNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
