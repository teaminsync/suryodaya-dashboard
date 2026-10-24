export function formatSurveyTime(value: string | Date): string {
  let date: Date;
  
  if (typeof value === "string") {
    date = new Date(value);
  } else {
    date = value;
  }
  
  if (isNaN(date.getTime())) {
    return "Unknown time";
  }
  
  const utcTime = date.getTime();
  const istTime = utcTime + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istTime);
  
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const weekday = weekdays[istDate.getUTCDay()];
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  let hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  
  const minutesPadded = minutes.toString().padStart(2, "0");
  
  return `${weekday}, ${day} ${month} at ${hours}:${minutesPadded} ${ampm}`;
}

export function istDateKey(value: string | Date): string | null {
  let date: Date;
  
  if (typeof value === "string") {
    date = new Date(value);
  } else {
    date = value;
  }
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const utcTime = date.getTime();
  const istTime = utcTime + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istTime);
  
  const year = istDate.getUTCFullYear();
  const month = (istDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = istDate.getUTCDate().toString().padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

export function dayHeading(value: string | Date, now: Date): string {
  const surveyKey = istDateKey(value);
  const nowKey = istDateKey(now);
  
  if (!surveyKey || !nowKey) {
    return "Unknown date";
  }
  
  if (surveyKey === nowKey) {
    return "Today";
  }
  
  const nowDate = new Date(nowKey);
  const tomorrowKey = istDateKey(new Date(nowDate.getTime() + 24 * 60 * 60 * 1000));
  
  if (surveyKey === tomorrowKey) {
    return "Tomorrow";
  }
  
  let date: Date;
  if (typeof value === "string") {
    date = new Date(value);
  } else {
    date = value;
  }
  
  const utcTime = date.getTime();
  const istTime = utcTime + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istTime);
  
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const weekday = weekdays[istDate.getUTCDay()];
  const day = istDate.getUTCDate();
  const month = months[istDate.getUTCMonth()];
  
  return `${weekday}, ${day} ${month}`;
}

export function groupSurveysByDay<T extends { survey_starts_at: string | Date }>(
  rows: T[],
  now: Date
): Array<{ heading: string; rows: T[] }> {
  const groups: Array<{ heading: string; rows: T[] }> = [];
  const keyToGroup = new Map<string, { heading: string; rows: T[] }>();
  
  for (const row of rows) {
    const key = istDateKey(row.survey_starts_at);
    if (!key) continue;
    
    let group = keyToGroup.get(key);
    if (!group) {
      const heading = dayHeading(row.survey_starts_at, now);
      group = { heading, rows: [] };
      keyToGroup.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  
  return groups;
}

export function calendarStatusLabel(status: string | null): { label: string; tone: "good" | "bad" | "neutral" } {
  if (status === "created") {
    return { label: "On calendar", tone: "good" };
  }
  if (status === "failed") {
    return { label: "Calendar not updated", tone: "bad" };
  }
  if (status === "not_configured") {
    return { label: "Not on a calendar", tone: "neutral" };
  }
  return { label: "Unknown", tone: "neutral" };
}

export function safeExternalUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
