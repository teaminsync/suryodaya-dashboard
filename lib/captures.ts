export interface CaptureLike {
  id: string;
  room_key: string | null;
  room_qualifier: string | null;
  suggested_room_label: string | null;
  items: string;
  total_estimated_cubic_feet: number;
  total_estimated_weight_kg: number;
}

export function parseItems(json: string): Array<{
  name: string;
  quantity: number;
  alreadyCounted: boolean;
}> {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => {
        if (typeof item !== "object" || item === null) return false;
        if (typeof item.name !== "string" || item.name.trim() === "") return false;
        return true;
      })
      .map((item) => ({
        name: item.name,
        quantity:
          typeof item.quantity === "number" && isFinite(item.quantity)
            ? item.quantity
            : 1,
        alreadyCounted: item.alreadyCounted === true,
      }));
  } catch {
    return [];
  }
}

export function formatRoomLabel(label: string): string {
  const normalized = label.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  if (normalized === "") return "Unlabeled";

  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function groupCaptures<T extends CaptureLike>(
  captures: T[]
): Array<{
  key: string;
  label: string;
  captures: T[];
  cubicFeet: number;
  weightKg: number;
}> {
  const groups = new Map<
    string,
    { label: string; captures: T[]; cubicFeet: number; weightKg: number }
  >();

  for (const capture of captures) {
    let key: string;
    let label: string;

    if (capture.room_key) {
      const qualifier = (capture.room_qualifier ?? "").trim().toLowerCase();
      key = `${capture.room_key}|${qualifier}`;
      label = formatRoomLabel(capture.suggested_room_label ?? capture.room_key);
    } else {
      const labelNormalized = formatRoomLabel(
        capture.suggested_room_label ?? "unlabeled"
      );
      key = `legacy|${labelNormalized.toLowerCase()}`;
      label = labelNormalized;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        label,
        captures: [],
        cubicFeet: 0,
        weightKg: 0,
      });
    }

    const group = groups.get(key)!;
    group.captures.push(capture);
    group.cubicFeet += capture.total_estimated_cubic_feet;
    group.weightKg += capture.total_estimated_weight_kg;
  }

  const result = Array.from(groups.entries()).map(([key, group]) => ({
    key,
    label: group.label,
    captures: group.captures,
    cubicFeet: Math.round(group.cubicFeet * 10) / 10,
    weightKg: Math.round(group.weightKg * 10) / 10,
  }));

  return result;
}
