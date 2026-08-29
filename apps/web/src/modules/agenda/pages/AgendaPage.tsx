import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Search, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type ViewMode = "day" | "week" | "month" | "year";
type AgendaEvent = {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  participants: string;
  locationName: string;
  locationContact: string;
  address: string;
  capacity: string;
  fee: string;
  expectedAudience: string;
  description: string;
  notes: string;
};

const EMPTY_EVENT: Omit<AgendaEvent, "id"> = {
  title: "",
  type: "Meeting",
  status: "Scheduled",
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endDate: "",
  endTime: "",
  participants: "",
  locationName: "",
  locationContact: "",
  address: "",
  capacity: "",
  fee: "",
  expectedAudience: "",
  description: "",
  notes: "",
};

const EVENT_TYPES = ["Meeting", "Pickup", "Delivery", "Inspection", "Follow-up", "Training", "Other"];
const STATUSES = ["Scheduled", "Pending", "Confirmed", "Completed", "Cancelled", "Negotiation"];
const VIEWS: Array<{ value: ViewMode; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function tone(status: string) {
  if (status === "Confirmed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Completed") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "Cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function EventForm({ value, onChange }: { value: Omit<AgendaEvent, "id">; onChange: (next: Omit<AgendaEvent, "id">) => void }) {
  const set = (key: keyof Omit<AgendaEvent, "id">, next: string) => onChange({ ...value, [key]: next });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Event Title *</Label><Input className="mt-1.5" value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Enter event title" /></div>
      <div><Label>Event Type *</Label><Select value={value.type} onValueChange={(v) => set("type", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{EVENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Status</Label><Select value={value.status} onValueChange={(v) => set("status", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="sm:col-span-2"><Label>Event Participants</Label><Input className="mt-1.5" value={value.participants} onChange={(e) => set("participants", e.target.value)} placeholder="Search carrier, broker, contact or team member" /></div>
      <div><Label>Start Date *</Label><Input className="mt-1.5" type="date" value={value.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
      <div><Label>Start Time</Label><Input className="mt-1.5" type="time" value={value.startTime} onChange={(e) => set("startTime", e.target.value)} /></div>
      <div><Label>End Date</Label><Input className="mt-1.5" type="date" value={value.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
      <div><Label>End Time</Label><Input className="mt-1.5" type="time" value={value.endTime} onChange={(e) => set("endTime", e.target.value)} /></div>
      <div><Label>Location Name</Label><Input className="mt-1.5" value={value.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder="Select or enter location" /></div>
      <div><Label>Location Contact</Label><Input className="mt-1.5" value={value.locationContact} onChange={(e) => set("locationContact", e.target.value)} placeholder="Phone / WhatsApp" /></div>
      <div className="sm:col-span-2"><Label>Full Address</Label><Input className="mt-1.5" value={value.address} onChange={(e) => set("address", e.target.value)} placeholder="Full event address" /></div>
      <div><Label>Capacity</Label><Input className="mt-1.5" type="number" value={value.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
      <div><Label>Expected Audience</Label><Input className="mt-1.5" type="number" value={value.expectedAudience} onChange={(e) => set("expectedAudience", e.target.value)} /></div>
      <div><Label>Fee / Cost</Label><Input className="mt-1.5" type="number" step="0.01" value={value.fee} onChange={(e) => set("fee", e.target.value)} placeholder="0.00" /></div>
      <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" rows={3} value={value.description} onChange={(e) => set("description", e.target.value)} placeholder="Event description" /></div>
      <div className="sm:col-span-2"><Label>Notes</Label><Textarea className="mt-1.5" rows={3} value={value.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Operational notes" /></div>
    </div>
  );
}

export default function AgendaPage() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaEvent | null>(null);
  const [form, setForm] = useState<Omit<AgendaEvent, "id">>(EMPTY_EVENT);
  const [viewing, setViewing] = useState<AgendaEvent | null>(null);

  const filtered = useMemo(() => events.filter((event) => {
    const term = search.trim().toLowerCase();
    if (term && !`${event.title} ${event.locationName} ${event.participants}`.toLowerCase().includes(term)) return false;
    if (typeFilter !== "all" && event.type !== typeFilter) return false;
    if (statusFilter !== "all" && event.status !== statusFilter) return false;
    return true;
  }), [events, search, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_EVENT, startDate: referenceDate.toISOString().slice(0, 10) });
    setFormOpen(true);
  };
  const openEdit = (event: AgendaEvent) => {
    setEditing(event);
    const { id: _id, ...rest } = event;
    setForm(rest);
    setFormOpen(true);
  };
  const save = () => {
    if (!form.title.trim()) return;
    if (editing) setEvents((current) => current.map((item) => item.id === editing.id ? { ...form, id: editing.id } : item));
    else setEvents((current) => [...current, { ...form, id: crypto.randomUUID() }]);
    setFormOpen(false);
  };

  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(referenceDate);
  const move = (direction: -1 | 1) => {
    const next = new Date(referenceDate);
    if (viewMode === "day") next.setDate(next.getDate() + direction);
    else if (viewMode === "week") next.setDate(next.getDate() + direction * 7);
    else if (viewMode === "year") next.setFullYear(next.getFullYear() + direction);
    else next.setMonth(next.getMonth() + direction);
    setReferenceDate(next);
  };

  const days = useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [referenceDate]);

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: "Total Events", value: events.length }, { label: "Confirmed", value: events.filter((e) => e.status === "Confirmed").length }, { label: "Pending", value: events.filter((e) => ["Pending", "Scheduled", "Negotiation"].includes(e.status)).length }, { label: "Completed", value: events.filter((e) => e.status === "Completed").length }].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{item.value}</p></div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search event..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{EVENT_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            {(search || typeFilter !== "all" || statusFilter !== "all") && <Button variant="ghost" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}>Clear filters</Button>}
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />New Event</Button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => setReferenceDate(new Date())}>Today</Button><Button size="icon" variant="outline" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button><p className="ml-2 font-semibold text-[#0B1E36]">{monthLabel}</p></div>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">{VIEWS.map((view) => <button key={view.value} type="button" onClick={() => setViewMode(view.value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${viewMode === view.value ? "bg-white text-[#1E3D7A] shadow-sm" : "text-slate-500"}`}>{view.label}</button>)}</div>
        </div>

        {viewMode === "month" || viewMode === "week" ? (
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-r border-slate-200 py-2 last:border-r-0">{day}</div>)}</div>
        ) : null}
        {viewMode === "month" || viewMode === "week" ? (
          <div className="grid grid-cols-7">{days.slice(viewMode === "week" ? Math.floor(days.findIndex((d) => d.toDateString() === referenceDate.toDateString()) / 7) * 7 : 0, viewMode === "week" ? Math.floor(days.findIndex((d) => d.toDateString() === referenceDate.toDateString()) / 7) * 7 + 7 : 42).map((day) => {
            const iso = day.toISOString().slice(0, 10);
            const dayEvents = filtered.filter((event) => event.startDate === iso);
            return <div key={iso} className={`min-h-28 border-b border-r border-slate-200 p-2 last:border-r-0 ${day.getMonth() !== referenceDate.getMonth() && viewMode === "month" ? "bg-slate-50/60" : "bg-white"}`}><button type="button" className="mb-2 text-xs font-semibold text-slate-600" onClick={() => { setReferenceDate(day); setViewMode("day"); }}>{day.getDate()}</button><div className="space-y-1">{dayEvents.map((event) => <button key={event.id} type="button" onClick={() => setViewing(event)} className={`w-full truncate rounded border px-2 py-1 text-left text-[11px] ${tone(event.status)}`}>{event.startTime} {event.title}</button>)}</div></div>;
          })}</div>
        ) : viewMode === "day" ? (
          <div className="p-4"><div className="mb-3 text-sm font-semibold">{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(referenceDate)}</div><div className="space-y-2">{filtered.filter((event) => event.startDate === referenceDate.toISOString().slice(0, 10)).map((event) => <button type="button" key={event.id} onClick={() => setViewing(event)} className="flex w-full items-start gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"><Clock3 className="mt-0.5 h-4 w-4 text-[#1E3D7A]" /><div><p className="font-semibold">{event.title}</p><p className="text-xs text-slate-500">{event.startTime} · {event.type} · {event.locationName || "No location"}</p></div></button>)}{filtered.filter((event) => event.startDate === referenceDate.toISOString().slice(0, 10)).length === 0 && <div className="py-16 text-center text-sm text-slate-500">No events scheduled for this day.</div>}</div></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 12 }, (_, month) => <button key={month} type="button" onClick={() => { setReferenceDate(new Date(referenceDate.getFullYear(), month, 1)); setViewMode("month"); }} className="rounded-lg border border-slate-200 p-4 text-left hover:border-[#1E3D7A]/40 hover:bg-blue-50/40"><p className="font-semibold">{new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, month, 1))}</p><p className="mt-1 text-xs text-slate-500">{filtered.filter((event) => new Date(`${event.startDate}T00:00:00`).getMonth() === month).length} events</p></button>)}</div>
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader><EventForm value={form} onChange={setForm} /><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={save} disabled={!form.title.trim()}>{editing ? "Save Changes" : "Create Event"}</Button></div></DialogContent></Dialog>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{viewing?.title}</DialogTitle></DialogHeader>{viewing ? <div className="space-y-4"><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone(viewing.status)}`}>{viewing.status}</span><span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{viewing.type}</span></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="flex gap-2"><CalendarDays className="h-4 w-4 text-[#1E3D7A]" /><div><p className="text-xs text-slate-500">Date & time</p><p className="text-sm font-medium">{viewing.startDate} {viewing.startTime}{viewing.endDate ? ` → ${viewing.endDate} ${viewing.endTime}` : ""}</p></div></div><div className="flex gap-2"><Users className="h-4 w-4 text-[#1E3D7A]" /><div><p className="text-xs text-slate-500">Participants</p><p className="text-sm font-medium">{viewing.participants || "None"}</p></div></div><div className="flex gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-[#1E3D7A]" /><div><p className="text-xs text-slate-500">Location</p><p className="text-sm font-medium">{viewing.locationName || "Not set"}</p><p className="text-xs text-slate-500">{viewing.address}</p></div></div></div>{viewing.description && <div><p className="text-xs font-semibold uppercase text-slate-500">Description</p><p className="mt-1 text-sm">{viewing.description}</p></div>}{viewing.notes && <div><p className="text-xs font-semibold uppercase text-slate-500">Notes</p><p className="mt-1 text-sm">{viewing.notes}</p></div>}<div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button variant="destructive" onClick={() => { setEvents((current) => current.filter((event) => event.id !== viewing.id)); setViewing(null); }}>Delete</Button><Button variant="outline" onClick={() => setViewing(null)}>Close</Button><Button onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</Button></div></div> : null}</DialogContent></Dialog>
    </div>
  );
}
