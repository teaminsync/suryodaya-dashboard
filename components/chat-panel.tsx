"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageItem } from "@/lib/queries";

export function ChatPanel({
  leadId,
  initialMessages,
  initialHumanTakeover,
}: {
  leadId: string;
  initialMessages: MessageItem[];
  initialHumanTakeover: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [humanTakeover, setHumanTakeover] = useState(initialHumanTakeover);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // If this effect was already cleaned up while we were awaiting the
      // session (e.g. React Strict Mode's dev-only double-invoke), bail out
      // here instead of creating a channel that nothing will ever clean up
      // correctly, and that would race against the next effect run's own
      // channel setup.
      if (cancelled) return;

      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`messages-${leadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `lead_id=eq.${leadId}`,
          },
          (payload) => {
            setMessages((current) => {
              if (current.some((m) => m.id === (payload.new as MessageItem).id)) {
                return current;
              }
              return [...current, payload.new as MessageItem];
            });
          }
        )
        .subscribe((status, err) => {
          console.log("[Realtime] Chat subscription status:", status);
          if (err) {
            console.error("[Realtime] Chat subscription error:", err);
          }
        });
    };

    setupSubscription();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      authListener.subscription.unsubscribe();
    };
  }, [leadId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (response.ok) {
        setInputText("");
        setHumanTakeover(true); // send-message always enables takeover server-side
      }
    } finally {
      setSending(false);
    }
  };

  const handleToggleTakeover = async (checked: boolean) => {
    setToggling(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/takeover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      });

      if (response.ok) {
        setHumanTakeover(checked);
      }
    } finally {
      setToggling(false);
    }
  };

  const senderLabel = (m: MessageItem) =>
    m.sender_type === "customer" ? "Customer" :
    m.sender_type === "ai" ? "AI" :
    m.sender_type === "human" ? "You" : "System";

  const messageBody = (m: MessageItem) => {
    if (m.message_type === "text") return m.body;
    if (m.message_type === "image") return "[Photo received - see Captures below]";
    if (m.message_type === "video") return "[Video received - see Captures below]";
    if (m.message_type === "interactive") return `[Selected: ${m.body}]`;
    if (m.message_type === "list") return "[Quick Options menu sent]";
    return m.body;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Conversation</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="takeover" className="text-sm">Human Takeover</Label>
          <Switch
            id="takeover"
            checked={humanTakeover}
            disabled={toggling}
            onCheckedChange={handleToggleTakeover}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 border rounded-md p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-3 flex ${m.direction === "inbound" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  m.direction === "inbound"
                    ? "bg-gray-100"
                    : m.sender_type === "ai"
                    ? "bg-blue-100"
                    : m.sender_type === "human"
                    ? "bg-green-100"
                    : "bg-gray-200"
                }`}
              >
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {senderLabel(m)}
                </p>
                <p>{messageBody(m)}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to send as yourself..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={sending || !inputText.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
