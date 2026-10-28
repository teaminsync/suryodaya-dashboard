import { getSurveySettings } from "@/lib/internal-api";
import { SurveySettingsFormComponent } from "@/components/survey-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSurveySettings();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Survey settings</h2>
      {settings === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Settings unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Settings are unavailable right now (the messaging service could not be reached).
            </p>
          </CardContent>
        </Card>
      ) : (
        <SurveySettingsFormComponent initial={settings} />
      )}
    </div>
  );
}
