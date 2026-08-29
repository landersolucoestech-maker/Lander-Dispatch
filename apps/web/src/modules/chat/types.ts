export type InternalConversation = { id: string; title: string; participants: string[]; messages: ChatMessage[]; updatedAt: string };
export type ChatMessage = { id: string; sender: "self" | "other"; senderName: string; body: string; at: string; kind?: "message" | "note" };
export type SupportStatus = "Open" | "Pending" | "Waiting" | "Closed";
export type SupportChannel = "WhatsApp" | "Instagram" | "Facebook" | "Email" | "Website";
export type SupportConversation = {
  id: string; protocol: string; contactName: string; phone: string; channel: SupportChannel; status: SupportStatus;
  assignee: string; originLabel: string; tags: string[]; messages: ChatMessage[]; internalNotes: ChatMessage[];
  createdAt: string; updatedAt: string; priority: "Normal" | "High" | "Urgent"; deadline: string;
};
