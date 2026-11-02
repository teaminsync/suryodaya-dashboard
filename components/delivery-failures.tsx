import { DeliveryFailure } from "@/lib/queries";
import { deliveryReasonLabel } from "@/lib/delivery";
import { formatWhen } from "@/lib/automation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeliveryFailuresProps {
  failures: DeliveryFailure[];
}

export function DeliveryFailures({ failures }: DeliveryFailuresProps) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-900">Messages that did not reach the customer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {failures.map((failure) => (
            <div key={failure.wamid} className="border-b pb-3 last:border-b-0 last:pb-0">
              <div className="flex-1">
                <div className="text-sm font-medium text-red-800">
                  {deliveryReasonLabel(failure.code, failure.title)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatWhen(failure.failedAt)}
                </div>
                {failure.detail && (
                  <div className="text-xs text-gray-600 mt-1">{failure.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
