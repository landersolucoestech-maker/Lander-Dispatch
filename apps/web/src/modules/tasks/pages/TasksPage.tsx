import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Eye, ListChecks, MoreHorizontal, Music, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";

type TaskStatus = "To Do" | "In Progress" | "Review" | "Completed";
type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
type Task = {
  id: string;
  title: string;
  context: string;
  targetName: string;
  sector: string;
  type: string;
  owner: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  description: string;
  referenceTrack: string;
  checklist: Array<{ id: string; label: string; done: boolean }>;
};

const EMPTY_TASK: Omit<Task, "id"> = {
  title: "",
  context: "Company",
  targetName: "",
  sector: "Operations",
  type: "Follow-up",
  owner: "",
  priority: "Medium",
  deadline: "",
  status: "To Do",
  description: "",
  referenceTrack: "",
  checklist: [],
};

const CONTEXTS = ["Company", "Carrier", "Broker", "Customer", "Load", "Project"];
const SECTORS = ["Operations", "Dispatch", "Accounting", "CRM", "Marketing", "Compliance", "Administration"];
const TYPES = ["Follow-up", "Document", "Call", "Review", "Research", "Creative", "Approval", "Delivery", "Other"];
const STATUSES: TaskStatus[] = ["To Do", "In Progress", "Review", "Completed"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

function statusTone(status: TaskStatus) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Review") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}
function priorityTone(priority: TaskPriority) {
  if (priority === "Urgent") return "text-rose-700";
  if (priority === "High") return "text-amber-700";
  if (priority === "Low") return "text-slate-500";
  return "text-[#1E3D7A]";
}

function TaskForm({ value, onChange, edit }: { value: Omit<Task, "id">; onChange: (next: Omit<Task, "id">) => void; edit: boolean }) {
  const set = <K extends keyof Omit<Task, "id">>(key: K, next: Omit<Task, "id">[K]) => onChange({ ...value, [key]: next });
  const [checkItem, setCheckItem] = useState("");
  return <div className="space-y-5">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Title *</Label><Input className="mt-1.5" value={value.title} onChange={(e) => set("title", e.target.value)} /></div>
      <div><Label>Context *</Label><Select value={value.context} onValueChange={(v) => set("context", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{CONTEXTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Project, carrier, broker or company *</Label><Input className="mt-1.5" value={value.targetName} onChange={(e) => set("targetName", e.target.value)} placeholder="Search or enter linked record" /></div>
      <div><Label>Sector *</Label><Select value={value.sector} onValueChange={(v) => set("sector", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{SECTORS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Type *</Label><Select value={value.type} onValueChange={(v) => set("type", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      {edit && <div><Label>Status *</Label><Select value={value.status} onValueChange={(v) => set("status", v as TaskStatus)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>}
      <div><Label>Priority *</Label><Select value={value.priority} onValueChange={(v) => set("priority", v as TaskPriority)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>Owner *</Label><Input className="mt-1.5" value={value.owner} onChange={(e) => set("owner", e.target.value)} /></div>
      <div><Label>Deadline *</Label><Input className="mt-1.5" type="date" value={value.deadline} onChange={(e) => set("deadline", e.target.value)} /></div>
      {edit && <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" rows={4} value={value.description} onChange={(e) => set("description", e.target.value)} /></div>}
    </div>
    {edit && <>
      <section className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><Music className="h-4 w-4 text-[#1E3D7A]" /><h3 className="text-sm font-semibold">Reference Track</h3></div><p className="mt-1 text-xs text-slate-500">Reference audio inherited from the linked project when available.</p><Input className="mt-3" value={value.referenceTrack} onChange={(e) => set("referenceTrack", e.target.value)} placeholder="Reference audio URL or file name" /></section>
      <section className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-[#1E3D7A]" /><h3 className="text-sm font-semibold">Checklist</h3></div><div className="mt-3 space-y-2">{value.checklist.map((item) => <div key={item.id} className="flex items-center gap-2"><input type="checkbox" checked={item.done} onChange={() => set("checklist", value.checklist.map((current) => current.id === item.id ? { ...current, done: !current.done } : current))} /><span className={`flex-1 text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span><Button size="sm" variant="ghost" onClick={() => set("checklist", value.checklist.filter((current) => current.id !== item.id))}>Remove</Button></div>)}</div><div className="mt-3 flex gap-2"><Input value={checkItem} onChange={(e) => setCheckItem(e.target.value)} placeholder="Add checklist item" /><Button type="button" variant="outline" onClick={() => { if (!checkItem.trim()) return; set("checklist", [...value.checklist, { id: crypto.randomUUID(), label: checkItem.trim(), done: false }]); setCheckItem(""); }}>Add</Button></div></section>
    </>}
  </div>;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Omit<Task, "id">>(EMPTY_TASK);
  const [viewing, setViewing] = useState<Task | null>(null);

  const filtered = useMemo(() => tasks.filter((task) => {
    const term = search.toLowerCase().trim();
    if (term && !`${task.title} ${task.targetName} ${task.description}`.toLowerCase().includes(term)) return false;
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return true;
  }), [tasks, search, typeFilter, statusFilter]);
  const kpis = { total: tasks.length, completed: tasks.filter((t) => t.status === "Completed").length, todo: tasks.filter((t) => t.status === "To Do").length, inProgress: tasks.filter((t) => t.status === "In Progress").length, review: tasks.filter((t) => t.status === "Review").length };
  const openCreate = () => { setEditing(null); setForm(EMPTY_TASK); setFormOpen(true); };
  const openEdit = (task: Task) => { const { id: _id, ...rest } = task; setEditing(task); setForm(rest); setFormOpen(true); };
  const save = () => { if (!form.title.trim() || !form.owner.trim() || !form.deadline) return; if (editing) setTasks((current) => current.map((task) => task.id === editing.id ? { ...form, id: editing.id } : task)); else setTasks((current) => [{ ...form, id: crypto.randomUUID() }, ...current]); setFormOpen(false); };

  return <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{[{ label: "Total", value: kpis.total, icon: ListChecks }, { label: "Completed", value: kpis.completed, icon: CheckCircle2 }, { label: "To Do", value: kpis.todo, icon: CalendarClock }, { label: "In Progress", value: kpis.inProgress, icon: UserRound }, { label: "Review", value: kpis.review, icon: Eye }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><Icon className="h-4 w-4 text-[#1E3D7A]" /></div><p className="mt-2 text-2xl font-semibold text-[#0B1E36]">{value}</p></div>)}</div>
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-1 flex-wrap gap-2"><div className="relative min-w-[220px] flex-1 lg:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />New Task</Button></div>
      {filtered.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Context</TableHead><TableHead>Owner</TableHead><TableHead>Priority</TableHead><TableHead>Deadline</TableHead><TableHead className="w-36">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((task) => <TableRow key={task.id}><TableCell><p className="font-medium">{task.title}</p><p className="text-[11px] text-slate-500">{task.type}</p></TableCell><TableCell><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusTone(task.status)}`}>{task.status}</span></TableCell><TableCell><p className="text-sm">{task.targetName || task.context}</p><p className="text-[11px] text-slate-500">{task.sector}</p></TableCell><TableCell>{task.owner}</TableCell><TableCell><span className={`text-xs font-semibold ${priorityTone(task.priority)}`}>{task.priority}</span></TableCell><TableCell className="text-xs text-slate-500">{task.deadline || "—"}</TableCell><TableCell><div className="flex items-center gap-1"><Button size="icon" variant="ghost" onClick={() => setViewing(task)} aria-label="View"><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => openEdit(task)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div> : <div className="py-16 text-center"><ListChecks className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No tasks found.</p><Button className="mt-4" variant="outline" onClick={openCreate}>Create first task</Button></div>}
    </section>
    <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader><TaskForm value={form} onChange={setForm} edit={Boolean(editing)} /><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={save}>{editing ? "Save Changes" : "Create Task"}</Button></div></DialogContent></Dialog>
    <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{viewing?.title}</DialogTitle></DialogHeader>{viewing && <div className="space-y-5"><div className="flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(viewing.status)}`}>{viewing.status}</span><span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{viewing.type}</span><span className={`rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold ${priorityTone(viewing.priority)}`}>{viewing.priority}</span></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] uppercase text-slate-400">Context</p><p className="mt-1 text-sm font-medium">{viewing.context} · {viewing.targetName || "Unlinked"}</p></div><div><p className="text-[10px] uppercase text-slate-400">Owner / Deadline</p><p className="mt-1 text-sm font-medium">{viewing.owner} · {viewing.deadline || "No deadline"}</p></div></div>{viewing.description && <div><p className="text-xs font-semibold uppercase text-slate-500">Description</p><p className="mt-1 text-sm leading-6">{viewing.description}</p></div>}<section className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><Music className="h-4 w-4 text-[#1E3D7A]" /><h3 className="text-sm font-semibold">Reference Track</h3></div><p className="mt-2 text-sm text-slate-500">{viewing.referenceTrack || "No reference track linked."}</p></section><section className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold">Checklist</h3><div className="mt-3 space-y-2">{viewing.checklist.length ? viewing.checklist.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm"><span className={`h-2 w-2 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} /><span className={item.done ? "text-slate-400 line-through" : ""}>{item.label}</span></div>) : <p className="text-sm text-slate-500">No checklist items.</p>}</div></section><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setViewing(null)}>Close</Button><Button onClick={() => { const task = viewing; setViewing(null); openEdit(task); }}>Edit</Button></div></div>}</DialogContent></Dialog>
  </div>;
}
