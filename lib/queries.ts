import sql from "./db";

export interface LeadListItem {
  id: string;
  whatsapp_number: string;
  contact_name: string | null;
  status: string;
  move_type: string | null;
  origin: string | null;
  destination: string | null;
  escalated: boolean;
  human_takeover: boolean;
  created_at: string;
  source: string | null;
  contact_id: string | null;
  contact_display_name: string | null;
  contact_phone_e164: string | null;
  contact_enquiry_count: number;
  opted_out: boolean;
  closed_at: string | null;
  closed_reason: string | null;
  contact_instagram_username: string | null;
}

export async function getLeads(): Promise<LeadListItem[]> {
  return sql<LeadListItem[]>`
    SELECT l.id, l.whatsapp_number, l.contact_name, l.status, l.move_type, l.origin,
           l.destination, l.escalated, l.human_takeover, l.created_at, l.source, l.contact_id,
           c.display_name AS contact_display_name, c.phone_e164 AS contact_phone_e164,
           c.instagram_username AS contact_instagram_username,
           (SELECT count(*)::int FROM leads l2 WHERE l2.contact_id IS NOT NULL AND l2.contact_id = l.contact_id) AS contact_enquiry_count,
           l.closed_at, l.closed_reason,
           COALESCE((SELECT cs.status = 'withdrawn' FROM consents cs WHERE cs.contact_id = l.contact_id AND cs.channel = 'whatsapp' AND cs.scope = 'follow_up' AND cs.status IN ('granted', 'withdrawn') ORDER BY cs.captured_at DESC, cs.created_at DESC LIMIT 1), false) AS opted_out
    FROM leads l
    LEFT JOIN contacts c ON c.id = l.contact_id
    ORDER BY l.created_at DESC
  `;
}

export interface LeadDetail {
  id: string;
  whatsapp_number: string;
  contact_name: string | null;
  status: string;
  move_type: string | null;
  origin: string | null;
  destination: string | null;
  urgency: string | null;
  has_special_items: boolean;
  special_items: string | null;
  estimated_volume: string | null;
  requires_packing: boolean;
  escalated: boolean;
  escalated_at: string | null;
  human_takeover: boolean;
  raw_enquiry_text: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  contact_id: string | null;
  closed_at: string | null;
  closed_reason: string | null;
}

export async function getLeadById(id: string): Promise<LeadDetail | undefined> {
  const result = await sql<LeadDetail[]>`SELECT * FROM leads WHERE id = ${id}`;
  return result[0];
}

export interface MediaCaptureItem {
  id: string;
  wamid: string;
  media_type: string;
  storage_path: string | null;
  asset_type: string | null;
  suggested_room_label: string | null;
  items: string;
  total_estimated_cubic_feet: number;
  total_estimated_weight_kg: number;
  packing_complexity: string | null;
  special_handling_notes: string;
  confidence: string | null;
  created_at: string;
}

export async function getMediaCapturesForLead(leadId: string): Promise<MediaCaptureItem[]> {
  return sql<MediaCaptureItem[]>`
    SELECT id, wamid, media_type, storage_path, asset_type, suggested_room_label,
           items, total_estimated_cubic_feet, total_estimated_weight_kg,
           packing_complexity, special_handling_notes, confidence, created_at
    FROM media_captures
    WHERE lead_id = ${leadId}
    ORDER BY created_at ASC
  `;
}

export interface MessageItem {
  id: string;
  lead_id: string;
  wamid: string | null;
  direction: "inbound" | "outbound";
  sender_type: "customer" | "ai" | "system" | "human";
  message_type: "text" | "image" | "video" | "interactive" | "list";
  body: string | null;
  media_capture_id: string | null;
  channel: string;
  created_at: string;
}

export async function getMessagesForLead(leadId: string): Promise<MessageItem[]> {
  return sql<MessageItem[]>`
    SELECT id, lead_id, wamid, direction, sender_type, message_type, body,
           media_capture_id, channel, created_at
    FROM messages
    WHERE lead_id = ${leadId}
    ORDER BY created_at ASC
  `;
}

export interface EnquirySummary {
  id: string;
  status: string;
  source: string | null;
  move_type: string | null;
  origin: string | null;
  destination: string | null;
  created_at: string;
  updated_at: string;
}

export async function getEnquiriesForContact(contactId: string): Promise<EnquirySummary[]> {
  return sql<EnquirySummary[]>`
    SELECT id, status, source, move_type, origin, destination, created_at, updated_at
    FROM leads
    WHERE contact_id = ${contactId}
    ORDER BY created_at DESC
  `;
}

export interface ContactInfo {
  id: string;
  phone_e164: string | null;
  display_name: string | null;
  instagram_username: string | null;
}

export async function getContactById(id: string): Promise<ContactInfo | undefined> {
  const result = await sql<ContactInfo[]>`SELECT id, phone_e164, display_name, instagram_username FROM contacts WHERE id = ${id}`;
  return result[0];
}

export interface TouchpointItem {
  id: string;
  source: string;
  external_ref: string | null;
  received_at: string;
}

export async function getTouchpointsForLead(leadId: string): Promise<TouchpointItem[]> {
  return sql<TouchpointItem[]>`
    SELECT id, source, external_ref, received_at
    FROM touchpoints
    WHERE lead_id = ${leadId}
    ORDER BY received_at ASC
  `;
}
