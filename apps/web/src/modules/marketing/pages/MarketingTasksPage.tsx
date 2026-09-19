import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Link2,
  ListChecks,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { MarketingKpiCard, MarketingSectionCard, StatusBadge } from "../components/MarketingPrimitives";
import {
  CONTENT_CHANNELS,
  MARKETING_TASK_APPROVALS,
  MARKETING_TASK_PRIORITIES,
  MARKETING_TASK_STATUSES,
  MARKETING_WORKSTREAMS,
  type MarketingBriefing,
  type MarketingCampaign,
  type MarketingContent,
  type MarketingTask,
  type MarketingTaskApproval,
  type MarketingTaskPriority,
  type MarketingTaskStatus,
  useMarketingState,
} from "../state";

const EMPTY: Omit<MarketingTask,"id"> = {
  title:"",
  workstream:"Content",
  status:"Planned",
  priority:"Medium",
  owner:"",
  reviewer:"",
  deadline:"",
  description:"",
  deliverable:"",
  campaignId:"",
  briefingId:"",
  contentId:"",
  channels:[],
  approval:"Not Required",
  referenceUrl:"",
  checklist:[],
};

function priorityClass(priority: MarketingTaskPriority) {
  if (priority==="Urgent") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority==="High") return "border-amber-200 bg-amber-50 text-amber-700";
  if (priority==="Low") return "border-slate-200 bg-slate-50 text-slate-500";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function isOverdue(task: MarketingTask) {
  if (!task.deadline || task.status==="Completed") return false;
  const today=new Date(); today.setHours(0,0,0,0);
  const deadline=new Date(`${task.deadline}T00:00:00`);
  return deadline < today;
}

