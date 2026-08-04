/**
 * BrokerLeadFields — lightweight prospecton fields for a Lead of type Broker.
 * This is NOT the same as BrokerFields in TypeFields.tsx (which is for Contacts).
 * Does NOT include payment terms, QuickPay, factoring, onboarding, or banking data.
 */
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export interface BrokerLeadData {
  brokerType: string;
  mcNumber: string;
  usdotNumber: string;
  coverage: string;
  freightTypes: string;
  selectedStates: string;
}

export const emptyBrokerLeadData = (): BrokerLeadData => ({
  brokerType: "", mcNumber: "", usdotNumber: "",
  coverage: "", freightTypes: "", selectedStates: "",
});

interface Props {
  data: BrokerLeadData;
  onChange: (d: BrokerLeadData) => void;
}

export function BrokerLeadFields({ data, onChange }: Props) {
  const f = (k: keyof BrokerLeadData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...data, [k]: e.target.value });

  return (
    <section>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Broker — Prospecton Details</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Broker Type</Label>
          <Select
            value={data.brokerType || "__none__"}
            onValueChange={(v) => onChange({ ...data, brokerType: v === "__none__" ? "" : v })}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              <SelectItem value="Auto Transport Broker">Auto Transport Broker</SelectItem>
              <SelectItem value="Freight Broker">Freight Broker</SelectItem>
              <SelectItem value="Logistics Company">Logistics Company</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>MC Number</Label>
          <Input value={data.mcNumber} onChange={f("mcNumber")} placeholder="MC-123456" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>USDOT Number</Label>
          <Input value={data.usdotNumber} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Coverage Area</Label>
          <Input value={data.coverage} onChange={f("coverage")} placeholder="Nationwide, Southeast…" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label>Freight Types <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
          <Input value={data.freightTypes} onChange={f("freightTypes")} placeholder="Dry Van, Flatbed, Reefer…" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label>Selected States <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
          <Input value={data.selectedStates} onChange={f("selectedStates")} placeholder="TX, FL, CA…" />
        </div>
      </div>
    </section>
  );
}
