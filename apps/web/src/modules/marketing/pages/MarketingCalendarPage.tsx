import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfWeek,
  format,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  APPROVAL_STATUSES,
  CONTENT_CHANNELS,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  TARGET_TYPES,
  type MarketingContent,
  useMarketingState,
} from "../state";

type ViewMode = "day" | "week" | "month" | "year";

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const EMPTY: Omit<MarketingContent, "id"> = {
  title: "",
  targetType: "Company",
  targetName: "",
  type: "Social Media",
  channel: "Instagram",
  channels: ["Instagram"],
  status: "Draft",
  approval: "Pending",
  publishDate: new Date().toISOString().slice(0, 10),
  publishTime: "12:00",
  owner: "",
  copy: "",
  notes: "",
  campaignId: "",
  hashtags: "",
  location: "",
  integratedAccountId: "",
  mediaName: "",
  mediaUrl: "",
};

function tone(status: string) {
  if (status === "Published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Scheduled") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "In Review") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function MarketingCalendarPage() {
  const [state, setState] = useMarketingState();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingContent | null>(null);

  const filtered = useMemo(
    () =>
      state.contents.filter((content) => {
        const haystack = `${content.title} ${content.copy} ${content.targetName} ${content.hashtags ?? ""}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (type !== "all" && content.type !== type) return false;
        if (status !== "all" && content.status !== status) return false;
        const channels = content.channels?.length ? content.channels : [content.channel];
        if (platform !== "all" && !channels.includes(platform)) return false;
        return true;
      }),
    [state.contents, search, type, status, platform],
  );

  const metrics = useMemo(() => {
    const today = new Date();
    const next7 = addDays(today, 7);
    return {
      total: state.contents.length,
      scheduled: state.contents.filter((content) => content.status === "Scheduled").length,
      published: state.contents.filter((content) => content.status === "Published").length,
      next7: state.contents.filter((content) => {
        if (!content.publishDate) return false;
        const date = new Date(`${content.publishDate}T${content.publishTime || "00:00"}`);
        return date >= today && date <= next7;
      }).length,
    };
  }, [state.contents]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, "MMMM d, yyyy");
    if (viewMode === "week") {
      return `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} — ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`;
    }
    if (viewMode === "year") return format(currentDate, "yyyy");
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, viewMode]);

  const calendarDays = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }
    if (viewMode === "year") {
      return Array.from({ length: 12 }, (_, index) => new Date(currentDate.getFullYear(), index, 1));
    }
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [currentDate, viewMode]);

  const move = (direction: -1 | 1) => {
    setCurrentDate((date) => {
      if (viewMode === "day") return addDays(date, direction);
      if (viewMode === "week") return direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1);
      if (viewMode === "year") return direction < 0 ? subYears(date, 1) : addYears(date, 1);
      return direction < 0 ? subMonths(date, 1) : addMonths(date, 1);
    });
  };

  const save = (content: MarketingContent) => {
    setState((current) => ({
      ...current,
      contents: current.contents.some((item) => item.id === content.id)
        ? current.contents.map((item) => (item.id === content.id ? content : item))
        : [...current.contents, content],
    }));
  };

  const hasFilters = Boolean(search || type !== "all" || status !== "all" || platform !== "all");
  const clearFilters = () => {
    setSearch("");
    setType("all");
    setStatus("all");
    setPlatform("all");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Contents" value={metrics.total} description="planned content" icon={CalendarDays} />
        <Metric title="Scheduled" value={metrics.scheduled} description="queued for publication" icon={Clock3} />
        <Metric title="Published" value={metrics.published} description="already published" icon={CheckCircle2} />
        <Metric title="Next 7 days" value={metrics.next7} description="upcoming deliveries" icon={CalendarClock} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>Today</Button>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Next period" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
        <span className="min-w-[150px] px-1 text-sm font-medium text-slate-600">{periodLabel}</span>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="h-8 pl-9" placeholder="Search content..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <SelectTrigger className="h-8 w-[105px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{VIEW_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{CONTENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[145px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{CONTENT_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="h-8 w-[145px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Platforms</SelectItem>{CONTENT_CHANNELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters ? <Button variant="outline" size="sm" className="h-8" onClick={clearFilters}>Clear filters</Button> : null}
        <Button size="sm" className="h-8" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Content</Button>
      </div>

      {viewMode === "year" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {calendarDays.map((month) => (
            <MonthCard key={month.toISOString()} month={month} contents={filtered} onEdit={(content) => { setEditing(content); setFormOpen(true); }} />
          ))}
        </div>
      ) : (
        <CalendarGrid
          days={calendarDays}
          contents={filtered}
          viewMode={viewMode}
          currentDate={currentDate}
          onEdit={(content) => { setEditing(content); setFormOpen(true); }}
          onDay={(date) => { setCurrentDate(date); setViewMode("day"); }}
        />
      )}

      <ContentScheduleModal
        open={formOpen}
        onOpenChange={setFormOpen}
        content={editing}
        campaigns={state.campaigns}
        onSave={save}
      />
    </div>
  );
}

function Metric({ title, value, description, icon: Icon }: { title: string; value: number; description: string; icon: typeof CalendarDays }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{title}</p><Icon className="h-4 w-4 text-[#1E3D7A]" /></div><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{value}</p><p className="mt-1 text-[11px] text-slate-400">{description}</p></div>;
}

function CalendarGrid({ days, contents, viewMode, currentDate, onEdit, onDay }: {
  days: Date[];
  contents: MarketingContent[];
  viewMode: ViewMode;
  currentDate: Date;
  onEdit: (content: MarketingContent) => void;
  onDay: (date: Date) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {viewMode !== "day" ? (
        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-[11px] font-semibold uppercase text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="border-r border-slate-200 py-2 last:border-0">{day}</div>)}
        </div>
      ) : null}
      <div className={viewMode === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}>
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const items = contents.filter((content) => content.publishDate === iso);
          return (
            <div key={iso} className={`${viewMode === "day" ? "min-h-[430px]" : "min-h-32"} border-b border-r border-slate-200 p-2 ${viewMode === "month" && day.getMonth() !== currentDate.getMonth() ? "bg-slate-50/70" : "bg-white"}`}>
              <button type="button" className="mb-2 text-xs font-semibold text-slate-600" onClick={() => onDay(day)}>{viewMode === "day" ? format(day, "EEEE, MMMM d, yyyy") : day.getDate()}</button>
              <div className="space-y-1">
                {items.map((item) => {
                  const channels = item.channels?.length ? item.channels : [item.channel];
                  return <button key={item.id} type="button" onClick={() => onEdit(item)} className={`w-full rounded border px-2 py-1 text-left text-[10px] ${tone(item.status)}`}><p className="truncate font-semibold">{item.publishTime} {item.title}</p><p className="truncate opacity-70">{channels.join(", ")}</p></button>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthCard({ month, contents, onEdit }: { month: Date; contents: MarketingContent[]; onEdit: (content: MarketingContent) => void }) {
  const items = contents.filter((content) => {
    if (!content.publishDate) return false;
    const date = new Date(`${content.publishDate}T00:00:00`);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  });
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#0B1E36]">{format(month, "MMMM")}</h3><span className="text-xs text-slate-400">{items.length} content(s)</span></div><div className="mt-3 space-y-1.5">{items.slice(0, 6).map((item) => <button key={item.id} onClick={() => onEdit(item)} className={`block w-full truncate rounded border px-2 py-1 text-left text-[10px] ${tone(item.status)}`}>{format(new Date(`${item.publishDate}T00:00:00`), "MMM d")} · {item.title}</button>)}{!items.length ? <p className="py-4 text-center text-xs text-slate-400">No content.</p> : null}</div></div>;
}

function ContentScheduleModal({ open, onOpenChange, content, campaigns, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: MarketingContent | null;
  campaigns: Array<{ id: string; name: string }>;
  onSave: (content: MarketingContent) => void;
}) {
  const [form, setForm] = useState<Omit<MarketingContent, "id">>(EMPTY);
  const [advanced, setAdvanced] = useState(false);

  useMemo(() => {
    if (!open) return;
    if (content) {
      const { id: _id, ...rest } = content;
      setForm({ ...EMPTY, ...rest, channels: rest.channels?.length ? rest.channels : [rest.channel] });
    } else {
      setForm({ ...EMPTY, publishDate: new Date().toISOString().slice(0, 10) });
    }
  }, [open, content]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const channels = form.channels?.length ? form.channels : [form.channel];
  const togglePlatform = (platform: string) => {
    const next = channels.includes(platform) ? channels.filter((item) => item !== platform) : [...channels, platform];
    if (!next.length) return;
    setForm((current) => ({ ...current, channels: next, channel: next[0] }));
  };
  const save = (statusOverride?: string) => {
    if (!form.title.trim() || !form.publishDate || !channels.length) return;
    onSave({ ...form, status: statusOverride ?? form.status, channel: channels[0], channels, id: content?.id ?? crypto.randomUUID() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader><DialogTitle>{content ? "Edit Content" : "New Content"}</DialogTitle><DialogDescription>Schedule and prepare content for one or more platforms using the same operational fields as the reference module.</DialogDescription></DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content Preview</p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex aspect-square items-center justify-center bg-slate-100">
                {form.mediaUrl ? <img src={form.mediaUrl} alt="Content preview" className="h-full w-full object-cover" /> : <div className="text-center"><ImageIcon className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-2 text-xs text-slate-400">Media preview</p></div>}
              </div>
              <div className="p-4"><p className="text-sm font-semibold">{form.title || "Untitled content"}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{form.copy || "Caption / copy preview will appear here."}</p><div className="mt-3 flex flex-wrap gap-1">{channels.map((item) => <span key={item} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">{item}</span>)}</div>{form.hashtags ? <p className="mt-3 text-[11px] text-blue-600">{form.hashtags}</p> : null}</div>
            </div>
          </aside>

          <div className="space-y-4">
            <Field label="Title *"><Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Content title" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Context"><Select value={form.targetType} onValueChange={(value) => set("targetType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TARGET_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Project / Carrier / Broker / Customer"><Input value={form.targetName} onChange={(event) => set("targetName", event.target.value)} placeholder="Select or enter target" /></Field>
            </div>
            <Field label="Platforms *"><div className="flex flex-wrap gap-2">{CONTENT_CHANNELS.map((item) => <button type="button" key={item} onClick={() => togglePlatform(item)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${channels.includes(item) ? "border-[#1E3D7A] bg-blue-50 text-[#1E3D7A]" : "border-slate-200 bg-white text-slate-500"}`}>{item}{channels[0] === item ? " · Primary" : ""}</button>)}</div></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Content Type"><Select value={form.type} onValueChange={(value) => set("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Date *"><Input type="date" value={form.publishDate} onChange={(event) => set("publishDate", event.target.value)} /></Field>
              <Field label="Time"><Input type="time" value={form.publishTime} onChange={(event) => set("publishTime", event.target.value)} /></Field>
            </div>
            <Field label="Caption / Copy"><Textarea rows={6} value={form.copy} onChange={(event) => set("copy", event.target.value)} placeholder="Write the copy for this content..." /></Field>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdvanced((value) => !value)}>{advanced ? "Hide advanced fields" : "Show advanced fields"}</Button>
            {advanced ? (
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2">
                <Field label="Integrated Account"><Input value={form.integratedAccountId ?? ""} onChange={(event) => set("integratedAccountId", event.target.value)} placeholder="Connected account identifier" /></Field>
                <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTENT_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Approval"><Select value={form.approval} onValueChange={(value) => set("approval", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{APPROVAL_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Campaign"><Select value={form.campaignId || "none"} onValueChange={(value) => set("campaignId", value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="No campaign" /></SelectTrigger><SelectContent><SelectItem value="none">No campaign</SelectItem>{campaigns.map((campaign) => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Owner"><Input value={form.owner} onChange={(event) => set("owner", event.target.value)} /></Field>
                <Field label="Location"><Input value={form.location ?? ""} onChange={(event) => set("location", event.target.value)} placeholder="Optional location" /></Field>
                <Field label="Hashtags" className="sm:col-span-2"><Input value={form.hashtags ?? ""} onChange={(event) => set("hashtags", event.target.value)} placeholder="#dispatch #logistics" /></Field>
                <Field label="Media Name"><Input value={form.mediaName ?? ""} onChange={(event) => set("mediaName", event.target.value)} placeholder="Creative asset name" /></Field>
                <Field label="Media URL"><Input value={form.mediaUrl ?? ""} onChange={(event) => set("mediaUrl", event.target.value)} placeholder="https://..." /></Field>
                <Field label="Notes" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
              </div>
            ) : null}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled title="Publishing requires a configured external integration endpoint.">Publish via Integration</Button>
            <Button onClick={() => save("Scheduled")} disabled={!form.title.trim() || !form.publishDate || !channels.length}>Schedule</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>;
}
