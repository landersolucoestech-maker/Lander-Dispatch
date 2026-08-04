import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Upload, Download, AlertCircle, CheckCircle2, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  inserted: number;
  errors: { row: number; error: string }[];
}

const REQUIRED_HEADERS = ["status", "dispatchDate", "pickupCity", "pickupState", "deliveryCity", "deliveryState"];
const ALL_HEADERS = [
  "status",
  "dispatchDate",
  "carrierName",
  "brokerName",
  "pickupCity",
  "pickupState",
  "pickupZip",
  "pickupEstimated",
  "pickupDeadline",
  "deliveryCity",
  "deliveryState",
  "deliveryZip",
  "deliveryEstimated",
  "deliveryDeadline",
  "miles",
  "rate",
  "paymentMethod",
  "dispatchInstructions",
  "pickupInstructions",
  "deliveryInstructions",
];

const SAMPLE_CSV = [
  ALL_HEADERS.join(","),
  "New,2026-07-24,ACME Trucking LLC,XYZ Logistics,Chicago,IL,60601,,,,Dallas,TX,75201,,,1200,2400,Check,,,",
  "Dispatched,2026-07-25,Fast Wheels LLC,,Memphis,TN,38103,,,,Atlanta,GA,30301,,,850,1700,ACH,,,",
].join("\n");

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function rowToPayload(row: ParsedRow) {
  const n = (k: string) => (row[k] ? parseFloat(row[k]) : undefined);
  const s = (k: string) => row[k] || undefined;
  return {
    status: s("status"),
    dispatchDate: s("dispatchDate"),
    carrierName: s("carrierName"),
    brokerName: s("brokerName"),
    pickupCity: s("pickupCity"),
    pickupState: s("pickupState"),
    pickupZip: s("pickupZip"),
    pickupEstimated: s("pickupEstimated"),
    pickupDeadline: s("pickupDeadline"),
    deliveryCity: s("deliveryCity"),
    deliveryState: s("deliveryState"),
    deliveryZip: s("deliveryZip"),
    deliveryEstimated: s("deliveryEstimated"),
    deliveryDeadline: s("deliveryDeadline"),
    miles: n("miles"),
    rate: n("rate"),
    paymentMethod: s("paymentMethod"),
    dispatchInstructions: s("dispatchInstructions"),
    pickupInstructions: s("pickupInstructions"),
    deliveryInstructions: s("deliveryInstructions"),
  };
}

export function LoadImportModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setStep("upload");
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setParseError("Only .csv files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (!headers.length) { setParseError("Could not parse CSV — file appears empty."); return; }
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
      if (missing.length) {
        setParseError(`Missing required columns: ${missing.join(", ")}`);
        return;
      }
      if (rows.length === 0) { setParseError("CSV has headers but no data rows."); return; }
      if (rows.length > 500) { setParseError("Max 500 rows per import."); return; }
      setParseError(null);
      setParsedRows(rows);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const payload = parsedRows.map(rowToPayload);
      const res = await fetch("/api/loads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data: ImportResult = await res.json();
      setResult(data);
      setStep("result");
      qc.invalidateQueries({ queryKey: ["loads"] });
    } catch {
      setResult({ inserted: 0, errors: [{ row: 0, error: "Network error — could not reach server." }] });
      setStep("result");
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "loads_import_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-widest text-sm">
            Import Loads — CSV
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div className="mt-4 space-y-4">
            <div className="border border-dashed border-border p-8 flex flex-col items-center gap-3 text-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-mono text-sm">Upload a CSV file to import loads</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">Max 500 rows per import</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="font-mono text-xs gap-2">
                <Upload className="w-3 h-3" /> Choose CSV File
              </Button>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 border border-destructive bg-destructive/5 p-3 text-sm font-mono text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {parseError}
              </div>
            )}

            <div className="border border-border p-4 space-y-2">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">CSV Format</p>
              <p className="font-mono text-xs text-muted-foreground">
                Required columns: <span className="text-foreground">{REQUIRED_HEADERS.join(", ")}</span>
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Optional: carrierName, brokerName, miles, rate, paymentMethod, pickupZip, deliveryZip, pickupEstimated, pickupDeadline, deliveryEstimated, deliveryDeadline, dispatchInstructions, pickupInstructions, deliveryInstructions
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Carrier/broker matched by company name (case-insensitive). Unmatched names are skipped (load still created, just unlinked).
              </p>
              <Button variant="ghost" size="sm" className="font-mono text-xs gap-1 mt-1" onClick={downloadSample}>
                <Download className="w-3 h-3" /> Download Sample CSV
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === "preview" && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 border border-border bg-card p-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <p className="font-mono text-sm">
                <span className="font-bold">{parsedRows.length}</span> load{parsedRows.length !== 1 ? "s" : ""} ready to import
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto border border-border">
              <table className="w-full text-[11px] font-mono">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="p-2 text-left text-muted-foreground">#</th>
                    <th className="p-2 text-left text-muted-foreground">Status</th>
                    <th className="p-2 text-left text-muted-foreground">Carrier</th>
                    <th className="p-2 text-left text-muted-foreground">Pickup</th>
                    <th className="p-2 text-left text-muted-foreground">Delivery</th>
                    <th className="p-2 text-right text-muted-foreground">Rate</th>
                    <th className="p-2 text-right text-muted-foreground">Miles</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{row.status || "—"}</td>
                      <td className="p-2 truncate max-w-[100px]">{row.carrierName || "—"}</td>
                      <td className="p-2">{[row.pickupCity, row.pickupState].filter(Boolean).join(", ") || "—"}</td>
                      <td className="p-2">{[row.deliveryCity, row.deliveryState].filter(Boolean).join(", ") || "—"}</td>
                      <td className="p-2 text-right">{row.rate ? `$${parseFloat(row.rate).toFixed(2)}` : "—"}</td>
                      <td className="p-2 text-right">{row.miles || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" className="font-mono text-xs gap-1" onClick={() => { reset(); }}>
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button className="font-mono text-xs gap-2" disabled={importing} onClick={handleImport}>
                {importing ? (
                  <span className="animate-pulse">IMPORTING...</span>
                ) : (
                  <><Upload className="w-3 h-3" /> Import {parsedRows.length} Load{parsedRows.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: RESULT ── */}
        {step === "result" && result && (
          <div className="mt-4 space-y-4">
            <div className={`flex items-center gap-2 border p-3 ${result.errors.length === 0 ? "border-green-500 bg-green-500/5" : "border-yellow-500 bg-yellow-500/5"}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${result.errors.length === 0 ? "text-green-500" : "text-yellow-500"}`} />
              <p className="font-mono text-sm">
                <span className="font-bold">{result.inserted}</span> load{result.inserted !== 1 ? "s" : ""} imported successfully
                {result.errors.length > 0 && (
                  <span className="text-destructive"> · {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}</span>
                )}
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Errors</p>
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono text-destructive border border-destructive/20 bg-destructive/5 p-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Row {err.row}: {err.error}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="font-mono text-xs" onClick={() => { reset(); }}>
                Import More
              </Button>
              <Button className="font-mono text-xs" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
