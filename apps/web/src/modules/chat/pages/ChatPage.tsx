import { useState } from "react";
import { Headphones, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ChatInternoView } from "../components/ChatInternoView";
import { NewSupportConversationDialog, SupportCenterView } from "../components/SupportCenterView";

type ChatArea = "internal" | "support";
export default function ChatPage() {
  const [activeArea, setActiveArea] = useState<ChatArea>("support");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  return <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8"><div className="space-y-4 pt-[10px] pb-[10px]"><div className="flex items-center justify-between gap-3"><Tabs value={activeArea} onValueChange={(value) => setActiveArea(value as ChatArea)}><TabsList><TabsTrigger value="internal" className="gap-2"><Users className="h-4 w-4" />Internal Chat</TabsTrigger><TabsTrigger value="support" className="gap-2"><Headphones className="h-4 w-4" />Support Center</TabsTrigger></TabsList></Tabs><div className="flex items-center gap-2"><Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled><Settings className="h-3.5 w-3.5" />Settings</Button>{activeArea === "support" ? <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setNewConversationOpen(true)}><Plus className="h-3.5 w-3.5" />New Conversation</Button> : null}</div></div>{activeArea === "internal" ? <div className="mt-4"><ChatInternoView /></div> : <div className="mt-4"><SupportCenterView onRequestNew={() => setNewConversationOpen(true)} /></div>}</div><NewSupportConversationDialog open={newConversationOpen} onOpenChange={setNewConversationOpen} /></div>;
}
