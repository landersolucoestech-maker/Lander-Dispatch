import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, addWeeks, addYears, endOfWeek, format, startOfWeek, subMonths, subWeeks, subYears } from "date-fns";
import { Calendar, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Plus, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { usePersistentState } from "@/shared/hooks/usePersistentState";
import { EVENT_STATUSES, EVENT_TYPES, SchedulerFormModal, type AgendaEvent } from "../components/SchedulerFormModal";
import { SchedulerViewModal } from "../components/SchedulerViewModal";

type ViewMode = "day" | "week" | "month" | "year";
const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "year", label: "Year" }];

function eventTone(status: string) {
  if (status === "Confirmed") return "border-emerald-300/40 bg-emerald-50 text-emerald-700";
  if (status === "Completed") return "border-sky-300/40 bg-sky-50 text-sky-700";
  if (status === "Cancelled") return "border-rose-300/40 bg-rose-50 text-rose-700";
  return "border-amber-300/40 bg-amber-50 text-amber-700";
}

export default function AgendaPage() {
  const [events, setEvents] = usePersistentState<AgendaEvent[]>("lander:agenda-events", []);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all-type");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaEvent | null>(null);
  const [viewing, setViewing] = useState<AgendaEvent | null>(null);

  useEffect(() => { const open = () => { setEditing(null); setFormOpen(true); }; window.addEventListener("lander:agenda-create", open); return () => window.removeEventListener("lander:agenda-create", open); }, []);

  const filtered = useMemo(() => events.filter((event) => {
    const term = searchTerm.trim().toLowerCase();
    if (term && !`${event.title} ${event.locationName} ${event.participants.join(" ")}`.toLowerCase().includes(term)) return false;
    if (typeFilter !== "all-type" && event.type !== typeFilter) return false;
    if (statusFilter !== "all-status" && event.status !== statusFilter) return false;
    return true;
  }), [events, searchTerm, typeFilter, statusFilter]);

  const metrics = useMemo(() => {
    const now = new Date();
    const seven = addDays(now, 7);
    return {
      total: events.length,
      confirmed: events.filter((event) => event.status === "Confirmed").length,
      pending: events.filter((event) => ["Pending", "Scheduled", "Negotiation"].includes(event.status)).length,
      next7: events.filter((event) => { const date = new Date(`${event.startDate}T${event.startTime || "00:00"}`); return date >= now && date <= seven; }).length,
    };
  }, [events]);

  const periodLabel = useMemo(() => {
    if (viewMode === "week") return `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d")} — ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d 'of' MMMM, yyyy")}`;
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "year") return format(currentDate, "yyyy");
    return format(currentDate, "d MMMM yyyy");
  }, [currentDate, viewMode]);

  const move = (direction: -1 | 1) => setCurrentDate((date) => viewMode === "week" ? (direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1)) : viewMode === "month" ? (direction < 0 ? subMonths(date, 1) : addMonths(date, 1)) : viewMode === "year" ? (direction < 0 ? subYears(date, 1) : addYears(date, 1)) : addDays(date, direction));
  const clear = () => { setSearchTerm(""); setTypeFilter("all-type"); setStatusFilter("all-status"); };
  const save = (event: AgendaEvent) => setEvents((current) => current.some((item) => item.id === event.id) ? current.map((item) => item.id === event.id ? event : item) : [...current, event]);

  const calendarDays = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    if (viewMode === "week") { const start = startOfWeek(currentDate, { weekStartsOn: 1 }); return Array.from({ length: 7 }, (_, index) => addDays(start, index)); }
    if (viewMode === "year") return Array.from({ length: 12 }, (_, index) => new Date(currentDate.getFullYear(), index, 1));
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)); return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [currentDate, viewMode]);

  const hasFilters = searchTerm || typeFilter !== "all-type" || statusFilter !== "all-status";
  return <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric title="Events" value={metrics.total} description="total events" icon={CalendarDays} />
      <Metric title="Confirmed" value={metrics.confirmed} description="confirmed events" icon={CheckCircle2} />
      <Metric title="Pending" value={metrics.pending} description="awaiting confirmation" icon={Clock} />
      <Metric title="Next 7 days" value={metrics.next7} description="coming week" icon={CalendarClock} />
    </div>

    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100/70 p-3">
      <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentDate(new Date())}>Today</Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(-1)} aria-label="Previous period"><ChevronLeft className="h-4 w-4" /></Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(1)} aria-label="Next period"><ChevronRight className="h-4 w-4" /></Button>
      <span className="min-w-[150px] px-1 text-sm font-medium text-slate-600">{periodLabel}</span>
      <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search event..." className="h-8 pl-9" /></div>
      <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}><SelectTrigger className="h-8 w-[104px] text-xs"><SelectValue /></SelectTrigger><SelectContent>{VIEW_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="h-8 w-[142px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all-type">All Types</SelectItem>{EVENT_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-8 w-[142px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all-status">All Statuses</SelectItem>{EVENT_STATUSES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
      {hasFilters ? <Button variant="outline" size="sm" className="h-8 px-3" onClick={clear}>Clear filters</Button> : null}
    </div>

    {filtered.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white py-12 text-center text-slate-500"><Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" /><p>No events found</p><Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Create first event</Button></div> : viewMode === "year" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{calendarDays.map((month) => <MonthCard key={month.toISOString()} month={month} events={filtered} onSelect={setViewing} />)}</div> : <CalendarGrid days={calendarDays} events={filtered} mode={viewMode} currentDate={currentDate} onSelect={setViewing} onDay={(date) => { setCurrentDate(date); setViewMode("day"); }} />}

    <SchedulerViewModal event={viewing} onOpenChange={(open) => !open && setViewing(null)} onEdit={(event) => { setViewing(null); setEditing(event); setFormOpen(true); }} />
    <SchedulerFormModal open={formOpen} onOpenChange={setFormOpen} event={editing} onSave={save} />
  </div>;
}

function Metric({ title, value, description, icon: Icon }: { title: string; value: number; description: string; icon: typeof CalendarDays }) { return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{title}</p><Icon className="h-4 w-4 text-[#1E3D7A]" /></div><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{value}</p><p className="mt-1 text-[11px] text-slate-400">{description}</p></div>; }
function CalendarGrid({ days, events, mode, currentDate, onSelect, onDay }: { days: Date[]; events: AgendaEvent[]; mode: ViewMode; currentDate: Date; onSelect: (event: AgendaEvent) => void; onDay: (date: Date) => void }) { return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{mode !== "day" ? <div className="grid grid-cols-7 border-b border-slate-200 text-center text-[11px] font-semibold uppercase text-slate-500">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <div key={day} className="border-r border-slate-200 py-2 last:border-0">{day}</div>)}</div> : null}<div className={mode === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}>{days.map((day) => { const iso = format(day, "yyyy-MM-dd"); const dayEvents = events.filter((event) => event.startDate === iso); return <div key={iso} className={`${mode === "day" ? "min-h-[420px]" : "min-h-32"} border-b border-r border-slate-200 p-2 ${mode === "month" && day.getMonth() !== currentDate.getMonth() ? "bg-slate-50/60" : "bg-white"}`}><button type="button" className="mb-2 text-xs font-semibold text-slate-600" onClick={() => onDay(day)}>{mode === "day" ? format(day, "EEEE, MMMM d, yyyy") : day.getDate()}</button><div className="space-y-1">{dayEvents.map((event) => <button key={event.id} type="button" onClick={() => onSelect(event)} className={`w-full truncate rounded border px-2 py-1 text-left text-[11px] ${eventTone(event.status)}`}>{event.startTime ? `${event.startTime} ` : ""}{event.title}</button>)}</div></div>; })}</div></div>; }
function MonthCard({ month, events, onSelect }: { month: Date; events: AgendaEvent[]; onSelect: (event: AgendaEvent) => void }) { const monthEvents = events.filter((event) => { const date = new Date(`${event.startDate}T00:00:00`); return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }); return <div className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="text-sm font-semibold text-[#0B1E36]">{format(month, "MMMM")}</h3><p className="mt-1 text-xs text-slate-500">{monthEvents.length} event(s)</p><div className="mt-3 space-y-1.5">{monthEvents.slice(0, 5).map((event) => <button key={event.id} onClick={() => onSelect(event)} className={`block w-full truncate rounded border px-2 py-1 text-left text-[11px] ${eventTone(event.status)}`}>{format(new Date(`${event.startDate}T00:00:00`), "MMM d")} · {event.title}</button>)}</div></div>; }
