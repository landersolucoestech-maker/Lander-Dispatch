import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

export type AgendaEvent = {
  id: string;
  title: string;
  type: string;
  participants: string[];
  status: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  locationName: string;
  locationContact: string;
  address: string;
  capacity: string;
  fee: string;
  expectedAudience: string;
  description: string;
  notes: string;
};

export const EVENT_TYPES = ["Pickup", "Delivery", "Meeting", "Inspection", "Follow-up", "Training", "Other"];
export const EVENT_STATUSES = ["Confirmed", "Pending", "Scheduled", "Completed", "Cancelled", "Negotiation"];

export const EMPTY_AGENDA_EVENT: Omit<AgendaEvent, "id"> = {
  title: "", type: "Meeting", participants: [], status: "Scheduled",
  startDate: new Date().toISOString().slice(0, 10), startTime: "09:00",
  endDate: "", endTime: "", locationName: "", locationContact: "", address: "",
  capacity: "", fee: "", expectedAudience: "", description: "", notes: "",
};

export function SchedulerFormModal({ open, onOpenChange, event, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AgendaEvent | null;
  onSave: (value: AgendaEvent) => void;
}) {
  const [form, setForm] = useState<Omit<AgendaEvent, "id">>(EMPTY_AGENDA_EVENT);
  const [participantInput, setParticipantInput] = useState("");

  useEffect(() => {
    if (!open) return;
    if (event) {
      const { id: _id, ...rest } = event;
      setForm(rest);
    } else {
      setForm({ ...EMPTY_AGENDA_EVENT, startDate: new Date().toISOString().slice(0, 10) });
    }
    setParticipantInput("");
  }, [open, event]);

  const set = <K extends keyof Omit<AgendaEvent, "id">>(key: K, value: Omit<AgendaEvent, "id">[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.title.trim() || !form.startDate) return;
    onSave({ ...form, id: event?.id ?? crypto.randomUUID() });
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>{event ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Event Title *</Label><Input className="mt-1.5" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Enter event title" /></div>
        <div><Label>Event Type *</Label><Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{EVENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{EVENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-2"><Label>Event Participants</Label><div className="mt-1.5 rounded-lg border border-slate-200 p-2"><div className="flex flex-wrap gap-1.5">{form.participants.map((participant) => <button key={participant} type="button" onClick={() => set("participants", form.participants.filter((item) => item !== participant))} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">{participant} ×</button>)}</div><Input className="mt-2 border-0 px-1 shadow-none focus-visible:ring-0" value={participantInput} onChange={(e) => setParticipantInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && participantInput.trim()) { e.preventDefault(); set("participants", [...new Set([...form.participants, participantInput.trim()])]); setParticipantInput(""); } }} placeholder="Search carrier, broker, contact or team member…" /></div></div>
        <div><Label>Start Date *</Label><Input className="mt-1.5" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
        <div><Label>Start Time</Label><Input className="mt-1.5" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} /></div>
        <div><Label>End Date</Label><Input className="mt-1.5" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
        <div><Label>End Time</Label><Input className="mt-1.5" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} /></div>
        <div><Label>Location Name</Label><Input className="mt-1.5" value={form.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder="Select or enter location" /></div>
        <div><Label>Location Contact</Label><Input className="mt-1.5" value={form.locationContact} onChange={(e) => set("locationContact", e.target.value)} placeholder="Phone / WhatsApp" /></div>
        <div className="sm:col-span-2"><Label>Full Address</Label><Input className="mt-1.5" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full location address" /></div>
        <div><Label>Capacity</Label><Input className="mt-1.5" type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Maximum capacity" /></div>
        <div><Label>Fee / Cost</Label><Input className="mt-1.5" type="number" step="0.01" value={form.fee} onChange={(e) => set("fee", e.target.value)} placeholder="0.00" /></div>
        <div><Label>Expected Audience</Label><Input className="mt-1.5" type="number" value={form.expectedAudience} onChange={(e) => set("expectedAudience", e.target.value)} placeholder="Expected attendees" /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Event description" /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea className="mt-1.5" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes about the event" /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={!form.title.trim() || !form.startDate}>{event ? "Save Changes" : "Create Event"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
