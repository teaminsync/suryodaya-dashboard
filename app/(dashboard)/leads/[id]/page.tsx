import { getLeadById, getMediaCapturesForLead, getMessagesForLead, getContactById, getEnquiriesForContact, getTouchpointsForLead, getAdminAlertsForLead, type EnquirySummary } from "@/lib/queries";
import { createSignedUrl } from "@/lib/storage";
import { getMoveQuote, getOutreach } from "@/lib/internal-api";
import { contactLabel } from "@/lib/contact-label";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourceBadge } from "@/components/source-badge";
import { ChatPanel } from "@/components/chat-panel";
import { OutreachPanel } from "@/components/outreach-panel";
import { InstagramNote } from "@/components/instagram-note";
import { CaptureGroups } from "@/components/capture-groups";
import { AdminAlerts } from "@/components/admin-alerts";

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

  const [captures, quote, outreach, messages, touchpoints, alerts] = await Promise.all([
    getMediaCapturesForLead(id),
    getMoveQuote(id),
    lead.source === "instagram" ? Promise.resolve(null) : getOutreach(id),
    getMessagesForLead(id),
    getTouchpointsForLead(id),
    getAdminAlertsForLead(id),
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

  const headerLabel = contactLabel({
    source: lead.source,
    display_name: contact?.display_name ?? null,
    instagram_username: contact?.instagram_username ?? null,
    contact_name: lead.contact_name,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {lead.source === "instagram" ? (
              <span>
                {headerLabel.primary}
                {headerLabel.secondary && (
                  <span className="text-sm text-gray-500 ml-2">{headerLabel.secondary}</span>
                )}
              </span>
            ) : (
              `${lead.contact_name || "Unknown"} - ${lead.whatsapp_number}`
            )}
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
            {lead.source === "instagram" && contact?.instagram_username && (
              <div>
                <strong>Instagram:</strong>{" "}
                <a
                  href={`https://instagram.com/${contact.instagram_username.startsWith("@") ? contact.instagram_username.slice(1) : contact.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  @{contact.instagram_username.startsWith("@") ? contact.instagram_username.slice(1) : contact.instagram_username}
                </a>
              </div>
            )}
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

      <AdminAlerts alerts={alerts} />

      <div>
        <h3 className="text-lg font-semibold mb-3">Captures ({capturesWithUrls.length})</h3>
        <CaptureGroups captures={capturesWithUrls} />
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
