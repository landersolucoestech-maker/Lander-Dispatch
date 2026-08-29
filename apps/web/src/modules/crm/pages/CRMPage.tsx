import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  getListCrmContactsQueryKey,
  getListCrmLeadsQueryKey,
  useDeleteCrmContact,
  useDeleteCrmLead,
  useListBrokers,
  useListCarriers,
  useListCrmContacts,
  useListCrmLeads,
} from "@workspace/api-client-react";
import type { Broker, Carrier, CrmContact, CrmLead } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Building2, ContactRound, MoreHorizontal, Plus, Search } from "lucide-react";
import { ContactFormModal } from "../components/ContactFormModal";
import { ContactViewModal } from "../components/ContactViewModal";
import { DirectContactFormModal } from "../components/DirectContactFormModal";
import { DriverFormModal } from "../components/DriverFormModal";
import { LeadFormModal } from "../components/LeadFormModal";
import { LeadViewModal } from "../components/LeadViewModal";
import { useDeleteDriver, useListDrivers, type Driver } from "../hooks/useDrivers";

type Tab = "contacts" | "leads";
type ContactSource = "crm" | "carrier" | "broker" | "driver";

type LeadWithDetails = CrmLead & {
  leadType?: string | null;
  nextFollowUpDate?: string | null;
};

interface UnifiedContact {
  id: string;
  companyName: string;
  contactType: string;
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  source: ContactSource;
  raw: CrmContact | Carrier | Broker | Driver;
}

const CONTACT_PAGE_SIZE = 50;
const LEAD_PAGE_SIZE = 50;

function sourceLabel(source: ContactSource) {
  if (source === "crm") return "CRM Contact";
  if (source === "carrier") return "Carrier Module";
  if (source === "broker") return "Broker Module";
  return "Driver";
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {count != null ? (
        <span className="min-w-6 border border-border bg-muted/30 px-1.5 py-0.5 text-center text-[10px]">{count}</span>
      ) : null}
    </button>
  );
}

