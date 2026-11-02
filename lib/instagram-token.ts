export interface InstagramTokenStatus {
  ok: boolean;
  configured: boolean;
  source: "database" | "env";
  level: "unknown" | "ok" | "warning" | "critical" | "expired";
  daysLeft: number | null;
  expiresAt: string | null;
  refreshedAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
}

export function tokenHeadline(s: InstagramTokenStatus): string {
  if (!s.configured) {
    return "Instagram is not connected";
  }
  
  if (s.level === "expired") {
    return "The Instagram access token has expired";
  }
  
  if ((s.level === "critical" || s.level === "warning" || s.level === "ok") && s.daysLeft !== null) {
    const dayWord = s.daysLeft === 1 ? "day" : "day(s)";
    return `The Instagram access token is valid for about ${s.daysLeft} more ${dayWord}`;
  }
  
  return "Token expiry is not known yet (it is checked automatically)";
}

export function shouldShowBanner(s: InstagramTokenStatus | null): boolean {
  if (!s) return false;
  if (!s.configured) return false;
  return s.level === "warning" || s.level === "critical" || s.level === "expired";
}

export function bannerText(s: InstagramTokenStatus): string {
  if (s.level === "expired") {
    return "Instagram messaging will stop working: the access token has expired. Create a new token in the Meta app dashboard and put it in INSTAGRAM_ACCESS_TOKEN.";
  }
  
  if (s.level === "critical" || s.level === "warning") {
    return `Instagram token expires in about ${s.daysLeft} day(s). Automatic refresh may be failing; open Settings.`;
  }
  
  return "";
}

export function refreshErrorMessage(error: string | null | undefined): string {
  if (!error || error.trim() === "") {
    return "Something went wrong. Please try again.";
  }
  return error;
}
