export interface AutomationUpcoming {
  kind: string;
  ref: string;
  label: string;
  dueAt: string;
  expiresAt: string;
}

export interface AutomationHistoryRow {
  id: string;
  kind: string;
  label: string;
  status: string;
  reason: string | null;
  channel: string | null;
  templateName: string | null;
  dueAt: string;
  processedAt: string | null;
}

export interface AutomationInfo {
  ok: boolean;
  enabled: boolean;
  dryRun: boolean;
  upcoming: AutomationUpcoming[];
  history: AutomationHistoryRow[];
}

export function statusLabel(status: string): string {
  if (status === "sent") return "Sent";
  if (status === "skipped") return "Skipped";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  if (status === "claimed") return "Interrupted (not confirmed sent)";
  return "Unknown";
}

export function statusTone(status: string): "good" | "bad" | "neutral" {
  if (status === "sent") return "good";
  if (status === "failed" || status === "claimed") return "bad";
  return "neutral";
}

export function reasonLabel(reason: string | null): string {
  if (reason === null) return "";
  if (reason === "opted_out") return "Customer opted out";
  if (reason === "no_phone") return "No phone number";
  if (reason === "no_consent") return "No recorded consent";
  if (reason === "window_open") return "Customer window is open (template not needed)";
  if (reason === "window_closed") return "Customer window is closed";
  if (reason === "expired") return "Too late to send";
  if (reason === "quiet_hours") return "Outside sending hours";
  if (reason.startsWith("cancelled by ")) return reason;
  return reason.slice(0, 120);
}

export function channelLabel(channel: string | null, templateName: string | null): string {
  if (channel === "freeform") return "WhatsApp message";
  if (channel === "template") return `Template: ${templateName ?? "unknown"}`;
  return "";
}

export function formatWhen(iso: string | null): string {
  if (iso === null) return "-";
  
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";
  
  const utcTime = date.getTime();
  const istTime = utcTime + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istTime);
  
  const day = istDate.getUTCDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  
  let hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  const minutesPadded = minutes.toString().padStart(2, "0");
  
  return `${day} ${month} ${year}, ${hours}:${minutesPadded} ${ampm}`;
}

export function timeUntil(iso: string, now: Date): string {
  const target = new Date(iso);
  if (isNaN(target.getTime())) return "-";
  
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) return "due now";
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffMinutes < 60) {
    return `in ${diffMinutes} min`;
  }
  
  const remainingMinutes = diffMinutes % 60;
  return `in ${diffHours} h ${remainingMinutes} min`;
}

export function cancelErrorMessage(code: string | undefined): string {
  if (code === "not_cancellable") return "This message can no longer be cancelled";
  if (code === "already_processed") return "This message was already handled";
  if (code === "not_found") return "Lead not found";
  if (code === "invalid") return "Invalid request";
  return "Something went wrong. Please try again.";
}
