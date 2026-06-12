"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { mockUser } from "@/lib/mock-data";

export interface ChatThread {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  propertyTitle?: string;
}

const mockThreads: ChatThread[] = [
  {
    id: "t1",
    participantName: "Sarah Chen",
    participantAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    lastMessage: "I'd love to schedule a tour this weekend!",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 2,
    propertyTitle: "Modern Craftsman with Mountain Views",
  },
  {
    id: "t2",
    participantName: "Mike Torres",
    lastMessage: "The AI estimate looks accurate based on comps.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unreadCount: 0,
    propertyTitle: "Downtown Luxury Condo",
  },
  {
    id: "t3",
    participantName: "Lisa Park",
    lastMessage: "Thanks for the recommendation!",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unreadCount: 0,
  },
];

interface ChatListProps {
  selectedId?: string;
  onSelect: (thread: ChatThread) => void;
}

export function ChatList({ selectedId, onSelect }: ChatListProps) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b p-4">
        <h2 className="font-semibold">Messages</h2>
        <p className="text-sm text-muted-foreground">
          {mockUser.firstName}&apos;s conversations
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {mockThreads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect(thread)}
            className={cn(
              "flex w-full gap-3 border-b p-4 text-left transition-colors hover:bg-muted/50",
              selectedId === thread.id && "bg-muted"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {thread.participantAvatar ? (
                <img
                  src={thread.participantAvatar}
                  alt={thread.participantName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                thread.participantName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{thread.participantName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.lastMessageAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {thread.propertyTitle && (
                <p className="truncate text-xs text-ai">{thread.propertyTitle}</p>
              )}
              <p className="truncate text-sm text-muted-foreground">
                {thread.lastMessage}
              </p>
            </div>
            {thread.unreadCount > 0 && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ai text-xs font-bold text-ai-foreground">
                {thread.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { mockThreads };
