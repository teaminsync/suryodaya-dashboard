import { Badge } from "@/components/ui/badge";

export function SourceBadge({ source }: { source: string | null }) {
  if (!source) {
    return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  }

  switch (source) {
    case "whatsapp":
      return <Badge className="bg-green-100 text-green-800">WhatsApp</Badge>;
    case "instagram":
      return <Badge className="bg-pink-100 text-pink-800">Instagram</Badge>;
    case "indiamart":
      return <Badge className="bg-orange-100 text-orange-800">IndiaMART</Badge>;
    case "justdial":
      return <Badge className="bg-blue-100 text-blue-800">JustDial</Badge>;
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800">
          {source.charAt(0).toUpperCase() + source.slice(1)}
        </Badge>
      );
  }
}
