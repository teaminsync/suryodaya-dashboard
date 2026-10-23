import { getLeads } from "@/lib/queries";
import { contactLabel } from "@/lib/contact-label";
import { filterLeads, countBy, buildInboxHref, isAwaitingReply } from "@/lib/inbox";
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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const source = typeof params.source === "string" ? params.source : "";
  const status = typeof params.status === "string" ? params.status : "";
  const awaiting = params.awaiting === "1" || params.awaiting === "true";

  const allLeads = await getLeads();
  const filteredLeads = filterLeads(allLeads, { q, source, status, awaiting });

  const sourceCounts = countBy(allLeads, "source");
  const statusCounts = countBy(allLeads, "status");
  const awaitingCount = allLeads.filter((lead) => isAwaitingReply(lead)).length;

  const currentFilters = { q, source, status, awaiting };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Enquiries ({filteredLeads.length} of {allLeads.length})
      </h2>

      <form method="GET" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, route..."
          className="border rounded px-3 py-2 flex-1"
        />
        {source && <input type="hidden" name="source" value={source} />}
        {status && <input type="hidden" name="status" value={status} />}
        {awaiting && <input type="hidden" name="awaiting" value="1" />}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={buildInboxHref(currentFilters, { source: "", status: "" })}
          className={`px-3 py-1 rounded text-sm ${
            !source && !status
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </Link>
        {sourceCounts.map((sc) => (
          <Link
            key={sc.value}
            href={buildInboxHref(currentFilters, { source: sc.value })}
            className={`px-3 py-1 rounded text-sm ${
              source === sc.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {sc.value} ({sc.count})
          </Link>
        ))}
        <div className="w-full"></div>
        {statusCounts.map((st) => (
          <Link
            key={st.value}
            href={buildInboxHref(currentFilters, { status: st.value })}
            className={`px-3 py-1 rounded text-sm ${
              status === st.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {st.value} ({st.count})
          </Link>
        ))}
        <div className="w-full"></div>
        <Link
          href={buildInboxHref(currentFilters, { awaiting: !awaiting })}
          className={`px-3 py-1 rounded text-sm ${
            awaiting
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Awaiting reply ({awaitingCount})
        </Link>
      </div>

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
          {filteredLeads.map((lead) => {
            const label = contactLabel({
              source: lead.source,
              display_name: lead.contact_display_name,
              instagram_username: lead.contact_instagram_username,
              contact_name: lead.contact_name,
            });
            const awaiting = isAwaitingReply(lead);
            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                    {label.primary}
                  </Link>
                  {label.secondary && (
                    <div className="text-xs text-gray-500">{label.secondary}</div>
                  )}
                  {lead.contact_enquiry_count > 1 && (
                    <div className="text-xs text-gray-500">
                      {lead.contact_enquiry_count} enquiries from this contact
                    </div>
                  )}
                </TableCell>
                <TableCell>{lead.source === "instagram" ? "-" : lead.whatsapp_number}</TableCell>
                <TableCell><Badge>{lead.status}</Badge></TableCell>
                <TableCell><SourceBadge source={lead.source} /></TableCell>
                <TableCell>
                  {lead.move_type
                    ? `${lead.move_type}${lead.origin ? ` (${lead.origin} -> ${lead.destination || "?"})` : ""}`
                    : "-"}
                </TableCell>
                <TableCell className="space-x-1">
                  {awaiting && (
                    <Badge className="bg-amber-100 text-amber-800">Awaiting reply</Badge>
                  )}
                  {lead.escalated && <Badge variant="destructive">Escalated</Badge>}
                  {lead.human_takeover && <Badge variant="secondary">Human Active</Badge>}
                  {lead.opted_out && <Badge variant="destructive">Opted out</Badge>}
                  {lead.closed_reason === "declined_followup" && <Badge variant="secondary">Declined</Badge>}
                  {lead.closed_at && lead.closed_reason !== "declined_followup" && <Badge variant="secondary">Closed</Badge>}
                </TableCell>
                <TableCell>{new Date(lead.created_at).toLocaleString()}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
