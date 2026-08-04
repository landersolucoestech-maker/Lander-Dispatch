import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListCrmContacts, useDeleteCrmContact } from "@workspace/api-client-react";
import type { CrmContact } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { ContactFormModal } from "../components/ContactFormModal";
import { ContactViewModal } from "../components/ContactViewModal";

export default function ContactsListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewContact, setViewContact] = useState<CrmContact | null>(null);
  const [editContact, setEditContact] = useState<CrmContact | null>(null);

  const qc = useQueryClient();
  const deleteMutation = useDeleteCrmContact({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }) },
  });
  const handleDelete = (contact: CrmContact) => {
    if (!window.confirm(`Excluir contato ${contact.companyName}?`)) return;
    deleteMutation.mutate({ contactId: contact.id });
  };

  const { data, isLoading } = useListCrmContacts({ search: search || undefined, page, pageSize: 50 }, { query: { queryKey: ["contacts", search, page] } });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Contacts</h1>
          <p className="text-sm font-mono text-muted-foreground">Global Address Book</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Company, Name..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
          LOADING.RECORDS...
        </div>
      ) : !data?.data.length ? (
        <div className="p-12 text-center border border-border bg-card flex flex-col items-center justify-center gap-2">
          <p className="font-mono text-sm text-muted-foreground">NO.RECORDS.FOUND</p>
          {search ? (
            <Button variant="link" onClick={() => { setSearch(""); setPage(1); }} className="font-mono text-xs">
              CLEAR.SEARCH
            </Button>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((contact) => (
              <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewContact(contact)}>
                <TableCell className="font-medium uppercase text-xs">{contact.companyName}</TableCell>
                <TableCell className="font-mono text-xs">{contact.primaryContact || "--"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contact.contactType || "--"}</TableCell>
                <TableCell className="font-mono text-xs">{contact.phone || "--"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contact.email || "--"}</TableCell>
                <TableCell>
                  <StatusBadge status={contact.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewContact(contact)}>Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditContact(contact)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(contact)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="font-mono text-xs text-muted-foreground">
            PAGE {data.meta.page} OF {data.meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>PREV</Button>
            <Button variant="outline" size="sm" disabled={page === data.meta.totalPages} onClick={() => setPage(p => p + 1)}>NEXT</Button>
          </div>
        </div>
      )}

      <ContactFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ContactFormModal open={!!editContact} onClose={() => setEditContact(null)} initialData={editContact ?? undefined} />
      <ContactViewModal contact={viewContact} onClose={() => setViewContact(null)} />
    </div>
  );
}
