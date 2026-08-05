import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCompanyProfile,
  useUpdateCompanyProfile,
} from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  MapPin,
  Phone,
  Save,
  Shield,
} from "lucide-react";

type FormState = {
  companyName: string;
  legalCompanyName: string;
  dbaName: string;
  einNumber: string;
  mcNumber: string;
  usdotNumber: string;
  companyPhone: string;
  companyEmail: string;
  website: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  businessHours: string;
};

const EMPTY_FORM: FormState = {
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
};

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3 border-b border-border pb-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function profileToForm(profile: ReturnType<typeof useGetCompanyProfile>["data"]): FormState {
  if (!profile) return EMPTY_FORM;

  return {
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
  };
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const profileQuery = useGetCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(profileToForm(profileQuery.data));
  }, [profileQuery.data]);

  const persistedForm = useMemo(
    () => profileToForm(profileQuery.data),
    [profileQuery.data],
  );
  const hasChanges = JSON.stringify(form) !== JSON.stringify(persistedForm);
  const emailIsValid = !form.companyEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail);
  const canSave =
    Boolean(form.companyName.trim()) &&
    emailIsValid &&
    hasChanges &&
    !updateMutation.isPending;

  const updateForm = (field: keyof FormState, value: string) => {
    setSaved(false);
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSave = () => {
    if (!canSave) return;

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim() || undefined]),
    );

    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
          setSaved(true);
        },
      },
    );
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading company configuration…
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md border border-destructive/40 bg-card p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
          <p className="mt-3 font-semibold">Company configuration could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm the API and database are available, then retry.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void profileQuery.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SETTINGS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company profile used in invoices, documents and operational communication.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {saved ? (
            <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Changes saved
            </span>
          ) : hasChanges ? (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          ) : null}
          <Button className="gap-2" onClick={handleSave} disabled={!canSave}>
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </header>

      {updateMutation.isError ? (
        <div className="flex items-start gap-3 border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Changes were not saved.</p>
            <p className="mt-1 text-muted-foreground">
              Review the fields and confirm the API is available before trying again.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          icon={Building2}
          title="Company Identity"
          description="Public and legal names displayed throughout the system."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company Name *" className="md:col-span-2">
              <Input
                required
                value={form.companyName}
                onChange={(event) => updateForm("companyName", event.target.value)}
                placeholder="Lander Dispatch"
              />
            </Field>
            <Field label="Legal Company Name">
              <Input
                value={form.legalCompanyName}
                onChange={(event) => updateForm("legalCompanyName", event.target.value)}
              />
            </Field>
            <Field label="DBA Name">
              <Input
                value={form.dbaName}
                onChange={(event) => updateForm("dbaName", event.target.value)}
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(event) => updateForm("website", event.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="Business Hours">
              <Input
                value={form.businessHours}
                onChange={(event) => updateForm("businessHours", event.target.value)}
                placeholder="Mon–Fri 8:00 AM–6:00 PM"
              />
            </Field>
          </div>
        </Section>

        <Section
          icon={Shield}
          title="Regulatory Identifiers"
          description="Identifiers that may appear in invoices and official documents."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="EIN Number">
              <Input
                value={form.einNumber}
                onChange={(event) => updateForm("einNumber", event.target.value)}
              />
            </Field>
            <Field label="MC Number">
              <Input
                value={form.mcNumber}
                onChange={(event) => updateForm("mcNumber", event.target.value)}
              />
            </Field>
            <Field label="USDOT Number">
              <Input
                value={form.usdotNumber}
                onChange={(event) => updateForm("usdotNumber", event.target.value)}
              />
            </Field>
          </div>
          <div className="border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
            Verify regulatory identifiers before using documents generated by the system.
          </div>
        </Section>

        <Section icon={Phone} title="Contact Information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company Phone">
              <Input
                value={form.companyPhone}
                onChange={(event) => updateForm("companyPhone", event.target.value)}
              />
            </Field>
            <Field label="Company Email">
              <Input
                type="email"
                value={form.companyEmail}
                onChange={(event) => updateForm("companyEmail", event.target.value)}
                aria-invalid={!emailIsValid}
              />
              {!emailIsValid ? (
                <p className="text-xs text-destructive">Enter a valid email address.</p>
              ) : null}
            </Field>
          </div>
        </Section>

        <Section icon={MapPin} title="Company Address">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Street Address" className="md:col-span-2 xl:col-span-4">
              <Input
                value={form.streetAddress}
                onChange={(event) => updateForm("streetAddress", event.target.value)}
              />
            </Field>
            <Field label="City" className="md:col-span-2 xl:col-span-1">
              <Input value={form.city} onChange={(event) => updateForm("city", event.target.value)} />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(event) => updateForm("state", event.target.value.toUpperCase())}
                maxLength={2}
              />
            </Field>
            <Field label="ZIP Code">
              <Input
                value={form.zipCode}
                onChange={(event) => updateForm("zipCode", event.target.value)}
              />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(event) => updateForm("country", event.target.value)}
              />
            </Field>
          </div>
        </Section>
      </div>
    </div>
  );
}
