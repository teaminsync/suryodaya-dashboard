"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InstagramTokenStatus } from "@/lib/internal-api";
import { tokenHeadline, refreshErrorMessage } from "@/lib/instagram-token";
import { formatWhen } from "@/lib/automation";

interface InstagramTokenCardProps {
  initial: InstagramTokenStatus;
}

export function InstagramTokenCard({ initial }: InstagramTokenCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleRefresh = async () => {
    if (!window.confirm("Refresh the Instagram access token now?")) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/integrations/instagram/refresh", {
        method: "POST",
      });

      const data = await response.json();

      if (data.ok) {
        setResult({ type: "success", message: "Refreshed" });
        router.refresh();
      } else {
        setResult({ type: "error", message: refreshErrorMessage(data.error) });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const badgeClass =
    initial.level === "ok"
      ? "bg-gray-100 text-gray-700"
      : initial.level === "warning"
        ? "bg-amber-100 text-amber-800"
        : initial.level === "critical" || initial.level === "expired"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">{tokenHeadline(initial)}</span>
          <Badge className={badgeClass}>{initial.level}</Badge>
        </div>
        
        {initial.refreshedAt && (
          <div className="text-sm text-gray-600">
            Last refreshed: {formatWhen(initial.refreshedAt)}
          </div>
        )}
        
        {initial.expiresAt && (
          <div className="text-sm text-gray-600">
            Expires: {formatWhen(initial.expiresAt)}
          </div>
        )}
        
        {initial.lastError && (
          <div className="text-xs text-red-600">
            {initial.lastError}
          </div>
        )}

        {result && (
          <p className={`text-sm ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {result.message}
          </p>
        )}

        <Button onClick={handleRefresh} disabled={loading}>
          Refresh now
        </Button>
      </CardContent>
    </Card>
  );
}
