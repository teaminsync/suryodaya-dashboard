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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "note_required" }, { status: 400 });
  }

  const fields = body !== null && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const note = typeof fields.note === "string" ? fields.note : undefined;

  if (!note) {
    return NextResponse.json({ ok: false, code: "note_required" }, { status: 400 });
  }

  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  try {
    const response = await fetch(`${baseUrl}/internal/leads/${id}/outreach/consent`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note, staff: user.email }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, code: "backend_unreachable", reason: "The messaging service could not be reached" }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, code: "backend_unreachable", reason: "The messaging service could not be reached" }, { status: 502 });
  }
}
