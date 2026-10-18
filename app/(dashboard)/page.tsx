import { getLeads } from "@/lib/queries";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/components/source-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Enquiries ({leads.length})</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Move</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                  {lead.contact_display_name || lead.contact_name || "Unknown"}
                </Link>
                {lead.contact_enquiry_count > 1 && (
                  <div className="text-xs text-gray-500">
                    {lead.contact_enquiry_count} enquiries from this contact
                  </div>
                )}
              </TableCell>
              <TableCell>{lead.whatsapp_number}</TableCell>
              <TableCell><Badge>{lead.status}</Badge></TableCell>
              <TableCell><SourceBadge source={lead.source} /></TableCell>
              <TableCell>
                {lead.move_type
                  ? `${lead.move_type}${lead.origin ? ` (${lead.origin} -> ${lead.destination || "?"})` : ""}`
                  : "-"}
              </TableCell>
              <TableCell className="space-x-1">
                {lead.escalated && <Badge variant="destructive">Escalated</Badge>}
                {lead.human_takeover && <Badge variant="secondary">Human Active</Badge>}
                {lead.opted_out && <Badge variant="destructive">Opted out</Badge>}
                {lead.closed_reason === "declined_followup" && <Badge variant="secondary">Declined</Badge>}
                {lead.closed_at && lead.closed_reason !== "declined_followup" && <Badge variant="secondary">Closed</Badge>}
              </TableCell>
              <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