export default function MarketingTasksPage(){
  const [state,setState]=useMarketingState();
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("all");
  const [workstream,setWorkstream]=useState("all");
  const [campaign,setCampaign]=useState("all");
  const [formOpen,setFormOpen]=useState(false);
  const [editing,setEditing]=useState<MarketingTask|null>(null);
  const [viewing,setViewing]=useState<MarketingTask|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<MarketingTask|null>(null);

  useEffect(()=>{
    const open=()=>{setEditing(null);setFormOpen(true)};
    window.addEventListener("lander:marketing-tasks-create",open);
    return()=>window.removeEventListener("lander:marketing-tasks-create",open);
  },[]);

  const filtered=useMemo(()=>state.tasks.filter(task=>{
    const q=search.trim().toLowerCase();
    const campaignName=state.campaigns.find(item=>item.id===task.campaignId)?.name??"";
    const haystack=`${task.title} ${task.deliverable} ${task.owner} ${task.reviewer} ${campaignName} ${task.channels.join(" ")}`.toLowerCase();
    return (!q||haystack.includes(q))
      && (status==="all"||task.status===status)
      && (workstream==="all"||task.workstream===workstream)
      && (campaign==="all"||task.campaignId===campaign);
  }),[state.tasks,state.campaigns,search,status,workstream,campaign]);

  const stats=useMemo(()=>({
    total:state.tasks.length,
    active:state.tasks.filter(task=>["Planned","In Progress"].includes(task.status)).length,
    review:state.tasks.filter(task=>task.status==="In Review").length,
    blocked:state.tasks.filter(task=>task.status==="Blocked"||isOverdue(task)).length,
    completed:state.tasks.filter(task=>task.status==="Completed").length,
  }),[state.tasks]);

  const save=(task:MarketingTask)=>setState(current=>({
    ...current,
    tasks:current.tasks.some(item=>item.id===task.id)
      ? current.tasks.map(item=>item.id===task.id?task:item)
      : [...current.tasks,task],
  }));

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MarketingKpiCard title="Marketing Tasks" value={stats.total} icon={ListChecks} description="execution work"/>
      <MarketingKpiCard title="Active" value={stats.active} icon={Clock3} description="planned or in progress"/>
      <MarketingKpiCard title="In Review" value={stats.review} icon={Eye} description="waiting for review"/>
      <MarketingKpiCard title="Blocked / Overdue" value={stats.blocked} icon={AlertTriangle} description="needs attention"/>
      <MarketingKpiCard title="Completed" value={stats.completed} icon={CheckCircle2} description="finished deliverables"/>
    </div>

    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="relative min-w-[240px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
        <Input className="pl-9" placeholder="Search task, campaign, deliverable or owner..." value={search} onChange={event=>setSearch(event.target.value)}/>
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
        <SelectContent><SelectItem value="all">All statuses</SelectItem>{MARKETING_TASK_STATUSES.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={workstream} onValueChange={setWorkstream}>
        <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
        <SelectContent><SelectItem value="all">All workstreams</SelectItem>{MARKETING_WORKSTREAMS.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={campaign} onValueChange={setCampaign}>
        <SelectTrigger className="w-48"><SelectValue placeholder="All campaigns"/></SelectTrigger>
        <SelectContent><SelectItem value="all">All campaigns</SelectItem>{state.campaigns.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>

    <MarketingSectionCard title="Marketing Execution Queue" description="Tasks tied to campaigns, briefings, content, channels, approvals and creative deliverables">
      {filtered.length ? <Table>
        <TableHeader><TableRow>
          <TableHead>Task</TableHead><TableHead>Campaign / Deliverable</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead>
          <TableHead>Channels</TableHead><TableHead>Owner</TableHead><TableHead>Deadline</TableHead><TableHead>Approval</TableHead><TableHead className="w-12"/>
        </TableRow></TableHeader>
        <TableBody>{filtered.map(task=>{
          const campaignName=state.campaigns.find(item=>item.id===task.campaignId)?.name;
          return <TableRow key={task.id}>
            <TableCell><p className="font-medium">{task.title}</p><p className="text-[11px] text-slate-500">{task.workstream}{task.reviewer?` · Reviewer: ${task.reviewer}`:""}</p></TableCell>
            <TableCell><p className="text-sm">{campaignName||"Independent marketing task"}</p><p className="max-w-56 truncate text-[11px] text-slate-500">{task.deliverable||"No deliverable specified"}</p></TableCell>
            <TableCell><StatusBadge value={task.status}/></TableCell>
            <TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span></TableCell>
            <TableCell><p className="max-w-48 truncate text-xs text-slate-600">{task.channels.join(", ")||"—"}</p></TableCell>
            <TableCell>{task.owner||"—"}</TableCell>
            <TableCell><span className={isOverdue(task)?"text-xs font-semibold text-rose-600":"text-xs text-slate-500"}>{task.deadline||"—"}</span></TableCell>
            <TableCell><StatusBadge value={task.approval}/></TableCell>
            <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
              <DropdownMenuItem onClick={()=>setViewing(task)}><Eye className="mr-2 h-4 w-4"/>View</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>{setEditing(task);setFormOpen(true)}}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={()=>setDeleteTarget(task)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
            </DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>;
        })}</TableBody>
      </Table> : <div className="py-14 text-center"><Megaphone className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 text-sm font-medium">No marketing tasks found</p><p className="mt-1 text-xs text-slate-500">Create execution work for campaigns, content and marketing deliverables.</p><Button size="sm" className="mt-4" onClick={()=>{setEditing(null);setFormOpen(true)}}><Plus className="mr-2 h-4 w-4"/>New Marketing Task</Button></div>}
    </MarketingSectionCard>

    <MarketingTaskForm
      open={formOpen}
      onOpenChange={setFormOpen}
      task={editing}
      campaigns={state.campaigns}
      briefings={state.briefings}
      contents={state.contents}
      onSave={save}
    />
    <MarketingTaskView
      task={viewing}
      campaigns={state.campaigns}
      briefings={state.briefings}
      contents={state.contents}
      onOpenChange={open=>!open&&setViewing(null)}
      onEdit={task=>{setViewing(null);setEditing(task);setFormOpen(true)}}
    />
    <Dialog open={Boolean(deleteTarget)} onOpenChange={open=>!open&&setDeleteTarget(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Delete marketing task?</DialogTitle><DialogDescription>{deleteTarget?`“${deleteTarget.title}” will be permanently removed from the marketing execution queue.`:"This action cannot be undone."}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={()=>setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" onClick={()=>{if(!deleteTarget)return;setState(current=>({...current,tasks:current.tasks.filter(item=>item.id!==deleteTarget.id)}));setDeleteTarget(null)}}>Delete</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function MarketingTaskForm({
  open,onOpenChange,task,campaigns,briefings,contents,onSave,
}:{
  open:boolean;
  onOpenChange:(open:boolean)=>void;
  task:MarketingTask|null;
  campaigns:MarketingCampaign[];
  briefings:MarketingBriefing[];
  contents:MarketingContent[];
  onSave:(task:MarketingTask)=>void;
}){
  const [form,setForm]=useState<Omit<MarketingTask,"id">>(EMPTY);
  const [checkDraft,setCheckDraft]=useState("");

  useEffect(()=>{
    if(!open)return;
    if(task){const{id:_id,...rest}=task;setForm(rest)}else setForm(EMPTY);
    setCheckDraft("");
  },[open,task]);

  const set=<K extends keyof Omit<MarketingTask,"id">>(key:K,value:Omit<MarketingTask,"id">[K])=>setForm(current=>({...current,[key]:value}));
  const save=()=>{
    if(!form.title.trim()||!form.owner.trim()||!form.deadline)return;
    onSave({...form,id:task?.id??crypto.randomUUID()});
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{task?"Edit Marketing Task":"New Marketing Task"}</DialogTitle>
        <DialogDescription>Plan execution around a marketing campaign, briefing, content item, channel, reviewer and approval flow.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Task Title *" wide><Input value={form.title} onChange={event=>set("title",event.target.value)} placeholder="Example: Finalize Instagram launch carousel"/></Field>
        <Field label="Workstream *"><Select value={form.workstream} onValueChange={value=>set("workstream",value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{MARKETING_WORKSTREAMS.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Status *"><Select value={form.status} onValueChange={value=>set("status",value as MarketingTaskStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{MARKETING_TASK_STATUSES.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Priority *"><Select value={form.priority} onValueChange={value=>set("priority",value as MarketingTaskPriority)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{MARKETING_TASK_PRIORITIES.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Approval"><Select value={form.approval} onValueChange={value=>set("approval",value as MarketingTaskApproval)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{MARKETING_TASK_APPROVALS.map(item=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Owner *"><Input value={form.owner} onChange={event=>set("owner",event.target.value)} placeholder="Execution owner"/></Field>
        <Field label="Reviewer"><Input value={form.reviewer} onChange={event=>set("reviewer",event.target.value)} placeholder="Approver or reviewer"/></Field>
        <Field label="Deadline *"><Input type="date" value={form.deadline} onChange={event=>set("deadline",event.target.value)}/></Field>
        <Field label="Campaign"><Select value={form.campaignId||"none"} onValueChange={value=>set("campaignId",value==="none"?"":value)}><SelectTrigger><SelectValue placeholder="No campaign"/></SelectTrigger><SelectContent><SelectItem value="none">No campaign</SelectItem>{campaigns.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Briefing"><Select value={form.briefingId||"none"} onValueChange={value=>set("briefingId",value==="none"?"":value)}><SelectTrigger><SelectValue placeholder="No briefing"/></SelectTrigger><SelectContent><SelectItem value="none">No briefing</SelectItem>{briefings.map(item=><SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Content / Calendar Item"><Select value={form.contentId||"none"} onValueChange={value=>set("contentId",value==="none"?"":value)}><SelectTrigger><SelectValue placeholder="No content item"/></SelectTrigger><SelectContent><SelectItem value="none">No content item</SelectItem>{contents.map(item=><SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Deliverable"><Input value={form.deliverable} onChange={event=>set("deliverable",event.target.value)} placeholder="Carousel, ad set, landing page, report..."/></Field>
        <Field label="Channels" wide><div className="flex flex-wrap gap-2">{CONTENT_CHANNELS.map(channel=><button key={channel} type="button" onClick={()=>set("channels",form.channels.includes(channel)?form.channels.filter(item=>item!==channel):[...form.channels,channel])} className={`rounded-full border px-2.5 py-1 text-xs ${form.channels.includes(channel)?"border-blue-300 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600"}`}>{channel}</button>)}</div></Field>
        <Field label="Creative / Reference URL" wide><Input value={form.referenceUrl} onChange={event=>set("referenceUrl",event.target.value)} placeholder="https://..."/></Field>
        <Field label="Execution Notes" wide><Textarea rows={4} value={form.description} onChange={event=>set("description",event.target.value)} placeholder="Requirements, handoff notes, dependencies and acceptance criteria..."/></Field>
        <Field label="Checklist" wide>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="space-y-2">{form.checklist.map(item=><div key={item.id} className="flex items-center gap-2"><Checkbox checked={item.done} onCheckedChange={()=>set("checklist",form.checklist.map(entry=>entry.id===item.id?{...entry,done:!entry.done}:entry))}/><Input value={item.label} onChange={event=>set("checklist",form.checklist.map(entry=>entry.id===item.id?{...entry,label:event.target.value}:entry))}/><Button size="icon" variant="ghost" onClick={()=>set("checklist",form.checklist.filter(entry=>entry.id!==item.id))}><Trash2 className="h-4 w-4"/></Button></div>)}</div>
            <div className="mt-3 flex gap-2"><Input value={checkDraft} onChange={event=>setCheckDraft(event.target.value)} placeholder="Add execution step" onKeyDown={event=>{if(event.key==="Enter"&&checkDraft.trim()){event.preventDefault();set("checklist",[...form.checklist,{id:crypto.randomUUID(),label:checkDraft.trim(),done:false}]);setCheckDraft("")}}}/><Button type="button" variant="outline" onClick={()=>{if(!checkDraft.trim())return;set("checklist",[...form.checklist,{id:crypto.randomUUID(),label:checkDraft.trim(),done:false}]);setCheckDraft("")}}>Add</Button></div>
          </div>
        </Field>
      </div>
      <DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={!form.title.trim()||!form.owner.trim()||!form.deadline}>{task?"Save Changes":"Create Marketing Task"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function MarketingTaskView({
  task,campaigns,briefings,contents,onOpenChange,onEdit,
}:{
  task:MarketingTask|null;
  campaigns:MarketingCampaign[];
  briefings:MarketingBriefing[];
  contents:MarketingContent[];
  onOpenChange:(open:boolean)=>void;
  onEdit:(task:MarketingTask)=>void;
}){
  if(!task)return null;
  const campaign=campaigns.find(item=>item.id===task.campaignId);
  const briefing=briefings.find(item=>item.id===task.briefingId);
  const content=contents.find(item=>item.id===task.contentId);
  return <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader><div className="flex items-start justify-between gap-4"><div><DialogTitle className="text-xl">{task.title}</DialogTitle><DialogDescription>{task.workstream} marketing execution task</DialogDescription></div><Button variant="outline" size="sm" onClick={()=>onEdit(task)}><Pencil className="mr-2 h-4 w-4"/>Edit</Button></div></DialogHeader>
      <div className="flex flex-wrap gap-2"><StatusBadge value={task.status}/><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityClass(task.priority)}`}>{task.priority}</span><StatusBadge value={task.approval}/></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info icon={UserRound} label="Owner" value={task.owner||"—"}/><Info icon={Eye} label="Reviewer" value={task.reviewer||"—"}/><Info icon={CalendarClock} label="Deadline" value={task.deadline||"—"}/><Info icon={Megaphone} label="Workstream" value={task.workstream}/>
      </div>
      <div className="grid gap-4 md:grid-cols-3"><Block label="Campaign" value={campaign?.name||"Independent"}/><Block label="Briefing" value={briefing?.title||"—"}/><Block label="Content Item" value={content?.title||"—"}/></div>
      <Block label="Deliverable" value={task.deliverable||"—"}/>
      <Block label="Channels" value={task.channels.join(", ")||"—"}/>
      <Block label="Execution Notes" value={task.description||"No execution notes."} multiline/>
      {task.referenceUrl?<section><p className="text-xs font-medium text-slate-500">Creative / Reference</p><a href={task.referenceUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-[#1E3D7A] hover:bg-slate-50"><Link2 className="h-4 w-4"/>Open reference</a></section>:null}
      {task.checklist.length?<section><p className="text-xs font-medium text-slate-500">Execution Checklist</p><div className="mt-1.5 space-y-2 rounded-lg border border-slate-200 p-3">{task.checklist.map(item=><div key={item.id} className="flex items-center gap-2 text-sm"><span className={item.done?"text-emerald-600":"text-slate-400"}>{item.done?"✓":"○"}</span><span className={item.done?"text-slate-400 line-through":""}>{item.label}</span></div>)}</div></section>:null}
    </DialogContent>
  </Dialog>;
}

function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <div className={wide?"sm:col-span-2":""}><Label>{label}</Label><div className="mt-1.5">{children}</div></div>}
function Info({icon:Icon,label,value}:{icon:typeof UserRound;label:string;value:string}){return <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3"><div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-500"><Icon className="h-3.5 w-3.5"/>{label}</div><p className="break-words text-sm font-medium">{value}</p></div>}
function Block({label,value,multiline=false}:{label:string;value:string;multiline?:boolean}){return <section><p className="text-xs font-medium text-slate-500">{label}</p><div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3"><p className={multiline?"whitespace-pre-wrap text-sm leading-relaxed":"text-sm font-medium"}>{value}</p></div></section>}