function Pagination({ page, totalPages, total, label, onChange }: { page: number; totalPages: number; total: number; label: string; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} {label}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

function RowActions({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        {onDelete ? <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>Delete</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CRMPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("contacts");

  const [contactSearch, setContactSearch] = useState("");
  const [contactType, setContactType] = useState("all");
  const [contactStatus, setContactStatus] = useState("all");
  const [contactPage, setContactPage] = useState(1);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [viewContact, setViewContact] = useState<CrmContact | null>(null);
  const [editContact, setEditContact] = useState<CrmContact | null>(null);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("all");
  const [leadPage, setLeadPage] = useState(1);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [viewLead, setViewLead] = useState<CrmLead | null>(null);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);

  const contactsQuery = useListCrmContacts(
    { search: contactSearch || undefined, page: 1, pageSize: 200 },
    { query: { queryKey: ["crm", "contacts", contactSearch] } },
  );
  const carriersQuery = useListCarriers(
    { search: contactSearch || undefined, page: 1, pageSize: 200 },
    { query: { queryKey: ["crm", "carrier-contacts", contactSearch] } },
  );
  const brokersQuery = useListBrokers(
    { search: contactSearch || undefined, page: 1, pageSize: 200 },
    { query: { queryKey: ["crm", "broker-contacts", contactSearch] } },
  );
  const driversQuery = useListDrivers({ search: contactSearch || undefined, page: 1, pageSize: 200 });
  const leadsQuery = useListCrmLeads(
    {
      search: leadSearch || undefined,
      status: leadStatus === "all" ? undefined : leadStatus,
      page: leadPage,
      pageSize: LEAD_PAGE_SIZE,
    },
    { query: { queryKey: ["crm", "leads", leadSearch, leadStatus, leadPage] } },
  );

  const deleteContact = useDeleteCrmContact({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCrmContactsQueryKey() }) },
  });
  const deleteLead = useDeleteCrmLead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCrmLeadsQueryKey() }) },
  });
  const deleteDriver = useDeleteDriver();

  const unifiedContacts = useMemo<UnifiedContact[]>(() => {
    const crm = (contactsQuery.data?.data ?? []).map<UnifiedContact>((contact) => ({
      id: contact.id,
      companyName: contact.companyName,
      contactType: contact.contactType || "Contact",
      primaryContact: contact.primaryContactName || contact.primaryContact || null,
      phone: contact.primaryPhoneNumber || contact.phone || null,
      email: contact.email ?? null,
      status: contact.status,
      source: "crm",
      raw: contact,
    }));

    const carriers = (carriersQuery.data?.data ?? []).map<UnifiedContact>((carrier) => ({
      id: carrier.id,
      companyName: carrier.companyName,
      contactType: "Carrier",
      primaryContact: carrier.primaryContact ?? null,
      phone: carrier.phone ?? null,
      email: carrier.email ?? null,
      status: carrier.status,
      source: "carrier",
      raw: carrier,
    }));

    const brokers = (brokersQuery.data?.data ?? []).map<UnifiedContact>((broker) => ({
      id: broker.id,
      companyName: broker.companyName,
      contactType: "Broker",
      primaryContact: broker.primaryContact ?? null,
      phone: broker.phone ?? null,
      email: broker.email ?? null,
      status: broker.status,
      source: "broker",
      raw: broker,
    }));

    const drivers = (driversQuery.data?.data ?? []).map<UnifiedContact>((driver) => ({
      id: driver.id,
      companyName: driver.fullName,
      contactType: "Driver",
      primaryContact: driver.fullName,
      phone: driver.phoneNumber || null,
      email: driver.email || null,
      status: driver.status,
      source: "driver",
      raw: driver,
    }));

    return [...crm, ...carriers, ...brokers, ...drivers]
      .filter((contact) => contactType === "all" || contact.contactType === contactType)
      .filter((contact) => contactStatus === "all" || contact.status === contactStatus)
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [contactsQuery.data, carriersQuery.data, brokersQuery.data, driversQuery.data, contactType, contactStatus]);

  const contactTotalPages = Math.max(1, Math.ceil(unifiedContacts.length / CONTACT_PAGE_SIZE));
  const visibleContacts = unifiedContacts.slice((contactPage - 1) * CONTACT_PAGE_SIZE, contactPage * CONTACT_PAGE_SIZE);
  const leads = leadsQuery.data?.data ?? [];

  const contactLoading = contactsQuery.isLoading || carriersQuery.isLoading || brokersQuery.isLoading || driversQuery.isLoading;
  const contactError = contactsQuery.isError || carriersQuery.isError || brokersQuery.isError || driversQuery.isError;

  const openContact = (contact: UnifiedContact) => {
    if (contact.source === "carrier") return navigate(`/carriers/${contact.id}`);
    if (contact.source === "broker") return navigate(`/brokers/${contact.id}`);
    if (contact.source === "driver") return setEditDriver(contact.raw as Driver);
    setViewContact(contact.raw as CrmContact);
  };

  const editUnifiedContact = (contact: UnifiedContact) => {
    if (contact.source === "carrier") return navigate(`/carriers/${contact.id}`);
    if (contact.source === "broker") return navigate(`/brokers/${contact.id}`);
    if (contact.source === "driver") return setEditDriver(contact.raw as Driver);
    setEditContact(contact.raw as CrmContact);
  };

  const removeUnifiedContact = (contact: UnifiedContact) => {
    if (contact.source === "crm") {
      if (window.confirm(`Delete CRM contact ${contact.companyName}?`)) deleteContact.mutate({ contactId: contact.id });
      return;
    }
    if (contact.source === "driver") {
      if (window.confirm(`Delete driver ${contact.companyName}?`)) deleteDriver.mutate(contact.id);
    }
  };

  const createCurrent = () => {
    if (tab === "contacts") setCreateContactOpen(true);
    else setCreateLeadOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Contacts and demand prospects.</p>
        </div>
        <Button className="gap-2" onClick={createCurrent}>
          <Plus className="h-4 w-4" />
          {tab === "contacts" ? "Create Contact" : "Create Lead"}
        </Button>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        <TabButton active={tab === "contacts"} label="Contacts" count={unifiedContacts.length} onClick={() => setTab("contacts")} />
        <TabButton active={tab === "leads"} label="Leads" count={leadsQuery.data?.meta.total} onClick={() => setTab("leads")} />
      </div>

      {tab === "contacts" ? (
        <>
          <section className="flex flex-col gap-3 border border-border bg-card p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search company, contact, phone or driver"
                value={contactSearch}
                onChange={(event) => { setContactSearch(event.target.value); setContactPage(1); }}
              />
            </div>
            <Select value={contactType} onValueChange={(value) => { setContactType(value); setContactPage(1); }}>
              <SelectTrigger className="w-full lg:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contact types</SelectItem>
                <SelectItem value="Carrier">Carrier</SelectItem>
                <SelectItem value="Broker">Broker</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
                <SelectItem value="Direct Customer">Direct Customer</SelectItem>
                <SelectItem value="Dealer">Dealer</SelectItem>
                <SelectItem value="Shipper">Shipper</SelectItem>
                <SelectItem value="Auction">Auction</SelectItem>
                <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                <SelectItem value="Fleet / Rental Company">Fleet / Rental Company</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contactStatus} onValueChange={(value) => { setContactStatus(value); setContactPage(1); }}>
              <SelectTrigger className="w-full lg:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {contactError ? (
            <div className="border border-destructive/40 bg-card p-10 text-center">
              <p className="font-semibold">Contacts could not be loaded.</p>
              <Button className="mt-4" variant="outline" onClick={() => {
                void contactsQuery.refetch(); void carriersQuery.refetch(); void brokersQuery.refetch(); void driversQuery.refetch();
              }}>Retry</Button>
            </div>
          ) : contactLoading ? (
            <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading contacts…</div>
          ) : visibleContacts.length === 0 ? (
            <div className="border border-dashed border-border bg-card p-12 text-center">
              <ContactRound className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-semibold">No contacts found.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company / Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Primary Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleContacts.map((contact) => (
                    <TableRow key={`${contact.source}:${contact.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => openContact(contact)}>
                      <TableCell className="font-medium">{contact.companyName}</TableCell>
                      <TableCell className="text-xs">{contact.contactType}</TableCell>
                      <TableCell className="text-xs">{contact.primaryContact || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{contact.phone || "—"}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{contact.email || "—"}</TableCell>
                      <TableCell><StatusBadge status={contact.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{sourceLabel(contact.source)}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <RowActions
                          onView={() => openContact(contact)}
                          onEdit={() => editUnifiedContact(contact)}
                          onDelete={contact.source === "crm" || contact.source === "driver" ? () => removeUnifiedContact(contact) : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination page={contactPage} totalPages={contactTotalPages} total={unifiedContacts.length} label="contacts" onChange={setContactPage} />
        </>
      ) : null}

      {tab === "leads" ? (
        <>
          <section className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search company or contact" value={leadSearch} onChange={(event) => { setLeadSearch(event.target.value); setLeadPage(1); }} />
            </div>
            <Select value={leadStatus} onValueChange={(value) => { setLeadStatus(value); setLeadPage(1); }}>
              <SelectTrigger className="w-full md:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pipeline stages</SelectItem>
                <SelectItem value="New Lead">New Lead</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {leadsQuery.isLoading ? (
            <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading leads…</div>
          ) : leadsQuery.isError ? (
            <div className="border border-destructive/40 bg-card p-10 text-center"><p className="font-semibold">Leads could not be loaded.</p></div>
          ) : leads.length === 0 ? (
            <div className="border border-dashed border-border bg-card p-12 text-center">
              <Building2 className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 font-semibold">No leads found.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead><TableHead>Lead Type</TableHead><TableHead>Contact</TableHead><TableHead>Pipeline Stage</TableHead><TableHead className="text-right">Est. Weekly Revenue</TableHead><TableHead>Next Follow-Up</TableHead><TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const details = lead as LeadWithDetails;
                    return (
                      <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewLead(lead)}>
                        <TableCell className="font-medium">{lead.companyName}</TableCell>
                        <TableCell className="text-xs">{details.leadType || "Other"}</TableCell>
                        <TableCell className="text-xs">{lead.primaryContact || "—"}</TableCell>
                        <TableCell><StatusBadge status={lead.pipelineStage} /></TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">{formatCurrency(lead.estimatedWeeklyRevenue)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(details.nextFollowUpDate || lead.nextFollowUp)}</TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <RowActions
                            onView={() => setViewLead(lead)}
                            onEdit={() => setEditLead(lead)}
                            onDelete={() => { if (window.confirm(`Delete lead ${lead.companyName}?`)) deleteLead.mutate({ leadId: lead.id }); }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination page={leadsQuery.data?.meta.page ?? leadPage} totalPages={leadsQuery.data?.meta.totalPages ?? 1} total={leadsQuery.data?.meta.total ?? 0} label="leads" onChange={setLeadPage} />
        </>
      ) : null}

      <DirectContactFormModal open={createContactOpen} onClose={() => setCreateContactOpen(false)} />
      <ContactFormModal open={Boolean(editContact)} onClose={() => setEditContact(null)} initialData={editContact ?? undefined} />
      <ContactViewModal contact={viewContact} onClose={() => setViewContact(null)} />
      <DriverFormModal open={Boolean(editDriver)} onClose={() => setEditDriver(null)} initialData={editDriver ?? undefined} />
      <LeadFormModal open={createLeadOpen} onClose={() => setCreateLeadOpen(false)} />
      <LeadFormModal open={Boolean(editLead)} onClose={() => setEditLead(null)} initialData={editLead ?? undefined} />
      <LeadViewModal lead={viewLead} onClose={() => setViewLead(null)} />
    </div>
  );
}
