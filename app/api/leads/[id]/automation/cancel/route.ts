import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isAllowedOrigin } from "@/lib/origin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (
    !isAllowedOrigin({
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const fields = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  
  if (typeof fields.kind !== "string" || typeof fields.ref !== "string") {
    return NextResponse.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  try {
    const response = await fetch(`${baseUrl}/internal/leads/${encodeURIComponent(id)}/automation/cancel`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind: fields.kind, ref: fields.ref, staff: user.email }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, code: "backend_unreachable" }, { status: 502 });
    }

    const result = await response.json();
    
    if (response.status === 200 || response.status === 400 || response.status === 404 || response.status === 409) {
      return NextResponse.json(result, { status: response.status });
    }
    
    return NextResponse.json({ ok: false, code: "backend_unreachable" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, code: "backend_unreachable" }, { status: 502 });
  }
}
