import { Card, CardContent } from "@/components/ui/card";
import { groupCaptures, parseItems, type CaptureLike } from "@/lib/captures";

interface CaptureWithUrl extends CaptureLike {
  id: string;
  media_type: string;
  signedUrl: string | null;
}

export function CaptureGroups({ captures }: { captures: CaptureWithUrl[] }) {
  const groups = groupCaptures(captures);

  return (
    <>
      {groups.map((group) => (
        <Card key={group.key} className="mb-4">
          <CardContent className="pt-4">
            <h4 className="font-semibold mb-3">
              {group.label} ({group.captures.length} capture
              {group.captures.length !== 1 ? "s" : ""}) - ~{group.cubicFeet} cu
              ft, ~{group.weightKg} kg
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.captures.map((capture) => {
                const items = parseItems(capture.items);
                return (
                  <div key={capture.id} className="border rounded p-2">
                    {capture.signedUrl ? (
                      capture.media_type === "video" ? (
                        <video
                          src={capture.signedUrl}
                          controls
                          className="w-full rounded mb-2"
                        />
                      ) : (
                        // Deliberately a plain img tag, not next/image - these are
                        // short-lived signed URLs from a dynamic external domain,
                        // which next/image's optimizer isn't a good fit for here.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={capture.signedUrl}
                          alt="Room capture"
                          className="w-full rounded mb-2"
                        />
                      )
                    ) : (
                      <div className="bg-gray-100 h-40 flex items-center justify-center rounded mb-2 text-sm text-gray-500">
                        Media unavailable
                      </div>
                    )}
                    {items.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className={
                              item.alreadyCounted
                                ? "text-gray-400 line-through"
                                : ""
                            }
                          >
                            {item.name} {item.quantity > 1 ? `(${item.quantity})` : ""}
                            {item.alreadyCounted && (
                              <span> (already counted)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
