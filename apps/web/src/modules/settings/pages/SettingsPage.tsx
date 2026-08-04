import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCompanyProfile, useUpdateCompanyProfile } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Building2, MapPin, Phone, Shield, Save } from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="font-mono text-xs text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useGetCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();

  const [form, setForm] = useState({
    companyName: "",
    legalCompanyName: "",
    dbaName: "",
    einNumber: "",
    mcNumber: "",
    usdotNumber: "",
    companyPhone: "",
    companyEmail: "",
    website: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    businessHours: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName ?? "",
        legalCompanyName: profile.legalCompanyName ?? "",
        dbaName: profile.dbaName ?? "",
        einNumber: profile.einNumber ?? "",
        mcNumber: profile.mcNumber ?? "",
        usdotNumber: profile.usdotNumber ?? "",
        companyPhone: profile.companyPhone ?? "",
        companyEmail: profile.companyEmail ?? "",
        website: profile.website ?? "",
        streetAddress: profile.streetAddress ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        zipCode: profile.zipCode ?? "",
        country: profile.country ?? "",
        businessHours: profile.businessHours ?? "",
      });
    }
  }, [profile]);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v || undefined])
    );
    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["companyProfile"] });
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-sm text-muted-foreground">LOADING.CONFIG...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Settings</h1>
          <p className="text-sm font-mono text-muted-foreground">Company Profile & Configuration</p>
        </div>
        <Button
          className="gap-2"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity */}
        <Section icon={Building2} title="Company Identity">
          <Field label="Company Name (Display)">
            <Input value={form.companyName} onChange={f("companyName")} placeholder="Lander Dispatch LLC" />
          </Field>
          <Field label="Legal Company Name">
            <Input value={form.legalCompanyName} onChange={f("legalCompanyName")} placeholder="Full legal name" />
          </Field>
          <Field label="DBA Name">
            <Input value={form.dbaName} onChange={f("dbaName")} placeholder="Doing Business As..." />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={f("website")} placeholder="https://..." />
          </Field>
          <Field label="Business Hours">
            <Input value={form.businessHours} onChange={f("businessHours")} placeholder="Mon–Fri 8am–6pm CT" />
          </Field>
        </Section>

        {/* Regulatory IDs */}
        <Section icon={Shield} title="Regulatory Identifiers">
          <Field label="EIN Number">
            <Input value={form.einNumber} onChange={f("einNumber")} placeholder="12-3456789" />
          </Field>
          <Field label="MC Number">
            <Input value={form.mcNumber} onChange={f("mcNumber")} placeholder="MC-123456" />
          </Field>
          <Field label="USDOT Number">
            <Input value={form.usdotNumber} onChange={f("usdotNumber")} placeholder="DOT-1234567" />
          </Field>
          <div className="p-3 border border-border bg-muted/30 font-mono text-[10px] text-muted-foreground leading-relaxed mt-2">
            THESE IDENTIFIERS APPEAR ON INVOICES AND OFFICIAL DOCUMENTS.
            VERIFY WITH FMCSA BEFORE SAVING.
          </div>
        </Section>

        {/* Contact */}
        <Section icon={Phone} title="Contact Information">
          <Field label="Company Phone">
            <Input value={form.companyPhone} onChange={f("companyPhone")} placeholder="(555) 555-5555" />
          </Field>
          <Field label="Company Email">
            <Input type="email" value={form.companyEmail} onChange={f("companyEmail")} placeholder="ops@company.com" />
          </Field>
        </Section>

        {/* Address */}
        <Section icon={MapPin} title="Company Address">
          <Field label="Street Address">
            <Input value={form.streetAddress} onChange={f("streetAddress")} placeholder="123 Main St" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 flex flex-col gap-1">
              <Label className="font-mono text-xs text-muted-foreground uppercase">City</Label>
              <Input value={form.city} onChange={f("city")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-xs text-muted-foreground uppercase">State</Label>
              <Input value={form.state} onChange={f("state")} maxLength={2} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-xs text-muted-foreground uppercase">ZIP</Label>
              <Input value={form.zipCode} onChange={f("zipCode")} />
            </div>
          </div>
          <Field label="Country">
            <Input value={form.country} onChange={f("country")} placeholder="US" />
          </Field>
        </Section>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button
          className="gap-2 min-w-36"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
