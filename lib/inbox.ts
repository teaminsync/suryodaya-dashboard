interface Lead {
  id: string;
  contact_display_name: string | null;
  contact_name: string | null;
  contact_instagram_username: string | null;
  whatsapp_number: string;
  contact_phone_e164: string | null;
  origin: string | null;
  destination: string | null;
  move_type: string | null;
  source: string | null;
  status: string;
  last_direction: "inbound" | "outbound" | null;
  closed_at: string | null;
  escalated: boolean;
  human_takeover: boolean;
  opted_out: boolean;
  closed_reason: string | null;
  contact_enquiry_count: number;
  created_at: string;
}

export function isAwaitingReply(lead: Lead): boolean {
  return lead.last_direction === "inbound" && lead.closed_at == null;
}

export function filterLeads(
  leads: Lead[],
  filters: {
    q?: string;
    source?: string;
    status?: string;
    awaiting?: boolean;
  }
): Lead[] {
  const q = (filters.q ?? "").trim().toLowerCase();
  const source = (filters.source ?? "").trim();
  const status = (filters.status ?? "").trim();
  const awaiting = filters.awaiting ?? false;

  return leads.filter((lead) => {
    if (q) {
      const displayName = (lead.contact_display_name ?? "").toLowerCase();
      const contactName = (lead.contact_name ?? "").toLowerCase();
      const instagramUsername = (lead.contact_instagram_username ?? "")
        .replace(/^@/, "")
        .toLowerCase();
      const qNormalized = q.replace(/^@/, "");
      const whatsappNumber = lead.whatsapp_number;
      const phoneE164 = lead.contact_phone_e164 ?? "";
      const origin = (lead.origin ?? "").toLowerCase();
      const destination = (lead.destination ?? "").toLowerCase();
      const moveType = (lead.move_type ?? "").toLowerCase();

      const matchesText =
        displayName.includes(q) ||
        contactName.includes(q) ||
        instagramUsername.includes(qNormalized) ||
        origin.includes(q) ||
        destination.includes(q) ||
        moveType.includes(q);

      const digitsOnly = q.replace(/\D/g, "");
      const matchesPhone =
        digitsOnly.length >= 3 &&
        phoneE164.replace(/\D/g, "").includes(digitsOnly);

      const matchesWhatsappNumber = whatsappNumber.includes(q);

      if (!matchesText && !matchesPhone && !matchesWhatsappNumber) return false;
    }

    if (source && lead.source !== source) return false;
    if (status && lead.status !== status) return false;
    if (awaiting && !isAwaitingReply(lead)) return false;

    return true;
  });
}

export function countBy(
  leads: Lead[],
  field: "source" | "status"
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const value = lead[field] ?? "unknown";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.value.localeCompare(b.value);
    });
}

export function buildInboxHref(
  current: {
    q?: string;
    source?: string;
    status?: string;
    awaiting?: boolean;
  },
  overrides: Partial<{
    q: string;
    source: string;
    status: string;
    awaiting: boolean;
  }>
): string {
  const merged = { ...current, ...overrides };

  const q = (merged.q ?? "").trim();
  const source = (merged.source ?? "").trim();
  const status = (merged.status ?? "").trim();
  const awaiting = merged.awaiting ?? false;

  const params: string[] = [];

  if (q) params.push(`q=${encodeURIComponent(q)}`);
  if (source) params.push(`source=${encodeURIComponent(source)}`);
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (awaiting) params.push("awaiting=1");

  return params.length > 0 ? `/?${params.join("&")}` : "/";
}
