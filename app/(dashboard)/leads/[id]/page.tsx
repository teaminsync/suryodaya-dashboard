import { getLeadById, getMediaCapturesForLead, getMessagesForLead } from "@/lib/queries";
import { createSignedUrl } from "@/lib/storage";
import { getMoveQuote } from "@/lib/internal-api";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/chat-panel";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  const [captures, quote, messages] = await Promise.all([
    getMediaCapturesForLead(id),
    getMoveQuote(id),
    getMessagesForLead(id),
  ]);

  const capturesWithUrls = await Promise.all(
    captures.map(async (capture) => ({
      ...capture,
      signedUrl: capture.storage_path
        ? await createSignedUrl(capture.storage_path)
        : null,
    }))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{lead.contact_name || "Unknown"} - {lead.whatsapp_number}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Status:</strong> <Badge>{lead.status}</Badge></div>
          <div><strong>Move type:</strong> {lead.move_type || "-"}</div>
          <div><strong>Route:</strong> {lead.origin || "-"} -&gt; {lead.destination || "-"}</div>
          <div><strong>Urgency:</strong> {lead.urgency || "-"}</div>
          <div><strong>Volume:</strong> {lead.estimated_volume || "-"}</div>
          <div><strong>Packing needed:</strong> {lead.requires_packing ? "Yes" : "No"}</div>
          {lead.escalated && <div><Badge variant="destructive">Escalated</Badge></div>}
          {lead.human_takeover && <div><Badge variant="secondary">Human Takeover Active</Badge></div>}
        </CardContent>
      </Card>

      <ChatPanel
        leadId={id}
        initialMessages={messages}
        initialHumanTakeover={lead.human_takeover}
      />

      <Card>
        <CardHeader>
          <CardTitle>Move Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          {quote?.hasCaptures ? (
            <pre className="whitespace-pre-wrap text-sm font-sans">{quote.message}</pre>
          ) : (
            <p className="text-gray-500">No captures yet.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-3">Captures ({capturesWithUrls.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capturesWithUrls.map((capture) => (
            <Card key={capture.id}>
              <CardContent className="pt-4">
                {capture.signedUrl ? (
                  capture.media_type === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={capture.signedUrl} controls className="w-full rounded mb-2" />
                  ) : (
                    // Deliberately a plain img tag, not next/image - these are
                    // short-lived signed URLs from a dynamic external domain,
                    // which next/image's optimizer isn't a good fit for here.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capture.signedUrl} alt="Room capture" className="w-full rounded mb-2" />
                  )
                ) : (
                  <div className="bg-gray-100 h-40 flex items-center justify-center rounded mb-2 text-sm text-gray-500">
                    Media unavailable
                  </div>
                )}
                <p className="text-sm font-medium">{capture.suggested_room_label || "Unlabeled"}</p>
                <p className="text-xs text-gray-500">
                  {capture.total_estimated_cubic_feet} cu ft, {capture.total_estimated_weight_kg} kg
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
