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
