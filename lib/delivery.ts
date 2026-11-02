export interface DeliveryFailure {
  wamid: string;
  code: string;
  title: string | null;
  detail: string | null;
  failedAt: string | null;
}

export function deliveryReasonLabel(code: string, title: string | null): string {
  switch (code) {
    case "131047":
      return "The customer's 24-hour window had closed, so the message was not delivered";
    case "131026":
      return "WhatsApp reported the message as undeliverable";
    case "131049":
      return "WhatsApp chose not to deliver this message (customer engagement limits)";
    case "131056":
      return "Too many messages to this customer in a short time";
    default:
      if (title && title.trim() !== "") {
        return title;
      }
      return `Delivery failed (code ${code})`;
  }
}
