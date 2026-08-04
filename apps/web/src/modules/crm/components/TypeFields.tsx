/**
 * Shared extra-field sections rendered inside Contact/Lead modals
 * when contactType === "Broker" or "Carrier".
 */
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

const Section = ({ title }: { title: string }) => (
  <div className="col-span-2 border-t border-border pt-3">
    <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">{title}</p>
  </div>
);

// ─── Broker Fields ────────────────────────────────────────────────────────────

export interface BrokerTypeData {
  brokerType?: string;
  mcNumber?: string;
  usdotNumber?: string;
  lastContact?: string;
  coverage?: string;
  freightTypes?: string;
  selectedStates?: string;
  paymentTerms?: string;
  paymentDays?: string;
  quickPay?: boolean;
  quickPayFee?: string;
  factoringAccepted?: string;
  onboardingStatus?: string;
}

export const emptyBrokerTypeData = (): BrokerTypeData => ({
  brokerType: "", mcNumber: "", usdotNumber: "", lastContact: "",
  coverage: "", freightTypes: "", selectedStates: "",
  paymentTerms: "", paymentDays: "", quickPay: false, quickPayFee: "",
  factoringAccepted: "", onboardingStatus: "",
});

interface BrokerFieldsProps {
  data: BrokerTypeData;
  onChange: (d: BrokerTypeData) => void;
}

