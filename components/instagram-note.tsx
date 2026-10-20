import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InstagramNote({
  windowEndsAtLabel,
  windowOpen,
}: {
  windowEndsAtLabel: string | null;
  windowOpen: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram conversation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Badge variant={windowOpen ? "default" : "secondary"}>
          {windowOpen ? "Reply window open" : "Reply window closed"}
        </Badge>
        <p className="text-sm text-gray-600">
          {windowOpen && windowEndsAtLabel
            ? `You can reply until ${windowEndsAtLabel}. Instagram only allows replies within 24 hours of the customer's last message.`
            : "Instagram only allows replies within 24 hours of the customer's last message, and that time has passed. Wait for the customer to write again."}
        </p>
      </CardContent>
    </Card>
  );
}
