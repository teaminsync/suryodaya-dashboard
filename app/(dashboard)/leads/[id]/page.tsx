import { getLeadById, getMediaCapturesForLead, getMessagesForLead, getContactById, getEnquiriesForContact, getTouchpointsForLead, type EnquirySummary } from "@/lib/queries";
import { createSignedUrl } from "@/lib/storage";
import { getMoveQuote, getOutreach } from "@/lib/internal-api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/components/source-badge";
import { ChatPanel } from "@/components/chat-panel";
import { OutreachPanel } from "@/components/outreach-panel";
import { InstagramNote } from "@/components/instagram-note";

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

  let contact: Awaited<ReturnType<typeof getContactById>> | undefined;
  let contactEnquiries: EnquirySummary[] = [];

  if (lead.contact_id) {
    [contact, contactEnquiries] = await Promise.all([
      getContactById(lead.contact_id),
      getEnquiriesForContact(lead.contact_id),
    ]);
  }

  const [captures, quote, outreach, messages, touchpoints] = await Promise.all([
    getMediaCapturesForLead(id),
    getMoveQuote(id),
    lead.source === "instagram" ? Promise.resolve(null) : getOutreach(id),
    getMessagesForLead(id),
    getTouchpointsForLead(id),
  ]);

  let instagramWindowOpen = false;
  let instagramWindowEndsAtLabel: string | null = null;

  if (lead.source === "instagram") {
    const instagramInboundTimes = messages
      .filter((m) => m.direction === "inbound" && m.channel === "instagram")
      .map((m) => new Date(m.created_at).getTime())
      .filter((t) => !isNaN(t));
    
    if (instagramInboundTimes.length > 0) {
      const lastCustomerMessageTime = Math.max(...instagramInboundTimes);
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const elapsed = now - lastCustomerMessageTime;
      instagramWindowOpen = elapsed <= 24 * 60 * 60 * 1000;
      if (instagramWindowOpen) {
        instagramWindowEndsAtLabel = new Date(
          lastCustomerMessageTime + 24 * 60 * 60 * 1000
        ).toLocaleString();
      }
    }
  }

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
          <CardTitle>
            {lead.source === "instagram"
              ? (contact?.display_name || (lead.contact_name && lead.contact_name !== "Unknown" ? lead.contact_name : "Instagram user"))
              : `${lead.contact_name || "Unknown"} - ${lead.whatsapp_number}`}
          </CardTitle>
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
          {lead.closed_at && (
            <div className="col-span-2 text-sm text-gray-600">
              Closed on {new Date(lead.closed_at).toLocaleString()}: {lead.closed_reason === "declined_followup" ? "customer declined the follow-up" : (lead.closed_reason || "closed")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Name:</strong> {contact?.display_name || lead.contact_name || "Unknown"}</div>
            <div><strong>Phone:</strong> {contact?.phone_e164 || "-"}</div>
            <div><strong>Source:</strong> <SourceBadge source={lead.source} /></div>
          </div>
          {contactEnquiries.length > 1 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">All enquiries from this contact</h4>
              <div className="space-y-2">
                {contactEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="text-sm border-l-2 pl-3 py-1">
                    {enquiry.id === id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Current</Badge>
                        <Badge>{enquiry.status}</Badge>
                        <SourceBadge source={enquiry.source} />
                        <span>{enquiry.origin ? `${enquiry.origin} -> ${enquiry.destination || "?"}` : "-"}</span>
                        <span className="text-gray-500">{new Date(enquiry.created_at).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <Link href={`/leads/${enquiry.id}`} className="flex items-center gap-2 hover:text-blue-600">
                        <Badge>{enquiry.status}</Badge>
                        <SourceBadge source={enquiry.source} />
                        <span>{enquiry.origin ? `${enquiry.origin} -> ${enquiry.destination || "?"}` : "-"}</span>
                        <span className="text-gray-500">{new Date(enquiry.created_at).toLocaleDateString()}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {lead.source === "instagram" ? (
        <InstagramNote
          windowEndsAtLabel={instagramWindowEndsAtLabel}
          windowOpen={instagramWindowOpen}
        />
      ) : (
        <OutreachPanel
          leadId={id}
          leadLabel={contact?.display_name || lead.contact_name || "this customer"}
          outreach={outreach ? {
            status: outreach.status,
            capabilities: outreach.capabilities,
            history: outreach.history.map((item) => ({
              status: item.status,
              source: item.source,
              wording: item.wording,
              when: new Date(item.captured_at).toLocaleString(),
            })),
          } : null}
        />
      )}

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

      <Card>
        <CardHeader>
          <CardTitle>Touchpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {touchpoints.length > 0 ? (
            <div className="space-y-2">
              {touchpoints.map((touchpoint) => (
                <div key={touchpoint.id} className="text-sm flex items-center gap-2">
                  <SourceBadge source={touchpoint.source} />
                  <span className="text-gray-500">{new Date(touchpoint.received_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No touchpoints recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
