import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCrmContacts,
  useListCrmLeads,
  useListCarriers,
  useListBrokers,
  useDeleteCrmContact,
  useDeleteCrmLead,
  getListCrmContactsQueryKey,
  getListCrmLeadsQueryKey,
} from "@workspace/api-client-react";
import type { CrmLead } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { ContactFormModal } from "../components/ContactFormModal";
import { ContactViewModal } from "../components/ContactViewModal";
import { LeadFormModal } from "../components/LeadFormModal";
import { LeadViewModal } from "../components/LeadViewModal";
import { DriverFormModal } from "../components/DriverFormModal";
import { useListDrivers, useDeleteDriver, type Driver } from "../hooks/useDrivers";

type Tab = "contacts" | "leads";

interface UnifiedContact {
  id: string;
  companyName: string;
  contactType: string;
  primaryContactName: string;
  primaryPhoneNumber: string;
  email: string;
  status: string;
  _source: "crm" | "carrier" | "broker" | "driver";
  _raw: any;
}

export default function CRMPage() {
  const [tab, setTab] = useState<Tab>("contacts");

  const qc = useQueryClient();

  const deleteContact = useDeleteCrmContact({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListCrmContactsQueryKey() }) },
  });
  const deleteLead = useDeleteCrmLead({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListCrmLeadsQueryKey() }) },
  });
  const deleteDriver = useDeleteDriver();

  // ── Contacts state ──
  const [contactSearch, setContactSearch] = useState("");
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [viewContact, setViewContact] = useState<any | null>(null);
  const [editContact, setEditContact] = useState<any | null>(null);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  const { data: contactsData, isLoading: contactsLoading } = useListCrmContacts({
    query: { pageSize: 200 } as any,
  });
  const { data: carriersData, isLoading: carriersLoading } = useListCarriers({
    query: { pageSize: 200 } as any,
  });
  const { data: brokersData, isLoading: brokersLoading } = useListBrokers({
    query: { pageSize: 200 } as any,
  });
  const { data: driversData, isLoading: driversLoading } = useListDrivers({ pageSize: 200 });

  const allContactsLoading = contactsLoading || carriersLoading || brokersLoading || driversLoading;

  const allContacts = useMemo<UnifiedContact[]>(() => {
    const rows: UnifiedContact[] = [];

    (contactsData?.data ?? []).forEach((c: any) => {
      rows.push({
        id: c.id,
        companyName: c.companyName,
        contactType: c.contactType || "Contact",
        primaryContactName: c.primaryContactName || c.primaryContact || "",
        primaryPhoneNumber: c.primaryPhoneNumber || c.phone || "",
        email: c.email || "",
        status: c.status || "Active",
        _source: "crm",
        _raw: c,
      });
    });

    (carriersData?.data ?? []).forEach((c: any) => {
      rows.push({
        id: c.id,
        companyName: c.companyName,
        contactType: "Carrier",
        primaryContactName: c.primaryContact || "",
        primaryPhoneNumber: c.phone || "",
        email: c.email || "",
        status: c.status || "Active",
        _source: "carrier",
        _raw: c,
      });
    });

    (brokersData?.data ?? []).forEach((b: any) => {
      rows.push({
        id: b.id,
        companyName: b.companyName,
        contactType: "Broker",
        primaryContactName: b.primaryContact || "",
        primaryPhoneNumber: b.phone || "",
        email: b.email || "",
        status: b.status || "Active",
        _source: "broker",
        _raw: b,
      });
    });

    (driversData?.data ?? []).forEach((d: Driver) => {
      rows.push({
        id: d.id,
        companyName: d.fullName,
        contactType: "Driver",
        primaryContactName: d.fullName,
        primaryPhoneNumber: d.phoneNumber || "",
        email: d.email || "",
        status: d.status || "Active",
        _source: "driver",
        _raw: d,
      });
    });

    return rows.sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [contactsData, carriersData, brokersData, driversData]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return allContacts;
    const q = contactSearch.toLowerCase();
    return allContacts.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.primaryContactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.contactType.toLowerCase().includes(q)
    );
  }, [allContacts, contactSearch]);

  // ── Leads state ──
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("all");
  const [leadPage, setLeadPage] = useState(1);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [viewLead, setViewLead] = useState<CrmLead | null>(null);
  const [editLead, setEditLead] = useState<CrmLead | null>(null);

  const { data: leadsData, isLoading: leadsLoading } = useListCrmLeads({
    query: {
      search: leadSearch || undefined,
      status: leadStatus !== "all" ? leadStatus : undefined,
      page: leadPage,
      pageSize: 50,
    } as any,
  });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">CRM</h1>
          <p className="text-sm font-mono text-muted-foreground">Contacts & Pipeline</p>
        </div>
        {tab === "contacts" && (
          <Button className="gap-2" onClick={() => setCreateContactOpen(true)}>
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        )}
        {tab === "leads" && (
          <Button className="gap-2" onClick={() => setCreateLeadOpen(true)}>
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["contacts", "leads"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 font-mono text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Contacts Tab ── */}
      {tab === "contacts" && (
        <>
          <div className="flex items-center gap-4 bg-card p-4 border border-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search company, name, type..."
                className="pl-9"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
            </div>
          </div>

          {allContactsLoading ? (
            <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
              LOADING.RECORDS...
            </div>
          ) : !filteredContacts.length ? (
            <div className="p-12 text-center border border-border bg-card flex flex-col items-center justify-center gap-2">
              <p className="font-mono text-sm text-muted-foreground">NO.RECORDS.FOUND</p>
              {contactSearch && (
                <Button variant="link" onClick={() => setContactSearch("")} className="font-mono text-xs">
                  CLEAR.SEARCH
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company / Name</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={`${contact._source}-${contact.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (contact._source === "driver") setEditDriver(contact._raw);
                      else if (contact._source === "crm") setViewContact(contact._raw);
                    }}
                  >
                    <TableCell className="font-medium uppercase text-xs">{contact.companyName}</TableCell>
                    <TableCell className="font-mono text-xs">{contact.primaryContactName || "--"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{contact.contactType}</TableCell>
                    <TableCell className="font-mono text-xs">{contact.primaryPhoneNumber || "--"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{contact.email || "--"}</TableCell>
                    <TableCell><StatusBadge status={contact.status} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {contact._source === "driver" ? (
                            <>
                              <DropdownMenuItem onClick={() => setEditDriver(contact._raw)}>Editar</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (window.confirm(`Excluir ${contact.companyName}?`))
                                    deleteDriver.mutate(contact.id);
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </>
                          ) : contact._source === "crm" ? (
                            <>
                              <DropdownMenuItem onClick={() => setViewContact(contact._raw)}>Ver</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditContact(contact._raw)}>Editar</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (window.confirm(`Excluir ${contact.companyName}?`))
                                    deleteContact.mutate({ contactId: contact.id });
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* ── Leads Tab ── */}
      {tab === "leads" && (
        <>
          <div className="flex items-center gap-4 bg-card p-4 border border-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Company, Contact..."
                className="pl-9"
                value={leadSearch}
                onChange={(e) => { setLeadSearch(e.target.value); setLeadPage(1); }}
              />
            </div>
            <div className="w-48">
              <Select value={leadStatus} onValueChange={(v) => { setLeadStatus(v); setLeadPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Pipeline Stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
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
            </div>
          </div>

          {leadsLoading ? (
            <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
              LOADING.RECORDS...
            </div>
          ) : !leadsData?.data.length ? (
            <div className="p-12 text-center border border-border bg-card flex flex-col items-center justify-center gap-2">
              <p className="font-mono text-sm text-muted-foreground">NO.RECORDS.FOUND</p>
              {(leadSearch || leadStatus !== "all") && (
                <Button variant="link" onClick={() => { setLeadSearch(""); setLeadStatus("all"); }} className="font-mono text-xs">
                  CLEAR.FILTERS
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Est. Weekly Rev</TableHead>
                  <TableHead>Next Follow-Up</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsData.data.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewLead(lead)}>
                    <TableCell className="font-medium uppercase text-xs">{lead.companyName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col">
                        <span className="text-foreground">{(lead as any).primaryContact || "--"}</span>
                        <span className="text-muted-foreground">{(lead as any).phone || "--"}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={lead.pipelineStage} /></TableCell>
                    <TableCell className="text-right font-mono font-medium text-primary">
                      {formatCurrency(lead.estimatedWeeklyRevenue)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate((lead as any).nextFollowUpDate)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewLead(lead)}>Ver</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditLead(lead)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (window.confirm(`Excluir ${lead.companyName}?`))
                                deleteLead.mutate({ leadId: lead.id });
                            }}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {leadsData?.meta && leadsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="font-mono text-xs text-muted-foreground">
                PAGE {leadsData.meta.page} OF {leadsData.meta.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={leadPage === 1} onClick={() => setLeadPage(p => p - 1)}>PREV</Button>
                <Button variant="outline" size="sm" disabled={leadPage === leadsData.meta.totalPages} onClick={() => setLeadPage(p => p + 1)}>NEXT</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ContactFormModal open={createContactOpen} onClose={() => setCreateContactOpen(false)} />
      <ContactFormModal open={!!editContact} onClose={() => setEditContact(null)} initialData={editContact ?? undefined} />
      <ContactViewModal contact={viewContact} onClose={() => setViewContact(null)} />
      <LeadFormModal open={createLeadOpen} onClose={() => setCreateLeadOpen(false)} />
      <LeadFormModal open={!!editLead} onClose={() => setEditLead(null)} initialData={editLead ?? undefined} />
      <LeadViewModal lead={viewLead} onClose={() => setViewLead(null)} />
      <DriverFormModal
        open={!!editDriver}
        onClose={() => setEditDriver(null)}
        initialData={editDriver ?? undefined}
      />
    </div>
  );
}
