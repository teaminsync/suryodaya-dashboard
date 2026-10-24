export function alertEventLabel(type: string | null | undefined): string {
  if (!type) return "Unknown";
  
  switch (type) {
    case "booking_confirmed":
      return "Survey booked";
    case "human_requested":
      return "Customer wants a human";
    case "needs_followup":
      return "Needs team follow-up";
    default:
      return type;
  }
}

export function alertChannelLabel(channel: string | null | undefined): string {
  if (!channel) return channel || "";
  
  switch (channel) {
    case "email":
      return "Email";
    case "whatsapp":
      return "WhatsApp";
    default:
      return channel;
  }
}

export type AlertStatusTone = "good" | "bad" | "neutral";

export function alertStatusTone(status: string | null | undefined): AlertStatusTone {
  if (!status) return "neutral";
  
  switch (status) {
    case "sent":
      return "good";
    case "failed":
      return "bad";
    default:
      return "neutral";
  }
}
