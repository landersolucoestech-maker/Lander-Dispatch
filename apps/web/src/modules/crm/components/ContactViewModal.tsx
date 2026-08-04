import { useState } from "react";
import type { CrmContact } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ContactFormModal } from "./ContactFormModal";
import { Pencil } from "lucide-react";
import { CONTACT_TYPE_CONFIG, type ContactType } from "../config/contactTypes";

interface Props {
  contact: CrmContact | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  if (display == null || display === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{String(display)}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="border-t border-border pt-3 mb-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
    </div>
  );
}

export function ContactViewModal({ contact, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  if (!contact) return null;

  const d = contact as any;
  const config = d.contactType ? CONTACT_TYPE_CONFIG[d.contactType as ContactType] : undefined;
  const isBroker = d.contactType === "Broker";
  const isCarrier = d.contactType === "Carrier";

  const hasAddress = d.streetAddress || d.city || d.state || d.zipCode;
  const hasServiceProfile = !isBroker && !isCarrier && config && (
    (config.showCoverageArea && d.coverageArea) ||
    (config.showBusinessHours && d.businessHours) ||
    (config.showEmergencyService && d.emergencyService) ||
    (config.showServices && d.services)
  );

  return (
    <>
      <Dialog open={!!contact && !editing} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{contact.companyName}</DialogTitle>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditing(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-2 space-y-0">

            {/* Identification */}
            <div className="grid grid-cols-2 gap-4 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={contact.status ?? "Active"} />
              </div>
              <Row label="Contact Type" value={d.contactType} />
              <Row label="Priority" value={d.priority} />
              <Row label="Rating" value={d.rating != null ? `${Number(d.rating).toFixed(1)} / 5.0` : undefined} />
            </div>

            {/* Primary Contact */}
            <SectionTitle title="Primary Contact" />
            <div className="grid grid-cols-2 gap-4 pb-3">
              <Row label="Contact Name" value={d.primaryContactName} />
              <Row label="Phone Number" value={d.primaryPhoneNumber} />
              <Row label="Phone Number 2" value={d.primaryPhoneNumber2} />
              <Row label="Email" value={d.email} />
              <Row label="Website" value={d.website} />
            </div>

            {/* Emergency Contact */}
            {(d.emergencyContactName || d.emergencyPhoneNumber) && (
              <>
                <SectionTitle title="Emergency Contact" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Emergency Contact" value={d.emergencyContactName} />
                  <Row label="Emergency Phone" value={d.emergencyPhoneNumber} />
                  <Row label="Emergency Phone 2" value={d.emergencyPhoneNumber2} />
                </div>
              </>
            )}

            {/* Address */}
            {hasAddress && (
              <>
                <SectionTitle title="Address" />
                <div className="pb-3 space-y-1">
                  {d.streetAddress && <p className="text-sm">{d.streetAddress}</p>}
                  <p className="text-sm">
                    {[d.city, d.state, d.zipCode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </>
            )}

            {/* Generic Service Profile */}
            {hasServiceProfile && (
              <>
                <SectionTitle title="Service Profile" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  {config?.showCoverageArea && <Row label="Coverage Area" value={d.coverageArea} />}
                  {config?.showBusinessHours && <Row label="Business Hours" value={d.businessHours} />}
                  {config?.showEmergencyService && <Row label="24/7 Emergency" value={d.emergencyService} />}
                  {config?.showServices && d.services && (
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Services Provided</span>
                      <p className="text-sm whitespace-pre-wrap">{d.services}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Broker-specific sections */}
            {isBroker && (
              <>
                <SectionTitle title="Broker — Identifiers" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Broker Type" value={d.brokerType} />
                  <Row label="MC Number" value={d.mcNumber} />
                  <Row label="USDOT Number" value={d.usdotNumber} />
                  <Row label="Onboarding Status" value={d.onboardingStatus} />
                </div>
                <SectionTitle title="Broker — Coverage" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Coverage" value={d.coverage} />
                  <Row label="Freight Types" value={Array.isArray(d.freightTypes) && d.freightTypes.length ? d.freightTypes.join(", ") : undefined} />
                  <Row label="Factoring Conditions" value={(d as any).factoringConditions} />
                  <Row label="Coverage States" value={Array.isArray(d.coverageStates) && d.coverageStates.length ? d.coverageStates.join(", ") : undefined} />
                </div>
                <SectionTitle title="Broker — Payment" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Payment Terms" value={d.paymentTerms} />
                  <Row label="Payment Days" value={d.paymentDays != null ? `${d.paymentDays} days` : undefined} />
                  <Row label="QuickPay" value={d.quickPay} />
                  <Row label="QuickPay Fee" value={d.quickPayFee != null ? `${d.quickPayFee}%` : undefined} />
                  <Row label="Factoring Accepted" value={d.factoringAccepted} />
                </div>
              </>
            )}

            {/* Carrier-specific sections */}
            {isCarrier && (
              <>
                <SectionTitle title="Carrier — Authority & Identity" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Carrier Type" value={d.carrierType} />
                  <Row label="MC Number" value={d.mcNumber} />
                  <Row label="USDOT Number" value={d.usdotNumber} />
                  <Row label="EIN Number" value={d.einNumber} />
                  <Row label="Authority Status" value={d.authorityStatus} />
                  <Row label="Insurance Expiration" value={d.insuranceExpiration ? String(d.insuranceExpiration).slice(0, 10) : undefined} />
                  <Row label="Rate / Mile" value={d.ratePerMile != null ? `$${Number(d.ratePerMile).toFixed(2)}` : undefined} />
                </div>

                {((d as any).companyAddress || (d as any).companyCity || (d as any).companyState || (d as any).companyZipCode) && (
                  <>
                    <SectionTitle title="Carrier — Company Address" />
                    <div className="pb-3 space-y-1">
                      {(d as any).companyAddress && <p className="text-sm">{(d as any).companyAddress}</p>}
                      <p className="text-sm">
                        {[(d as any).companyCity, (d as any).companyState, (d as any).companyZipCode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </>
                )}

                <SectionTitle title="Carrier — Operations" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Area of Operation" value={(d as any).areaOfOperation} />
                  <Row label="Weekly Minimum" value={(d as any).weeklyMinimumAmount != null ? `$${Number((d as any).weeklyMinimumAmount).toFixed(2)}` : undefined} />
                  <Row label="Trips / Week" value={(d as any).totalTripsPerWeek != null ? String((d as any).totalTripsPerWeek) : undefined} />
                  <Row label="Last Load" value={(d as any).lastLoad ? String((d as any).lastLoad).slice(0, 10) : undefined} />
                  {Array.isArray((d as any).serviceTypes) && (d as any).serviceTypes.length > 0 && (
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Service Types</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(d as any).serviceTypes.map((s: string) => (
                          <span key={s} className="text-xs border border-border px-2 py-0.5 bg-muted">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {d.operatingStates && d.operatingStates.length > 0 && (
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Operating States</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {d.operatingStates.map((s: string) => (
                          <span key={s} className="text-xs border border-border px-2 py-0.5 bg-muted">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <SectionTitle title="Carrier — Payment" />
                <div className="grid grid-cols-2 gap-4 pb-3">
                  <Row label="Factoring Company" value={d.factoringCompany} />
                  <Row label="Factoring Fee" value={d.factoringFee != null ? `${d.factoringFee}%` : undefined} />
                  <Row label="Bank Name" value={d.bankName} />
                  <Row label="Account Holder" value={d.accountHolder} />
                  <Row label="Bank City / State" value={[d.bankCity, d.bankState].filter(Boolean).join(", ")} />
                  <Row label="Zelle" value={d.zelleAccount} />
                  <Row label="Cash App" value={d.cashAppAccount} />
                </div>
              </>
            )}

            {/* Internal */}
            {d.lastContact && (
              <>
                <SectionTitle title="Internal" />
                <div className="pb-3">
                  <Row label="Last Contact" value={typeof d.lastContact === "string" ? d.lastContact.slice(0, 10) : String(d.lastContact).slice(0, 10)} />
                </div>
              </>
            )}

            {/* Tags */}
            {d.tags && d.tags.length > 0 && (
              <>
                <SectionTitle title="Tags" />
                <div className="pb-3 flex flex-wrap gap-1">
                  {d.tags.map((tag: string) => (
                    <span key={tag} className="text-xs border border-border px-2 py-0.5 rounded bg-muted">{tag}</span>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {d.notes && (
              <>
                <SectionTitle title="Notes" />
                <p className="text-sm whitespace-pre-wrap pb-3">{d.notes}</p>
              </>
            )}

          </div>
        </DialogContent>
      </Dialog>

      <ContactFormModal
        open={editing}
        onClose={() => { setEditing(false); onClose(); }}
        initialData={contact}
      />
    </>
  );
}
