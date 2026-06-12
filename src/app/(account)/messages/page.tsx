"use client";

import { useState } from "react";
import {
  ChatList,
  ChatThread,
  mockThreads,
} from "@/components/messaging/chat-list";
import { ChatWindow } from "@/components/messaging/chat-window";

export default function MessagesPage() {
  const [selected, setSelected] = useState<ChatThread | null>(mockThreads[0]);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="w-full max-w-sm shrink-0">
        <ChatList
          selectedId={selected?.id}
          onSelect={setSelected}
        />
      </div>
      <ChatWindow thread={selected} />
    </div>
  );
}
