import { useMemo, useState } from "react";
import { Archive, BellRing, CheckCircle2, CircleUserRound, Headphones, MessageSquarePlus, MoreHorizontal, Paperclip, Plus, Search, Send, Tag, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";

type Message = { id: string; author: string; body: string; at: string; internal?: boolean };
type Conversation = {
  id: string;
  title: string;
  subtitle: string;
  channel: string;
  status: string;
  assignee: string;
  tags: string[];
  unread: number;
  type: "direct" | "group" | "support";
  messages: Message[];
};

const CHANNELS = ["Internal", "WhatsApp", "Instagram", "Facebook", "Email", "Website"];
const STATUS = ["Open", "Waiting", "Resolved", "Archived"];

function EmptyConversation() {
  return <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center"><UsersRound className="h-9 w-9 text-slate-300" /><h2 className="mt-3 text-base font-semibold text-[#0B1E36]">Select a conversation</h2><p className="mt-1 max-w-sm text-sm text-slate-500">Choose a conversation from the queue or start a new one.</p></div>;
}

function ConversationList({ conversations, selectedId, onSelect, search, onSearch }: { conversations: Conversation[]; selectedId?: string; onSelect: (id: string) => void; search: string; onSearch: (value: string) => void }) {
  return <div className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search conversation..." value={search} onChange={(e) => onSearch(e.target.value)} /></div></div>
    <div className="min-h-0 flex-1 overflow-y-auto">{conversations.length ? conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => onSelect(conversation.id)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${selectedId === conversation.id ? "bg-blue-50" : "hover:bg-slate-50"}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3D7A]/10 text-[#1E3D7A]">{conversation.type === "group" ? <UsersRound className="h-4 w-4" /> : conversation.type === "support" ? <Headphones className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-[#0B1E36]">{conversation.title}</p>{conversation.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1E3D7A] px-1.5 text-[10px] font-semibold text-white">{conversation.unread}</span>}</div><p className="mt-0.5 truncate text-xs text-slate-500">{conversation.subtitle}</p><div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400"><span>{conversation.channel}</span><span>•</span><span>{conversation.status}</span></div></div></button>) : <div className="p-8 text-center text-sm text-slate-500">No conversations yet.</div>}</div>
  </div>;
}

function ConversationPanel({ conversation, onUpdate, onArchive }: { conversation?: Conversation; onUpdate: (next: Conversation) => void; onArchive: () => void }) {
  const [message, setMessage] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tag, setTag] = useState("");
  if (!conversation) return <EmptyConversation />;
  const send = () => {
    if (!message.trim()) return;
    onUpdate({ ...conversation, unread: 0, messages: [...conversation.messages, { id: crypto.randomUUID(), author: "You", body: message.trim(), at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), internal: internalNote }] });
    setMessage("");
  };
  return <div className="flex min-h-0 flex-col bg-white">
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-[#0B1E36]">{conversation.title}</h2><span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{conversation.channel}</span></div><p className="mt-0.5 truncate text-xs text-slate-500">{conversation.subtitle}</p></div><div className="flex flex-wrap items-center gap-2"><Select value={conversation.assignee || "unassigned"} onValueChange={(value) => onUpdate({ ...conversation, assignee: value === "unassigned" ? "" : value })}><SelectTrigger className="h-9 w-40"><SelectValue placeholder="Assignee" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem><SelectItem value="Dispatch">Dispatch</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Accounting">Accounting</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select><Select value={conversation.status} onValueChange={(value) => onUpdate({ ...conversation, status: value })}><SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger><SelectContent>{STATUS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => setTagOpen(true)}><Tag className="mr-1 h-4 w-4" />Tag</Button><Button size="sm" variant="outline" onClick={onArchive}><Archive className="mr-1 h-4 w-4" />Archive</Button></div></div>
    <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2">{conversation.tags.map((item) => <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{item}</span>)}{!conversation.tags.length && <span className="text-[11px] text-slate-400">No tags</span>}</div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">{conversation.messages.length ? conversation.messages.map((item) => <div key={item.id} className={`max-w-[80%] rounded-xl border p-3 ${item.author === "You" ? "ml-auto border-blue-100 bg-blue-50" : item.internal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="mb-1 flex items-center justify-between gap-4 text-[10px] text-slate-400"><span className="font-semibold text-slate-600">{item.author}{item.internal ? " · Internal note" : ""}</span><span>{item.at}</span></div><p className="text-sm leading-6 text-slate-700">{item.body}</p></div>) : <div className="flex h-full items-center justify-center text-sm text-slate-400">No messages in this conversation.</div>}</div>
    <div className="border-t border-slate-200 p-3"><div className="mb-2 flex items-center justify-between"><button type="button" className={`rounded-md px-2 py-1 text-xs font-medium ${internalNote ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100"}`} onClick={() => setInternalNote((value) => !value)}>{internalNote ? "Internal note enabled" : "Add internal note"}</button><div className="flex items-center gap-1"><Button size="icon" variant="ghost" aria-label="Attach file"><Paperclip className="h-4 w-4" /></Button><Button size="sm" variant="ghost">Quick reply</Button></div></div><div className="flex items-end gap-2"><Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={internalNote ? "Write an internal note..." : "Type a message..."} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button></div></div>
    <Dialog open={tagOpen} onOpenChange={setTagOpen}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Add tag</DialogTitle></DialogHeader><div><Label>New tag</Label><Input className="mt-1.5" placeholder="e.g. Priority" value={tag} onChange={(e) => setTag(e.target.value)} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTagOpen(false)}>Cancel</Button><Button onClick={() => { if (tag.trim()) onUpdate({ ...conversation, tags: Array.from(new Set([...conversation.tags, tag.trim()])) }); setTag(""); setTagOpen(false); }}>Add</Button></div></DialogContent></Dialog>
  </div>;
}

export default function ChatPage() {
  const [tab, setTab] = useState("internal");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newType, setNewType] = useState<"direct" | "group" | "support">("direct");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");

  const visible = useMemo(() => conversations.filter((item) => {
    if (tab === "internal" && item.type === "support") return false;
    if (tab === "support" && item.type !== "support") return false;
    const term = search.toLowerCase().trim();
    return !term || `${item.title} ${item.subtitle} ${item.tags.join(" ")}`.toLowerCase().includes(term);
  }), [conversations, search, tab]);
  const selected = conversations.find((item) => item.id === selectedId);
  const update = (next: Conversation) => setConversations((current) => current.map((item) => item.id === next.id ? next : item));
  const createConversation = () => {
    if (!newTitle.trim()) return;
    const type = tab === "support" ? "support" : newType;
    const conversation: Conversation = { id: crypto.randomUUID(), title: newTitle.trim(), subtitle: newSubtitle.trim(), channel: type === "support" ? "Website" : "Internal", status: "Open", assignee: "", tags: [], unread: 0, type, messages: [] };
    setConversations((current) => [conversation, ...current]);
    setSelectedId(conversation.id);
    setNewTitle(""); setNewSubtitle(""); setNewOpen(false);
  };

  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
    <Tabs value={tab} onValueChange={(value) => { setTab(value); setSelectedId(undefined); }} className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><TabsList className="w-fit"><TabsTrigger value="internal">Internal Chat</TabsTrigger><TabsTrigger value="support">Support Center</TabsTrigger></TabsList><div className="flex items-center gap-2"><Button variant="outline" className="gap-2"><BellRing className="h-4 w-4" />Automation Settings</Button><Button className="gap-2" onClick={() => setNewOpen(true)}><MessageSquarePlus className="h-4 w-4" />New Conversation</Button></div></div>
      <TabsContent value="internal" className="mt-0 min-h-0 flex-1"><div className="grid h-full min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[320px_1fr]"><ConversationList conversations={visible} selectedId={selectedId} onSelect={setSelectedId} search={search} onSearch={setSearch} /><ConversationPanel conversation={selected} onUpdate={update} onArchive={() => selected && update({ ...selected, status: "Archived" })} /></div></TabsContent>
      <TabsContent value="support" className="mt-0 min-h-0 flex-1"><div className="grid h-full min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white xl:grid-cols-[320px_1fr_260px]"><ConversationList conversations={visible} selectedId={selectedId} onSelect={setSelectedId} search={search} onSearch={setSearch} /><ConversationPanel conversation={selected} onUpdate={update} onArchive={() => selected && update({ ...selected, status: "Archived" })} /><aside className="hidden border-l border-slate-200 bg-slate-50/50 p-4 xl:block"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational Panel</h3>{selected ? <div className="mt-4 space-y-4"><div><p className="text-[10px] uppercase text-slate-400">Customer</p><p className="mt-1 text-sm font-semibold">{selected.title}</p><p className="text-xs text-slate-500">{selected.subtitle || "No linked contact"}</p></div><div><p className="text-[10px] uppercase text-slate-400">Actions</p><div className="mt-2 space-y-2"><Button variant="outline" size="sm" className="w-full justify-start"><CircleUserRound className="mr-2 h-4 w-4" />Link CRM</Button><Button variant="outline" size="sm" className="w-full justify-start"><Plus className="mr-2 h-4 w-4" />Create Lead</Button><Button variant="outline" size="sm" className="w-full justify-start"><CheckCircle2 className="mr-2 h-4 w-4" />Create Task</Button></div></div><div><p className="text-[10px] uppercase text-slate-400">Queue</p><p className="mt-1 text-sm">{selected.assignee || "Unassigned"}</p></div></div> : <p className="mt-4 text-sm text-slate-400">Select a support conversation.</p>}</aside></div></TabsContent>
    </Tabs>
    <Dialog open={newOpen} onOpenChange={setNewOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader><div className="space-y-4">{tab === "internal" && <div><Label>Conversation Type</Label><Select value={newType} onValueChange={(value) => setNewType(value as "direct" | "group" | "support")}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="direct">Direct</SelectItem><SelectItem value="group">Group</SelectItem></SelectContent></Select></div>}<div><Label>{tab === "support" ? "Customer / Contact" : "Name"} *</Label><Input className="mt-1.5" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={tab === "support" ? "Customer name" : "Person or group name"} /></div><div><Label>{tab === "support" ? "Phone / Email / Protocol" : "Participants"}</Label><Input className="mt-1.5" value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} /></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button><Button onClick={createConversation} disabled={!newTitle.trim()}>Start Conversation</Button></div></DialogContent></Dialog>
  </div>;
}
