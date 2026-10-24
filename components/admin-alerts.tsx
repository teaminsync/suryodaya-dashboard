import { AdminAlertRow } from "@/lib/queries";
import { alertEventLabel, alertChannelLabel, alertStatusTone } from "@/lib/admin-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminAlertsProps {
  alerts: AdminAlertRow[];
}

export function AdminAlerts({ alerts }: AdminAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No alerts sent for this enquiry yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const tone = alertStatusTone(alert.status);
            const badgeClass =
              tone === "good"
                ? "bg-green-100 text-green-800"
                : tone === "bad"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-700";

            return (
              <div key={alert.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {alertEventLabel(alert.event_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        via {alertChannelLabel(alert.channel)}
                      </span>
                      <Badge className={badgeClass}>{alert.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                    {alert.detail && (
                      <div className="text-xs text-gray-600 mt-1">{alert.detail}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
