export interface MoveQuote {
  hasCaptures: boolean;
  roomCount: number;
  captureCount: number;
  totalEstimatedCubicFeet: number;
  totalEstimatedWeightKg: number;
  message: string;
}

export async function getMoveQuote(leadId: string): Promise<MoveQuote | null> {
  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  try {
    const response = await fetch(`${baseUrl}/internal/leads/${leadId}/quote`, {
      headers: { "X-Internal-Secret": secret },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[InternalAPI] Quote fetch failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[InternalAPI] Quote request failed:", error);
    return null;
  }
}

export interface OutreachInfo {
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
    captured_at: string;
  }>;
}

export async function getOutreach(leadId: string): Promise<OutreachInfo | null> {
  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  try {
    const response = await fetch(`${baseUrl}/internal/leads/${leadId}/outreach`, {
      headers: { "X-Internal-Secret": secret },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[InternalAPI] Outreach fetch failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[InternalAPI] Outreach request failed:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
