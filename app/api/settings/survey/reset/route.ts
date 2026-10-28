import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isAllowedOrigin } from "@/lib/origin";

export async function POST(request: NextRequest) {
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

  const baseUrl = process.env.EXPRESS_INTERNAL_API_URL!;
  const secret = process.env.INTERNAL_API_SECRET!;

  try {
    const response = await fetch(`${baseUrl}/internal/survey-settings/reset`, {
      method: "POST",
      headers: {
        "X-Internal-Secret": secret,
        "Content-Type": "application/json",
      },
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, code: "backend_unreachable", errors: ["The settings service could not be reached"] },
        { status: 502 }
      );
    }

    const result = await response.json();
    
    if (response.status === 200) {
      return NextResponse.json(result, { status: response.status });
    }
    
    return NextResponse.json(
      { ok: false, code: "backend_unreachable", errors: ["The settings service could not be reached"] },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, code: "backend_unreachable", errors: ["The settings service could not be reached"] },
      { status: 502 }
    );
  }
}
