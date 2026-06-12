"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

type Msg = { id: number; role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  id: 0,
  role: "assistant",
  content:
    "Hi! I'm your AI real estate assistant. Ask me about properties, pricing, neighborhoods, or the buying and selling process.",
};

export function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  // Avoid hydration mismatch: the auth store is persisted client-side.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  if (!mounted) return null;

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { id: idRef.current++, role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.assistant(question);
      setMessages((m) => [...m, { id: idRef.current++, role: "assistant", content: res.answer }]);
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.status === 401 || err.status === 403
            ? "Please sign in again to use the assistant."
            : err.message
          : "Something went wrong. Please try again.";
      setMessages((m) => [...m, { id: idRef.current++, role: "assistant", content: text }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[28rem] max-h-[70vh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-card-hover">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-ai/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ai/15 text-ai">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Powered by Claude</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isAuthenticated ? (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Ask about properties, prices…"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ai text-ai-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ai/10 text-ai">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">Sign in to chat with the AI assistant</p>
              <p className="text-xs text-muted-foreground">
                Get instant answers about properties, pricing, and your matches.
              </p>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex h-9 items-center rounded-lg bg-ai px-4 text-sm font-medium text-ai-foreground transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ai text-ai-foreground shadow-card-hover transition-transform duration-200 ease-premium hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </>
  );
}
