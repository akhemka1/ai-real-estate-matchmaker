"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/messaging/chat-list";
import { mockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
}

const mockMessages: Record<string, Message[]> = {
  t1: [
    {
      id: "m1",
      senderId: "agent",
      content: "Hi Alex! I saw you're interested in the Pine Ridge property.",
      sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: "m2",
      senderId: mockUser.id,
      content: "Yes! The mountain views look incredible. Is it still available?",
      sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "m3",
      senderId: "agent",
      content: "Absolutely! Would you like to schedule a tour this weekend?",
      sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  t2: [
    {
      id: "m4",
      senderId: "agent",
      content: "The AI estimate looks accurate based on recent comps in the area.",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
  t3: [
    {
      id: "m5",
      senderId: "agent",
      content: "Thanks for the recommendation!",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
};

interface ChatWindowProps {
  thread: ChatThread | null;
}

export function ChatWindow({ thread }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  const threadId = thread?.id;
  const displayMessages = threadId ? (messages.length ? messages : mockMessages[threadId] ?? []) : [];

  const handleSend = () => {
    if (!draft.trim() || !thread) return;
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      senderId: mockUser.id,
      content: draft.trim(),
      sentAt: new Date().toISOString(),
    };
    setMessages([...displayMessages, newMessage]);
    setDraft("");
  };

  if (!thread) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold">{thread.participantName}</h3>
        {thread.propertyTitle && (
          <p className="text-sm text-ai">{thread.propertyTitle}</p>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {displayMessages.map((msg) => {
          const isOwn = msg.senderId === mockUser.id;
          return (
            <div
              key={msg.id}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-4 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {format(new Date(msg.sentAt), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="icon" onClick={handleSend} disabled={!draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
