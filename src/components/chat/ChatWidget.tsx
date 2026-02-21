"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageCircle, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useJsonRenderMessage,
  Renderer,
  StateProvider,
  ActionProvider,
  VisibilityProvider,
  type DataPart,
} from "@json-render/react";
import { registry } from "@/lib/json-render/registry";

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-4 space-y-0.5">
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  function formatInline(s: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let last = 0;
    let match;
    while ((match = regex.exec(s)) !== null) {
      if (match.index > last) parts.push(s.slice(last, match.index));
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      last = regex.lastIndex;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.length === 1 ? parts[0] : parts;
  }

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={`br-${elements.length}`} className="h-1" />);
      } else {
        elements.push(<p key={`p-${elements.length}`}>{formatInline(trimmed)}</p>);
      }
    }
  }
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function ChatMessageBubble({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const { spec, text, hasSpec } = useJsonRenderMessage(
    message.parts as DataPart[]
  );

  if (message.role === "user") {
    if (!text) return null;
    return (
      <div className="text-sm rounded-lg px-3 py-2 max-w-[85%] ml-auto bg-primary text-primary-foreground">
        {text}
      </div>
    );
  }

  // Assistant message: show text + optional json-render spec
  if (!text && !hasSpec) return null;

  return (
    <div className="text-sm rounded-lg px-3 py-2 max-w-[85%] bg-muted space-y-2">
      {text && renderMarkdown(text)}
      {hasSpec && (
        <Renderer spec={spec} registry={registry} loading={isStreaming} />
      )}
    </div>
  );
}

const chatTransport = new DefaultChatTransport({ api: "/api/ai/chat" });

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [nudges, setNudges] = useState<
    { title: string; description: string; actionLabel?: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/ai/nudges")
        .then((r) => r.json())
        .then(setNudges)
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="rounded-t-xl h-[70vh] max-h-[70vh] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>Budget Assistant</SheetTitle>
          </SheetHeader>

          <StateProvider initialState={{}}>
            <ActionProvider
              handlers={{
                confirm_transaction: async () => {
                  await sendMessage({ text: "Confirmed: create transaction" });
                },
                confirm_budget_move: async () => {
                  await sendMessage({ text: "Confirmed: move budget" });
                },
                confirm_allocation: async () => {
                  await sendMessage({ text: "Confirmed: set allocation" });
                },
                apply_suggested_budget: async () => {
                  await sendMessage({
                    text: "Confirmed: apply suggested budget",
                  });
                },
                dismiss: async () => {
                  /* no-op, card dismissed via VisibilityProvider */
                },
              }}
            >
              <VisibilityProvider>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {nudges.length > 0 && (
                    <div className="space-y-2">
                      {nudges.map((nudge, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{nudge.title}</span>
                            <button
                              onClick={() =>
                                setNudges((prev) =>
                                  prev.filter((_, j) => j !== i)
                                )
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-muted-foreground">
                            {nudge.description}
                          </p>
                          {nudge.actionLabel && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={() => {
                                setNudges((prev) =>
                                  prev.filter((_, j) => j !== i)
                                );
                                setInput(nudge.title);
                              }}
                            >
                              {nudge.actionLabel}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                      Ask me about your budget, spending, or accounts.
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <ChatMessageBubble
                      key={m.id}
                      message={m}
                      isStreaming={
                        status === "streaming" && i === messages.length - 1
                      }
                    />
                  ))}
                  {isLoading &&
                    messages[messages.length - 1]?.role === "user" && (
                      <div className="bg-muted text-sm rounded-lg px-3 py-2 max-w-[85%]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>
              </VisibilityProvider>
            </ActionProvider>
          </StateProvider>

          <form onSubmit={handleSubmit} className="px-4 py-3 border-t flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-sm bg-transparent outline-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
