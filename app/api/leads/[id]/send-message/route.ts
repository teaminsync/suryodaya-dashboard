import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  // Ensure human takeover is on BEFORE sending - a human sending a message
  // through this dashboard must never be talked over by the AI on the
  // customer's next reply. This is enforced here, not left as something
  // the operator has to remember to toggle separately.
  const takeoverResponse = await fetch(
    `${baseUrl}/internal/leads/${id}/takeover`,
    {
      method: "POST",
      headers: {
        "X-Internal-Secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled: true }),
    }
  );

  if (!takeoverResponse.ok) {
    return NextResponse.json(
      { error: "Failed to enable takeover before sending" },
      { status: 502 }
    );
  }

  const sendResponse = await fetch(
    `${baseUrl}/internal/leads/${id}/send-message`,
    {
      method: "POST",
      headers: {
        "X-Internal-Secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!sendResponse.ok) {
    if (sendResponse.status >= 400 && sendResponse.status <= 499) {
      try {
        const errorData = await sendResponse.json();
        const response: { error?: string; message?: string } = {};
        if (typeof errorData.error === "string") {
          response.error = errorData.error;
        }
        if (typeof errorData.message === "string") {
          response.message = errorData.message;
        }
        return NextResponse.json(response, { status: sendResponse.status });
      } catch {
        return NextResponse.json(
          { error: "Failed to send message" },
          { status: 502 }
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 502 }
    );
  }

  const result = await sendResponse.json();
  return NextResponse.json(result);
}
