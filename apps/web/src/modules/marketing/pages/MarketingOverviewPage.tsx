import { Link } from "wouter";
import { CalendarClock, CheckCircle2, ClipboardList, FileEdit, Gauge, ListChecks, Megaphone, Plus, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MarketingKpiCard, MarketingSectionCard, StatusBadge } from "../components/MarketingPrimitives";
import { useMarketingState } from "../state";

const QUICK=[
  {href:"/marketing/campaigns",label:"New Campaign",icon:Megaphone},
  {href:"/marketing/calendar",label:"New Content",icon:CalendarClock},
  {href:"/marketing/tasks",label:"New Marketing Task",icon:ListChecks},
  {href:"/marketing/ai-creative",label:"AI Creative",icon:Sparkles},
];

export default function MarketingOverviewPage(){
  const[state]=useMarketingState();
  const activeCampaigns=state.campaigns.filter(c=>c.status==="Active").length;
  const scheduled=state.contents.filter(c=>c.status==="Scheduled").length;
  const pendingTasks=state.tasks.filter(task=>task.status!=="Completed").length;
  const published=state.contents.filter(c=>c.status==="Published").length;
  const pendingApprovals=state.contents.filter(c=>c.approval==="Pending").length+state.tasks.filter(task=>task.approval==="Pending").length;
  const upcoming=state.contents
    .filter(c=>c.publishDate&&new Date(`${c.publishDate}T${c.publishTime||"00:00"}`)>=new Date())
    .sort((a,b)=>a.publishDate.localeCompare(b.publishDate))
    .slice(0,6);
  const executionQueue=state.tasks
    .filter(task=>task.status!=="Completed")
    .sort((a,b)=>(a.deadline||"9999-12-31").localeCompare(b.deadline||"9999-12-31"))
    .slice(0,6);
  const performance=state.campaigns.length
    ?Math.round(state.campaigns.reduce((sum,campaign)=>sum+Math.max(0,Math.min(100,campaign.metrics.roi||0)),0)/state.campaigns.length)
    :0;

  const recent=[
    ...state.campaigns.slice(-2).map(item=>({id:`campaign-${item.id}`,label:`Campaign: ${item.name}`,meta:item.status})),
    ...state.contents.slice(-2).map(item=>({id:`content-${item.id}`,label:`Content: ${item.title}`,meta:item.status})),
    ...state.tasks.slice(-2).map(item=>({id:`task-${item.id}`,label:`Task: ${item.title}`,meta:item.status})),
  ].reverse().slice(0,6);

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MarketingKpiCard title="Active Campaigns" value={activeCampaigns} icon={Megaphone}/>
      <MarketingKpiCard title="Active Projects" value={state.campaigns.filter(c=>c.status!=="Completed"&&c.status!=="Cancelled").length} icon={Rocket}/>
      <MarketingKpiCard title="Scheduled Content" value={scheduled} icon={CalendarClock}/>
      <MarketingKpiCard title="Pending Tasks" value={pendingTasks} icon={ListChecks}/>
      <MarketingKpiCard title="Published Content" value={published} icon={FileEdit}/>
      <MarketingKpiCard title="Pending Approvals" value={pendingApprovals} icon={CheckCircle2}/>
      <MarketingKpiCard title="Upcoming Deliveries" value={upcoming.length} icon={CalendarClock}/>
      <MarketingKpiCard title="Sector Performance" value={`${performance}%`} icon={Gauge}/>
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <MarketingSectionCard title="Upcoming Deliveries" description="Content scheduled for publication" action={<Link href="/marketing/calendar"><Button variant="ghost" size="sm">View calendar</Button></Link>}>
          {upcoming.length?<ul className="divide-y divide-slate-200">{upcoming.map(content=><li key={content.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{content.title}</p><p className="text-[11px] text-slate-500">{(content.channels?.length?content.channels:[content.channel]).join(", ")} · {content.publishDate} {content.publishTime}</p></div><StatusBadge value={content.status}/></li>)}</ul>:<p className="py-4 text-sm text-slate-500">Nothing scheduled.</p>}
        </MarketingSectionCard>
        <MarketingSectionCard title="Marketing Execution Queue" description="Open campaign, content and creative work" action={<Link href="/marketing/tasks"><Button variant="ghost" size="sm">View tasks</Button></Link>}>
          {executionQueue.length?<ul className="divide-y divide-slate-200">{executionQueue.map(task=><li key={task.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className="text-[11px] text-slate-500">{task.workstream} · {task.owner||"Unassigned"} · {task.deadline||"No deadline"}</p></div><StatusBadge value={task.status}/></li>)}</ul>:<p className="py-4 text-sm text-slate-500">No open marketing tasks.</p>}
        </MarketingSectionCard>
      </div>
      <div className="space-y-6">
        <MarketingSectionCard title="Quick Actions"><div className="space-y-2">{QUICK.map(({href,label,icon:Icon})=><Link key={href} href={href}><Button variant="outline" size="sm" className="w-full justify-start gap-2"><Plus className="h-3.5 w-3.5"/><Icon className="h-3.5 w-3.5"/>{label}</Button></Link>)}</div></MarketingSectionCard>
        <MarketingSectionCard title="Pending Approvals">{pendingApprovals?<div className="space-y-3">{state.contents.filter(item=>item.approval==="Pending").slice(0,3).map(item=><div key={`content-${item.id}`} className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium">{item.title}</p><p className="text-[11px] text-slate-500">Content approval</p></div><StatusBadge value={item.approval}/></div>)}{state.tasks.filter(item=>item.approval==="Pending").slice(0,3).map(item=><div key={`task-${item.id}`} className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium">{item.title}</p><p className="text-[11px] text-slate-500">Task approval · {item.reviewer||"No reviewer"}</p></div><StatusBadge value={item.approval}/></div>)}</div>:<p className="py-2 text-sm text-slate-500">No pending approvals.</p>}</MarketingSectionCard>
        <MarketingSectionCard title="Recent Activity"><div className="space-y-3">{recent.map(item=><div key={item.id} className="flex gap-3"><ClipboardList className="mt-0.5 h-4 w-4 text-[#1E3D7A]"/><div><p className="text-xs font-medium">{item.label}</p><p className="text-[11px] text-slate-500">{item.meta}</p></div></div>)}</div></MarketingSectionCard>
      </div>
    </div>
  </div>;
}
