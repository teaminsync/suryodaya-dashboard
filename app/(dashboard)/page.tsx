import { getLeads } from "@/lib/queries";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      <h2 className="text-2xl font-bold mb-4">Leads ({leads.length})</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>WhatsApp Number</TableHead>
            <TableHead>Status</TableHead>
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
                  {lead.contact_name || "Unknown"}
                </Link>
              </TableCell>
              <TableCell>{lead.whatsapp_number}</TableCell>
              <TableCell><Badge>{lead.status}</Badge></TableCell>
              <TableCell>
                {lead.move_type
                  ? `${lead.move_type}${lead.origin ? ` (${lead.origin} -> ${lead.destination || "?"})` : ""}`
                  : "-"}
              </TableCell>
              <TableCell className="space-x-1">
                {lead.escalated && <Badge variant="destructive">Escalated</Badge>}
                {lead.human_takeover && <Badge variant="secondary">Human Active</Badge>}
              </TableCell>
              <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
