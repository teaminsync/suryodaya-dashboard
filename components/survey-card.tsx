import { SurveyRow } from "@/lib/queries";
import { formatSurveyTime, calendarStatusLabel, safeExternalUrl } from "@/lib/surveys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SurveyCardProps {
  survey: SurveyRow;
}

export function SurveyCard({ survey }: SurveyCardProps) {
  const statusInfo = calendarStatusLabel(survey.calendar_status);
  const safeUrl = safeExternalUrl(survey.calendar_event_link);
  
  const badgeClass =
    statusInfo.tone === "good"
      ? "bg-green-100 text-green-800"
      : statusInfo.tone === "bad"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-700";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <strong>{formatSurveyTime(survey.survey_starts_at)}</strong> (India time)
        </div>
        <div>
          <Badge className={badgeClass}>{statusInfo.label}</Badge>
        </div>
        {safeUrl && (
          <div>
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open in Google Calendar
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
