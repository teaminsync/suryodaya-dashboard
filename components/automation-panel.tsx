"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AutomationInfo } from "@/lib/internal-api";
import {
  statusLabel,
  statusTone,
  reasonLabel,
  channelLabel,
  formatWhen,
  timeUntil,
  cancelErrorMessage,
} from "@/lib/automation";

interface AutomationPanelProps {
  leadId: string;
  initial: AutomationInfo;
}

export function AutomationPanel({ leadId, initial }: AutomationPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCancel = async (kind: string, ref: string) => {
    if (!window.confirm("Cancel this scheduled message?")) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/automation/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ref }),
      });

      const data = await response.json();

      if (response.status === 200 && data.ok) {
        setResult({ type: "success", message: "Cancelled" });
        router.refresh();
      } else {
        setResult({ type: "error", message: cancelErrorMessage(data.code) });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getBadge = () => {
    if (!initial.enabled) {
      return <Badge variant="secondary">Automation off</Badge>;
    }
    if (initial.dryRun) {
      return <Badge className="bg-amber-100 text-amber-800">Dry run (nothing is sent)</Badge>;
    }
    return <Badge>Automation on</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>{getBadge()}</div>

        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold text-sm">Up next</h4>
          {initial.upcoming.length > 0 ? (
            <div className="space-y-2">
              {initial.upcoming.map((item, index) => {
                const now = new Date();
                return (
                  <div key={index} className="text-sm border-l-2 pl-3 py-1 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-gray-600 text-xs">
                        {formatWhen(item.dueAt)} • {timeUntil(item.dueAt, now)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(item.kind, item.ref)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nothing scheduled</p>
          )}
        </div>

        {result && (
          <p className={`text-sm ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {result.message}
          </p>
        )}

        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold text-sm">History</h4>
          {initial.history.length > 0 ? (
            <div className="space-y-2">
              {initial.history.map((item) => {
                const tone = statusTone(item.status);
                const badgeClass =
                  tone === "good"
                    ? "bg-green-100 text-green-800"
                    : tone === "bad"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700";

                return (
                  <div key={item.id} className="text-sm border-l-2 pl-3 py-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.label}</span>
                      <Badge className={badgeClass}>{statusLabel(item.status)}</Badge>
                    </div>
                    {item.channel && (
                      <div className="text-xs text-gray-600 mt-1">
                        {channelLabel(item.channel, item.templateName)}
                      </div>
                    )}
                    {item.reason && (
                      <div className="text-xs text-gray-600 mt-1">
                        {reasonLabel(item.reason)}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {formatWhen(item.processedAt ?? item.dueAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No automated messages yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
