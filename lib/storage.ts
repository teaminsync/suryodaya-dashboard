// Generates a short-lived signed URL for a private Supabase Storage object.
// Server-side only - uses the secret key, must never run in a client component
// or be exposed to the browser.
export async function createSignedUrl(
  path: string,
  expiresInSeconds: number = 600
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "move-media";

  try {
    const response = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          apikey: secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      }
    );

    if (!response.ok) {
      console.error("[Storage] Failed to create signed URL:", await response.text());
      return null;
    }

    const data = await response.json();
    console.debug("[Storage] Signed URL response shape:", JSON.stringify(data));
    // data.signedURL is expected to be a relative path with a token query
    // param - VERIFY this against the actual response (the debug log above)
    // rather than assuming, then prefix with the storage base URL.
    return `${supabaseUrl}/storage/v1${data.signedURL}`;
  } catch (error) {
    console.error("[Storage] Signed URL request failed:", error);
    return null;
  }
}
