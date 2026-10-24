import { getUpcomingSurveys } from "@/lib/queries";
import { groupSurveysByDay, formatSurveyTime, calendarStatusLabel } from "@/lib/surveys";
import { contactLabel } from "@/lib/contact-label";
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

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const rows = await getUpcomingSurveys();
  const groups = groupSurveysByDay(rows, new Date());
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Upcoming surveys ({rows.length})
      </h2>
      
      {rows.length === 0 ? (
        <p className="text-gray-500">No upcoming surveys.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h3 className="text-lg font-semibold mb-3">{group.heading}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Move</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Calendar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.rows.map((survey) => {
                    const label = contactLabel({
                      source: survey.source,
                      display_name: survey.contact_display_name,
                      instagram_username: survey.contact_instagram_username,
                      contact_name: survey.contact_name,
                    });
                    
                    const timeFormatted = formatSurveyTime(survey.survey_starts_at);
                    const timeOnlyMatch = timeFormatted.match(/at (.+)$/);
                    const timeOnly = timeOnlyMatch ? timeOnlyMatch[1] : timeFormatted;
                    
                    const moveText = survey.move_type && survey.origin
                      ? `${survey.move_type} (${survey.origin} -> ${survey.destination || "?"})`
                      : survey.move_type || "-";
                    
                    const phoneText = survey.source === "instagram"
                      ? "-"
                      : survey.contact_phone_e164 || survey.whatsapp_number;
                    
                    const statusInfo = calendarStatusLabel(survey.calendar_status);
                    const badgeClass =
                      statusInfo.tone === "good"
                        ? "bg-green-100 text-green-800"
                        : statusInfo.tone === "bad"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-700";
                    
                    return (
                      <TableRow key={survey.id}>
                        <TableCell>{timeOnly}, India time</TableCell>
                        <TableCell>
                          <Link
                            href={`/leads/${survey.lead_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {label.primary}
                          </Link>
                          {label.secondary && (
                            <div className="text-xs text-gray-500">{label.secondary}</div>
                          )}
                        </TableCell>
                        <TableCell>{moveText}</TableCell>
                        <TableCell>{phoneText}</TableCell>
                        <TableCell>
                          <Badge className={badgeClass}>{statusInfo.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
