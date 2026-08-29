import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, Search, Send, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { usePersistentState } from "@/shared/hooks/usePersistentState";
import type { InternalConversation } from "../types";

const SELECTED_ID_KEY = "lander:chat-internal:selected-id";
const draftKey = (id: string) => `lander:chat-internal:draft:${id}`;

export function ChatInternoView() {
  const [conversations, setConversations] = usePersistentState<InternalConversation[]>("lander:chat-internal", []);
  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem(SELECTED_ID_KEY) ?? "");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => { if (conversations.length && !conversations.some((c) => c.id === selectedId)) setSelectedId(conversations[0].id); }, [conversations, selectedId]);
  useEffect(() => { if (selectedId) sessionStorage.setItem(SELECTED_ID_KEY, selectedId); }, [selectedId]);
  useEffect(() => { setDraft(selectedId ? sessionStorage.getItem(draftKey(selectedId)) ?? "" : ""); }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? conversations.filter((c) => `${c.title} ${c.participants.join(" ")}`.toLowerCase().includes(q)) : conversations; }, [conversations, search]);

  const changeDraft = (value: string) => { setDraft(value); if (!selectedId) return; if (value) sessionStorage.setItem(draftKey(selectedId), value); else sessionStorage.removeItem(draftKey(selectedId)); };
  const send = () => {
    const body = draft.trim(); if (!body || !selected) return;
    setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, updatedAt: new Date().toISOString(), messages: [...conversation.messages, { id: crypto.randomUUID(), sender: "self", senderName: "You", body, at: new Date().toISOString() }] } : conversation));
    changeDraft("");
  };
  const create = () => {
    const names = participants.split(",").map((item) => item.trim()).filter(Boolean); if (!names.length) return;
    const conversation: InternalConversation = { id: crypto.randomUUID(), title: newTitle.trim() || (names.length > 1 ? "Team group" : names[0]), participants: names, messages: [], updatedAt: new Date().toISOString() };
    setConversations((current) => [conversation, ...current]); setSelectedId(conversation.id); setNewTitle(""); setParticipants(""); setNewOpen(false);
  };

  return <>
    <div className="flex h-[calc(100vh-248px)] min-h-[560px] gap-4">
      <section className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="space-y-3 border-b border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold text-[#0B1E36]"><Users className="h-4 w-4" />Internal Chat</h2><Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setNewOpen(true)}><Plus className="h-3.5 w-3.5" />New</Button></div><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input placeholder="Search conversation..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto">{filtered.length === 0 ? <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"><MessageCircle className="h-10 w-10 text-slate-300" /><p className="text-sm font-medium">No conversations yet</p><p className="text-xs text-slate-500">Internal chat remains isolated from the Support Center.</p><Button size="sm" className="mt-2 h-8 gap-1.5 text-xs" onClick={() => setNewOpen(true)}><Plus className="h-3.5 w-3.5" />Start conversation</Button></div> : filtered.map((conversation) => <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50 ${selectedId === conversation.id ? "bg-blue-50" : ""}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{conversation.title.split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{conversation.title}</p><p className="truncate text-xs text-slate-500">{conversation.participants.length} participant{conversation.participants.length === 1 ? "" : "s"}</p></div></button>)}</div>
      </section>
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">{!selected ? <div className="flex h-full flex-col items-center justify-center text-center"><MessageCircle className="mb-4 h-16 w-16 text-slate-300" /><h3 className="mb-2 text-lg font-semibold">Select an internal conversation</h3><p className="mb-4 max-w-sm text-sm text-slate-500">Choose an existing conversation or start a new one with a teammate.</p><Button className="h-8 gap-1.5 text-xs" onClick={() => setNewOpen(true)}><Plus className="h-3.5 w-3.5" />New conversation</Button></div> : <><div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">{selected.title.slice(0,2).toUpperCase()}</span><div><h3 className="text-base font-semibold">{selected.title}</h3><p className="text-xs text-slate-500">{selected.participants.join(", ")}</p></div></div><div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4">{selected.messages.length === 0 ? <p className="text-center text-sm text-slate-500">No messages yet. Say hello!</p> : <div className="space-y-4">{selected.messages.map((message) => <div key={message.id} className={`flex ${message.sender === "self" ? "justify-end" : "justify-start"}`}><div className={`max-w-[72%] rounded-lg px-3 py-2 shadow-sm ${message.sender === "self" ? "bg-[#1E3D7A] text-white" : "border border-slate-200 bg-white"}`}>{message.sender !== "self" ? <p className="mb-1 text-[11px] font-medium opacity-70">{message.senderName}</p> : null}<p className="text-sm leading-relaxed">{message.body}</p></div></div>)}</div>}</div><div className="border-t border-slate-200 p-4"><Textarea placeholder="Type a message..." className="min-h-[78px] resize-none" value={draft} onChange={(e) => changeDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><div className="mt-3 flex justify-end"><Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!draft.trim()} onClick={send}><Send className="h-3.5 w-3.5" />Send</Button></div></div></>}</section>
    </div>
    <Dialog open={newOpen} onOpenChange={setNewOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>New Internal Conversation</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Conversation name</Label><Input className="mt-1.5" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Optional for direct conversation" /></div><div><Label>Participants *</Label><Input className="mt-1.5" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Names or emails separated by commas" /></div></div><DialogFooter><Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button><Button onClick={create} disabled={!participants.trim()}>Create</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
