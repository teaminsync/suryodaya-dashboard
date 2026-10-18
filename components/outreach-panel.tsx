"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface OutreachPanelProps {
  leadId: string;
  leadLabel: string;
  outreach: null | {
    status: {
      action: string;
      reason: string;
      consent: "granted" | "withdrawn" | "unknown";
      windowOpen: boolean;
      closed: boolean;
      clickToChatLink: string | null;
    };
    capabilities: {
      canSendFollowup: boolean;
      canRecordConsent: boolean;
      canCopyLink: boolean;
    };
    history: Array<{
      status: string;
      source: string;
      wording: string | null;
      when: string;
    }>;
  };
}

export function OutreachPanel({ leadId, leadLabel, outreach }: OutreachPanelProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copyText, setCopyText] = useState("Copy link");

  if (!outreach) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follow-up outreach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Outreach status is unavailable right now (the messaging service could not be reached).</p>
        </CardContent>
      </Card>
    );
  }

  const { status, capabilities, history } = outreach;

  const consentBadge = () => {
    if (status.consent === "granted") return <Badge className="bg-green-600">Consent recorded</Badge>;
    if (status.consent === "withdrawn") return <Badge variant="destructive">Opted out</Badge>;
    return <Badge variant="secondary">No consent recorded</Badge>;
  };

  const actionMessage = () => {
    if (status.action === "offer_click_to_chat") {
      return "No recorded consent. Ask the customer to tap the link below (that starts the chat from their side), or record consent after speaking to them.";
    }
    if (status.action === "send_template") {
      return "Consent is recorded and the 24-hour window is closed. You can send the approved follow-up template.";
    }
    if (status.action === "reply_freeform") {
      return "The customer messaged within the last 24 hours. Reply in the chat below; no template is needed.";
    }
    if (status.action === "needs_human_call") {
      return "There is no phone number on file. Call or email the customer.";
    }
    if (status.action === "blocked_opted_out") {
      return "The customer opted out. Do not message them. Only the customer can turn follow-ups back on.";
    }
    return status.reason;
  };

  const handleSendFollowup = async () => {
    if (!window.confirm(`Send the approved follow-up template to ${leadLabel}?`)) return;

    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/outreach/followup`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.ok) {
        setResult({ type: "success", message: "Done" });
        router.refresh();
      } else {
        setResult({ type: "error", message: formatError(data.code, data.reason) });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordConsent = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/outreach/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await response.json();

      if (data.ok) {
        setResult({ type: "success", message: "Done" });
        setNote("");
        router.refresh();
      } else {
        setResult({ type: "error", message: formatError(data.code, data.reason) });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!status.clickToChatLink) return;

    try {
      await navigator.clipboard.writeText(status.clickToChatLink);
      setCopyText("Copied");
      setTimeout(() => setCopyText("Copy link"), 2000);
    } catch {
      setResult({ type: "error", message: "Select the link and copy it manually" });
    }
  };

  const formatError = (code: string, reason?: string) => {
    if (code === "note_required") return "Please enter a note describing how the customer agreed.";
    if (code === "note_too_long") return "The note is too long (400 characters maximum).";
    if (code === "opted_out") return "The customer has opted out. Consent cannot be recorded.";
    if (code === "lead_closed") return "This enquiry is closed.";
    if (code === "not_allowed") return reason || "Not allowed";
    if (code === "lead_not_found") return "Enquiry not found.";
    if (code === "no_contact") return "This enquiry has no contact on record.";
    if (code === "send_failed") {
      const trimmedReason = reason ? reason.slice(0, 200) : "";
      return `WhatsApp did not accept the message: ${trimmedReason}`;
    }
    return "Something went wrong. Please try again.";
  };

  const sourceLabel = (source: string) => {
    if (source === "staff_recorded") return "Recorded by staff";
    if (source === "template_reply") return "Customer tapped Yes on the follow-up";
    if (source === "customer_stop") return "Customer sent STOP";
    return source;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up outreach</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {consentBadge()}
          <Badge variant="secondary">
            {status.windowOpen ? "24-hour window open" : "24-hour window closed"}
          </Badge>
          {status.closed && <Badge variant="secondary">Enquiry closed</Badge>}
        </div>

        <p className="text-sm">{actionMessage()}</p>

        {capabilities.canSendFollowup && (
          <div>
            <Button onClick={handleSendFollowup} disabled={loading}>
              Send follow-up template
            </Button>
          </div>
        )}

        {capabilities.canRecordConsent && (
          <div className="space-y-2">
            <Label htmlFor="consent-note">Record consent</Label>
            <Textarea
              id="consent-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did the customer agree? e.g. agreed on a call on 18 Oct"
              maxLength={400}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{note.length}/400</span>
              <Button onClick={handleRecordConsent} disabled={loading || !note.trim()}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {capabilities.canCopyLink && status.clickToChatLink && (
          <div className="space-y-2">
            <Label htmlFor="click-to-chat">Click-to-chat link</Label>
            <div className="flex gap-2">
              <Input
                id="click-to-chat"
                value={status.clickToChatLink}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleCopyLink} disabled={loading}>
                {copyText}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <p className={`text-sm ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {result.message}
          </p>
        )}

        <div className="space-y-2 border-t pt-4 mt-4">
          <h4 className="font-semibold text-sm">Consent history</h4>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="text-sm border-l-2 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={item.status === "granted" ? "default" : "destructive"}>
                      {item.status}
                    </Badge>
                    <span className="text-gray-600">{sourceLabel(item.source)}</span>
                    <span className="text-gray-500 text-xs">{item.when}</span>
                  </div>
                  {item.wording && <p className="text-gray-700">{item.wording}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No consent history yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