export function BrokerFields({ data, onChange }: BrokerFieldsProps) {
  const f = (k: keyof BrokerTypeData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...data, [k]: e.target.value });

  const sel = (k: keyof BrokerTypeData) => (v: string) =>
    onChange({ ...data, [k]: v === "__none__" ? "" : v });

  return (
    <>
      <Section title="Broker — Identifiers" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Broker Type</Label>
        <Select value={data.brokerType || "__none__"} onValueChange={sel("brokerType")}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            <SelectItem value="Freight Broker">Freight Broker</SelectItem>
            <SelectItem value="Freight Forwarder">Freight Forwarder</SelectItem>
            <SelectItem value="3PL">3PL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">MC Number</Label>
        <Input value={data.mcNumber ?? ""} onChange={f("mcNumber")} placeholder="MC-123456" />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">USDOT Number</Label>
        <Input value={data.usdotNumber ?? ""} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Last Contact</Label>
        <Input type="date" value={data.lastContact ?? ""} onChange={f("lastContact")} />
      </div>

      <Section title="Broker — Coverage" />

      <div className="col-span-2 flex flex-col gap-1">
        <Label className="font-mono text-xs">Coverage Area</Label>
        <Input value={data.coverage ?? ""} onChange={f("coverage")} placeholder="Nationwide, Midwest, Southeast..." />
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <Label className="font-mono text-xs">Freight Types <span className="text-muted-foreground">(comma-separated)</span></Label>
        <Input value={data.freightTypes ?? ""} onChange={f("freightTypes")} placeholder="Dry Van, Flatbed, Reefer..." />
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <Label className="font-mono text-xs">Selected States <span className="text-muted-foreground">(comma-separated)</span></Label>
        <Input value={data.selectedStates ?? ""} onChange={f("selectedStates")} placeholder="TX, FL, CA..." />
      </div>

      <Section title="Broker — Payment Terms" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Payment Terms</Label>
        <Select value={data.paymentTerms || "__none__"} onValueChange={sel("paymentTerms")}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            <SelectItem value="Net 15">Net 15</SelectItem>
            <SelectItem value="Net 30">Net 30</SelectItem>
            <SelectItem value="Net 45">Net 45</SelectItem>
            <SelectItem value="Net 60">Net 60</SelectItem>
            <SelectItem value="QuickPay">QuickPay</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Payment Days</Label>
        <Input type="number" min="0" value={data.paymentDays ?? ""} onChange={f("paymentDays")} placeholder="30" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">QuickPay Fee (%)</Label>
        <Input type="number" step="0.01" min="0" value={data.quickPayFee ?? ""} onChange={f("quickPayFee")} placeholder="2.5" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Factoring Accepted</Label>
        <Select value={data.factoringAccepted || "__none__"} onValueChange={sel("factoringAccepted")}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unknown</SelectItem>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="quickPayBrokerCRM"
          checked={data.quickPay ?? false}
          onChange={(e) => onChange({ ...data, quickPay: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="quickPayBrokerCRM" className="font-mono text-xs cursor-pointer">QuickPay Available</Label>
      </div>

      <Section title="Broker — Onboarding" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Onboarding Status</Label>
        <Select value={data.onboardingStatus || "__none__"} onValueChange={sel("onboardingStatus")}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

// ─── Carrier Fields ───────────────────────────────────────────────────────────

export type FleetEntry = {
  truck: { year: string; make: string; model: string; vin: string; color: string; plateNumber: string };
  trailer: { year: string; make: string; model: string; vin: string; color: string; plateNumber: string };
  driver: { name: string; phone: string; email: string };
};

export const emptyFleet = (): FleetEntry => ({
  truck: { year: "", make: "", model: "", vin: "", color: "", plateNumber: "" },
  trailer: { year: "", make: "", model: "", vin: "", color: "", plateNumber: "" },
  driver: { name: "", phone: "", email: "" },
});

export interface CarrierTypeData {
  carrierType?: string;
  mcNumber?: string;
  usdotNumber?: string;
  einNumber?: string;
  authorityStatus?: string;
  insuranceExpiration?: string;
  ratePerMile?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  factoringCompany?: string;
  factoringFee?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankAddress?: string;
  bankCity?: string;
  bankState?: string;
  bankZip?: string;
  zelleAccount?: string;
  cashAppAccount?: string;
  operatingStates?: string;
  lastLoadDate?: string;
  fleetData?: FleetEntry[];
}

export const emptyCarrierTypeData = (): CarrierTypeData => ({
  carrierType: "", mcNumber: "", usdotNumber: "", einNumber: "",
  authorityStatus: "", insuranceExpiration: "", ratePerMile: "",
  companyAddress: "", companyCity: "", companyState: "", companyZip: "",
  factoringCompany: "", factoringFee: "",
  bankName: "", accountHolder: "", accountNumber: "", routingNumber: "",
  bankAddress: "", bankCity: "", bankState: "", bankZip: "",
  zelleAccount: "", cashAppAccount: "",
  operatingStates: "", lastLoadDate: "", fleetData: [],
});

interface CarrierFieldsProps {
  data: CarrierTypeData;
  onChange: (d: CarrierTypeData) => void;
}

export function CarrierFields({ data, onChange }: CarrierFieldsProps) {
  const fleet = data.fleetData ?? [];

  const f = (k: keyof CarrierTypeData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...data, [k]: e.target.value });

  const sel = (k: keyof CarrierTypeData) => (v: string) =>
    onChange({ ...data, [k]: v === "__none__" ? "" : v });

  const updateFleet = (i: number, section: "truck" | "trailer" | "driver", field: string, value: string) => {
    const next = [...fleet];
    next[i] = { ...next[i], [section]: { ...next[i][section], [field]: value } };
    onChange({ ...data, fleetData: next });
  };

  return (
    <>
      <Section title="Carrier — Identifiers & Authority" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Carrier Type</Label>
        <Select value={data.carrierType || "__none__"} onValueChange={sel("carrierType")}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            <SelectItem value="Open Trailer">Open Trailer</SelectItem>
            <SelectItem value="Enclosed Trailer">Enclosed Trailer</SelectItem>
            <SelectItem value="Hotshot">Hotshot</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">MC Number</Label>
        <Input value={data.mcNumber ?? ""} onChange={f("mcNumber")} placeholder="MC-123456" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">USDOT Number</Label>
        <Input value={data.usdotNumber ?? ""} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">EIN Number</Label>
        <Input value={data.einNumber ?? ""} onChange={f("einNumber")} placeholder="12-3456789" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Authority Status</Label>
        <Select value={data.authorityStatus || "__none__"} onValueChange={sel("authorityStatus")}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unknown</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Insurance Expiration</Label>
        <Input type="date" value={data.insuranceExpiration ?? ""} onChange={f("insuranceExpiration")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Rate / Mile ($)</Label>
        <Input type="number" step="0.01" min="0" value={data.ratePerMile ?? ""} onChange={f("ratePerMile")} placeholder="0.00" />
      </div>

      <Section title="Carrier — Address" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Street Address</Label>
        <Input value={data.companyAddress ?? ""} onChange={f("companyAddress")} placeholder="123 Main St" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">City</Label>
        <Input value={data.companyCity ?? ""} onChange={f("companyCity")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">State</Label>
        <Input value={data.companyState ?? ""} onChange={f("companyState")} maxLength={2} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">ZIP</Label>
        <Input value={data.companyZip ?? ""} onChange={f("companyZip")} />
      </div>

      <Section title="Carrier — Fleet" />

      <div className="col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-muted-foreground">Each entry groups one truck, one trailer and one driver.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 font-mono text-[10px] gap-1"
            onClick={() => onChange({ ...data, fleetData: [...fleet, emptyFleet()] })}
          >
            <Plus className="w-3 h-3" /> Add Fleet
          </Button>
        </div>

        {fleet.map((entry, i) => (
          <div key={i} className="border border-border rounded p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Fleet #{i + 1}</span>
              <button type="button"
                onClick={() => onChange({ ...data, fleetData: fleet.filter((_, j) => j !== i) })}
                className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Truck */}
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Truck</p>
              <div className="grid grid-cols-3 gap-2">
                {(["year","make","model","vin","color","plateNumber"] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <Label className="font-mono text-xs capitalize">{field === "plateNumber" ? "Plate #" : field === "vin" ? "VIN" : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                    <Input value={(entry.truck as any)[field]} onChange={(e) => updateFleet(i, "truck", field, e.target.value)}
                      placeholder={field === "year" ? "2022" : field === "make" ? "Kenworth" : field === "model" ? "T680" : field === "vin" ? "1XKWD..." : field === "color" ? "White" : "ABC-1234"} />
                  </div>
                ))}
              </div>
            </div>

            {/* Trailer */}
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Trailer</p>
              <div className="grid grid-cols-3 gap-2">
                {(["year","make","model","vin","color","plateNumber"] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <Label className="font-mono text-xs capitalize">{field === "plateNumber" ? "Plate #" : field === "vin" ? "VIN" : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                    <Input value={(entry.trailer as any)[field]} onChange={(e) => updateFleet(i, "trailer", field, e.target.value)}
                      placeholder={field === "year" ? "2021" : field === "make" ? "Wabash" : field === "model" ? "National" : field === "vin" ? "1JJV5..." : field === "color" ? "White" : "TRL-5678"} />
                  </div>
                ))}
              </div>
            </div>

            {/* Driver */}
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest mb-2">Driver</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Name</Label>
                  <Input value={entry.driver.name} onChange={(e) => updateFleet(i, "driver", "name", e.target.value)} placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Phone</Label>
                  <Input value={entry.driver.phone} onChange={(e) => updateFleet(i, "driver", "phone", e.target.value)} placeholder="(555) 000-0000" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="font-mono text-xs">Email</Label>
                  <Input type="email" value={entry.driver.email} onChange={(e) => updateFleet(i, "driver", "email", e.target.value)} placeholder="driver@email.com" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {fleet.length === 0 && (
          <p className="font-mono text-[10px] text-muted-foreground italic">No fleet entries added.</p>
        )}
      </div>

      <Section title="Carrier — Payment" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Factoring Company</Label>
        <Input value={data.factoringCompany ?? ""} onChange={f("factoringCompany")} placeholder="Company name" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Factoring Fee (%)</Label>
        <Input type="number" step="0.01" min="0" value={data.factoringFee ?? ""} onChange={f("factoringFee")} placeholder="0.00" />
      </div>

      <Section title="Carrier — Banking" />

      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Bank Name</Label>
        <Input value={data.bankName ?? ""} onChange={f("bankName")} placeholder="Wells Fargo" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Account Holder</Label>
        <Input value={data.accountHolder ?? ""} onChange={f("accountHolder")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Account Number</Label>
        <Input value={data.accountNumber ?? ""} onChange={f("accountNumber")} placeholder="••••••••" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Routing Number</Label>
        <Input value={data.routingNumber ?? ""} onChange={f("routingNumber")} placeholder="123456789" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Bank Address</Label>
        <Input value={data.bankAddress ?? ""} onChange={f("bankAddress")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Bank City</Label>
        <Input value={data.bankCity ?? ""} onChange={f("bankCity")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Bank State</Label>
        <Input value={data.bankState ?? ""} onChange={f("bankState")} maxLength={2} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Bank ZIP</Label>
        <Input value={data.bankZip ?? ""} onChange={f("bankZip")} />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Zelle Account</Label>
        <Input value={data.zelleAccount ?? ""} onChange={f("zelleAccount")} placeholder="phone or email" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="font-mono text-xs">Cash App Account</Label>
        <Input value={data.cashAppAccount ?? ""} onChange={f("cashAppAccount")} placeholder="$cashtag" />
      </div>

      <Section title="Carrier — Operations" />

      <div className="col-span-2 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="font-mono text-xs">Operating States <span className="text-muted-foreground">(comma-separated)</span></Label>
          <Input value={data.operatingStates ?? ""} onChange={f("operatingStates")} placeholder="IL, TX, CA" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="font-mono text-xs">Last Load Date</Label>
          <Input type="date" value={data.lastLoadDate ?? ""} onChange={f("lastLoadDate")} />
        </div>
      </div>
    </>
  );
}

// ─── serializers ──────────────────────────────────────────────────────────────

export function serializeBrokerTypeData(d: BrokerTypeData): Record<string, any> {
  const splitArr = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
  return {
    brokerType: d.brokerType || undefined,
    mcNumber: d.mcNumber || undefined,
    usdotNumber: d.usdotNumber || undefined,
    lastContact: d.lastContact || undefined,
    coverage: d.coverage || undefined,
    freightTypes: d.freightTypes ? splitArr(d.freightTypes) : undefined,
    selectedStates: d.selectedStates ? splitArr(d.selectedStates) : undefined,
    paymentTerms: d.paymentTerms || undefined,
    paymentDays: d.paymentDays ? parseInt(d.paymentDays) : undefined,
    quickPay: d.quickPay,
    quickPayFee: d.quickPayFee ? parseFloat(d.quickPayFee) : undefined,
    factoringAccepted: d.factoringAccepted || undefined,
    onboardingStatus: d.onboardingStatus || undefined,
  };
}

export function serializeCarrierTypeData(d: CarrierTypeData): Record<string, any> {
  const splitArr = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
  return {
    carrierType: d.carrierType || undefined,
    mcNumber: d.mcNumber || undefined,
    usdotNumber: d.usdotNumber || undefined,
    einNumber: d.einNumber || undefined,
    authorityStatus: d.authorityStatus || undefined,
    insuranceExpiration: d.insuranceExpiration || undefined,
    ratePerMile: d.ratePerMile ? parseFloat(d.ratePerMile) : undefined,
    companyAddress: d.companyAddress || undefined,
    companyCity: d.companyCity || undefined,
    companyState: d.companyState || undefined,
    companyZip: d.companyZip || undefined,
    factoringCompany: d.factoringCompany || undefined,
    factoringFee: d.factoringFee ? parseFloat(d.factoringFee) : undefined,
    bankName: d.bankName || undefined,
    accountHolder: d.accountHolder || undefined,
    accountNumber: d.accountNumber || undefined,
    routingNumber: d.routingNumber || undefined,
    bankAddress: d.bankAddress || undefined,
    bankCity: d.bankCity || undefined,
    bankState: d.bankState || undefined,
    bankZip: d.bankZip || undefined,
    zelleAccount: d.zelleAccount || undefined,
    cashAppAccount: d.cashAppAccount || undefined,
    operatingStates: d.operatingStates ? splitArr(d.operatingStates) : undefined,
    lastLoadDate: d.lastLoadDate || undefined,
    fleetData: d.fleetData ?? [],
  };
}

export function deserializeBrokerTypeData(raw: any): BrokerTypeData {
  if (!raw) return emptyBrokerTypeData();
  return {
    brokerType: raw.brokerType ?? "",
    mcNumber: raw.mcNumber ?? "",
    usdotNumber: raw.usdotNumber ?? "",
    lastContact: raw.lastContact ?? "",
    coverage: raw.coverage ?? "",
    freightTypes: Array.isArray(raw.freightTypes) ? raw.freightTypes.join(", ") : (raw.freightTypes ?? ""),
    selectedStates: Array.isArray(raw.selectedStates) ? raw.selectedStates.join(", ") : (raw.selectedStates ?? ""),
    paymentTerms: raw.paymentTerms ?? "",
    paymentDays: raw.paymentDays?.toString() ?? "",
    quickPay: raw.quickPay ?? false,
    quickPayFee: raw.quickPayFee?.toString() ?? "",
    factoringAccepted: raw.factoringAccepted ?? "",
    onboardingStatus: raw.onboardingStatus ?? "",
  };
}

export function deserializeCarrierTypeData(raw: any): CarrierTypeData {
  if (!raw) return emptyCarrierTypeData();
  return {
    carrierType: raw.carrierType ?? "",
    mcNumber: raw.mcNumber ?? "",
    usdotNumber: raw.usdotNumber ?? "",
    einNumber: raw.einNumber ?? "",
    authorityStatus: raw.authorityStatus ?? "",
    insuranceExpiration: raw.insuranceExpiration ?? "",
    ratePerMile: raw.ratePerMile?.toString() ?? "",
    companyAddress: raw.companyAddress ?? "",
    companyCity: raw.companyCity ?? "",
    companyState: raw.companyState ?? "",
    companyZip: raw.companyZip ?? "",
    factoringCompany: raw.factoringCompany ?? "",
    factoringFee: raw.factoringFee?.toString() ?? "",
    bankName: raw.bankName ?? "",
    accountHolder: raw.accountHolder ?? "",
    accountNumber: raw.accountNumber ?? "",
    routingNumber: raw.routingNumber ?? "",
    bankAddress: raw.bankAddress ?? "",
    bankCity: raw.bankCity ?? "",
    bankState: raw.bankState ?? "",
    bankZip: raw.bankZip ?? "",
    zelleAccount: raw.zelleAccount ?? "",
    cashAppAccount: raw.cashAppAccount ?? "",
    operatingStates: Array.isArray(raw.operatingStates) ? raw.operatingStates.join(", ") : (raw.operatingStates ?? ""),
    lastLoadDate: raw.lastLoadDate ?? "",
    fleetData: raw.fleetData ?? [],
  };
}
