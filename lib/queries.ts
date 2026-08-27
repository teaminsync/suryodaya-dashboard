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
}

export async function getLeads(): Promise<LeadListItem[]> {
  return sql<LeadListItem[]>`
    SELECT id, whatsapp_number, contact_name, status, move_type, origin,
           destination, escalated, human_takeover, created_at
    FROM leads
    ORDER BY created_at DESC
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
