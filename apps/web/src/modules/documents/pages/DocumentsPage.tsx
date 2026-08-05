import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Download,
  File,
  FileArchive,
  FileImage,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentRecord,
} from "../api";

const CATEGORY_OPTIONS = [
  "Carrier Agreement",
  "Broker Agreement",
  "Rate Confirmation",
  "Insurance",
  "Authority",
  "Invoice",
  "Proof of Delivery",
  "Vehicle Document",
  "Tax Document",
  "Other",
] as const;

const ENTITY_OPTIONS = [
  { value: "none", label: "No related record" },
  { value: "carrier", label: "Carrier" },
  { value: "broker", label: "Broker" },
  { value: "load", label: "Load" },
  { value: "invoice", label: "Invoice" },
  { value: "transaction", label: "Transaction" },
] as const;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DocumentIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <FileImage className="h-5 w-5" />;
  if (contentType.includes("zip") || contentType.includes("compressed")) {
    return <FileArchive className="h-5 w-5" />;
  }
  if (contentType.includes("pdf") || contentType.startsWith("text/")) {
    return <FileText className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
}

function UploadDocumentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [entityType, setEntityType] = useState("none");
  const [entityId, setEntityId] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Select a file before uploading.");
      return uploadDocument(file, {
        name: name.trim() || file.name,
        category,
        entityType: entityType === "none" ? undefined : entityType,
        entityId: entityType === "none" ? undefined : entityId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setFile(null);
      setName("");
      setCategory("Other");
      setEntityType("none");
      setEntityId("");
      setNotes("");
      onClose();
    },
  });

  const handleFile = (selected: File | null) => {
    setFile(selected);
    if (selected && !name.trim()) setName(selected.name);
    mutation.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border bg-muted/10 p-8 text-center transition-colors hover:bg-muted/30">
            <Upload className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {file ? file.name : "Choose a file"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum size: 100 MB. Files are stored in the private bucket.
              </p>
            </div>
            <input
              type="file"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {file ? (
            <div className="flex items-center justify-between gap-3 border border-border bg-card p-3 text-sm">
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label>Document Name *</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Related Record Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {entityType !== "none" ? (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label>Related Record ID</Label>
                <Input
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value)}
                  placeholder="Carrier, broker, load, invoice or transaction ID"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>

          {mutation.isError ? (
            <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Document upload failed."}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              className="gap-2"
              disabled={!file || !name.trim() || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <Upload className="h-4 w-4" />
              {mutation.isPending ? "Uploading…" : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentActions({
  document,
  onDelete,
}: {
  document: DocumentRecord;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={`Actions for ${document.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(document.downloadUrl, "_blank", "noopener,noreferrer") }>
          <Download className="mr-2 h-4 w-4" /> Download
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const query = useQuery({
    queryKey: ["documents", search, category, page],
    queryFn: () =>
      listDocuments({
        search: search || undefined,
        category: category === "all" ? undefined : category,
        page,
        pageSize: 25,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const documents = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalSize = useMemo(
    () => documents.reduce((sum, document) => sum + document.size, 0),
    [documents],
  );

  const handleDelete = (document: DocumentRecord) => {
    if (!window.confirm(`Delete ${document.name} from the database and private storage?`)) return;
    deleteMutation.mutate(document.id);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DOCUMENTS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Private operational files stored in MinIO/S3-compatible storage.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total Documents</p>
          <p className="mt-2 text-2xl font-bold">{meta?.total ?? 0}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Visible Page Size</p>
          <p className="mt-2 text-2xl font-bold">{formatBytes(totalSize)}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Storage Mode</p>
          <p className="mt-2 text-sm font-semibold text-emerald-600">Private · Authenticated</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search document name or notes"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {query.isError ? (
        <div className="border border-destructive/40 bg-card p-10 text-center">
          <p className="font-semibold">Documents could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.error instanceof Error ? query.error.message : "Unknown API error."}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
        </div>
      ) : query.isLoading ? (
        <div className="border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 font-semibold">No documents found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the first operational document or clear the active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {documents.map((document) => (
            <article key={document.id} className="border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
                  <DocumentIcon contentType={document.contentType} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" title={document.name}>{document.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {document.category} · {formatBytes(document.size)}
                  </p>
                </div>
                <DocumentActions document={document} onDelete={() => handleDelete(document)} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="mt-1 font-medium">{formatDateTime(document.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded By</p>
                  <p className="mt-1 truncate font-medium">{document.uploadedByEmail || "Local development user"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Related Record</p>
                  <p className="mt-1 truncate font-medium">
                    {document.entityType
                      ? `${document.entityType}: ${document.entityId || "not specified"}`
                      : "None"}
                  </p>
                </div>
              </div>

              {document.notes ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {document.notes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {deleteMutation.isError ? (
        <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "Document deletion failed."}
        </div>
      ) : null}

      {meta && meta.totalPages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} documents
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <UploadDocumentDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
