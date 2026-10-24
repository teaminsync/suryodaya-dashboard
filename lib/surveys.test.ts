import { test } from "node:test";
import assert from "node:assert";
import {
  formatSurveyTime,
  istDateKey,
  dayHeading,
  groupSurveysByDay,
  calendarStatusLabel,
  safeExternalUrl,
} from "./surveys";

test("formatSurveyTime with string 2026-10-20T04:30:00.000Z returns Tue, 20 Oct at 10:00 AM", () => {
  const result = formatSurveyTime("2026-10-20T04:30:00.000Z");
  assert.strictEqual(result, "Tue, 20 Oct at 10:00 AM");
});

test("formatSurveyTime with Date input gives same result", () => {
  const result = formatSurveyTime(new Date("2026-10-20T04:30:00.000Z"));
  assert.strictEqual(result, "Tue, 20 Oct at 10:00 AM");
});

test("formatSurveyTime with 2026-10-20T12:00:00.000Z returns Tue, 20 Oct at 5:30 PM", () => {
  const result = formatSurveyTime("2026-10-20T12:00:00.000Z");
  assert.strictEqual(result, "Tue, 20 Oct at 5:30 PM");
});

test("formatSurveyTime with 2026-10-19T18:30:00.000Z returns Tue, 20 Oct at 12:00 AM", () => {
  const result = formatSurveyTime("2026-10-19T18:30:00.000Z");
  assert.strictEqual(result, "Tue, 20 Oct at 12:00 AM");
});

test("formatSurveyTime with 2026-10-20T06:30:00.000Z returns Tue, 20 Oct at 12:00 PM", () => {
  const result = formatSurveyTime("2026-10-20T06:30:00.000Z");
  assert.strictEqual(result, "Tue, 20 Oct at 12:00 PM");
});

test("formatSurveyTime with invalid string returns Unknown time", () => {
  const result = formatSurveyTime("invalid");
  assert.strictEqual(result, "Unknown time");
});

test("istDateKey crossing midnight", () => {
  const result = istDateKey("2026-10-19T19:00:00.000Z");
  assert.strictEqual(result, "2026-10-20");
});

test("dayHeading with same day returns Today", () => {
  const now = new Date("2026-10-20T04:30:00.000Z");
  const result = dayHeading("2026-10-20T04:30:00.000Z", now);
  assert.strictEqual(result, "Today");
});

test("dayHeading with next IST day returns Tomorrow", () => {
  const now = new Date("2026-10-20T04:30:00.000Z");
  const result = dayHeading("2026-10-20T19:00:00.000Z", now);
  assert.strictEqual(result, "Tomorrow");
});

test("dayHeading with 2026-10-22T04:30:00.000Z returns Thu, 22 Oct", () => {
  const now = new Date("2026-10-20T04:30:00.000Z");
  const result = dayHeading("2026-10-22T04:30:00.000Z", now);
  assert.strictEqual(result, "Thu, 22 Oct");
});

test("dayHeading boundary: now 2026-10-20T18:00:00.000Z (23:30 IST) and survey 2026-10-20T19:00:00.000Z (00:30 IST next day) returns Tomorrow", () => {
  const now = new Date("2026-10-20T18:00:00.000Z");
  const result = dayHeading("2026-10-20T19:00:00.000Z", now);
  assert.strictEqual(result, "Tomorrow");
});

test("groupSurveysByDay merges same-day rows and keeps order", () => {
  const rows = [
    { survey_starts_at: "2026-10-20T04:30:00.000Z", id: "1" },
    { survey_starts_at: "2026-10-20T05:30:00.000Z", id: "2" },
    { survey_starts_at: "2026-10-21T04:30:00.000Z", id: "3" },
  ];
  const now = new Date("2026-10-20T04:30:00.000Z");
  const result = groupSurveysByDay(rows, now);
  
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].heading, "Today");
  assert.strictEqual(result[0].rows.length, 2);
  assert.strictEqual(result[0].rows[0].id, "1");
  assert.strictEqual(result[0].rows[1].id, "2");
  assert.strictEqual(result[1].heading, "Tomorrow");
  assert.strictEqual(result[1].rows.length, 1);
  assert.strictEqual(result[1].rows[0].id, "3");
});

test("calendarStatusLabel for created returns On calendar/good", () => {
  const result = calendarStatusLabel("created");
  assert.deepStrictEqual(result, { label: "On calendar", tone: "good" });
});

test("calendarStatusLabel for failed returns Calendar not updated/bad", () => {
  const result = calendarStatusLabel("failed");
  assert.deepStrictEqual(result, { label: "Calendar not updated", tone: "bad" });
});

test("calendarStatusLabel for not_configured returns Not on a calendar/neutral", () => {
  const result = calendarStatusLabel("not_configured");
  assert.deepStrictEqual(result, { label: "Not on a calendar", tone: "neutral" });
});

test("calendarStatusLabel for null returns Unknown/neutral", () => {
  const result = calendarStatusLabel(null);
  assert.deepStrictEqual(result, { label: "Unknown", tone: "neutral" });
});

test("calendarStatusLabel for unknown text returns Unknown/neutral", () => {
  const result = calendarStatusLabel("something_else");
  assert.deepStrictEqual(result, { label: "Unknown", tone: "neutral" });
});

test("safeExternalUrl accepts https URL", () => {
  const result = safeExternalUrl("https://example.com/path");
  assert.strictEqual(result, "https://example.com/path");
});

test("safeExternalUrl rejects http", () => {
  const result = safeExternalUrl("http://example.com/path");
  assert.strictEqual(result, null);
});

test("safeExternalUrl rejects javascript:", () => {
  const result = safeExternalUrl("javascript:alert(1)");
  assert.strictEqual(result, null);
});

test("safeExternalUrl rejects garbage", () => {
  const result = safeExternalUrl("not a url");
  assert.strictEqual(result, null);
});

test("safeExternalUrl rejects null", () => {
  const result = safeExternalUrl(null);
  assert.strictEqual(result, null);
});
