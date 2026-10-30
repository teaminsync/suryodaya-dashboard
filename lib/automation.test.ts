import { test } from "node:test";
import assert from "node:assert/strict";
import {
  statusLabel,
  statusTone,
  reasonLabel,
  channelLabel,
  formatWhen,
  timeUntil,
  cancelErrorMessage,
} from "./automation";

test("statusLabel sent returns Sent", () => {
  assert.strictEqual(statusLabel("sent"), "Sent");
});

test("statusLabel skipped returns Skipped", () => {
  assert.strictEqual(statusLabel("skipped"), "Skipped");
});

test("statusLabel failed returns Failed", () => {
  assert.strictEqual(statusLabel("failed"), "Failed");
});

test("statusLabel cancelled returns Cancelled", () => {
  assert.strictEqual(statusLabel("cancelled"), "Cancelled");
});

test("statusLabel claimed returns Interrupted", () => {
  assert.strictEqual(statusLabel("claimed"), "Interrupted (not confirmed sent)");
});

test("statusLabel unknown returns Unknown", () => {
  assert.strictEqual(statusLabel("something_else"), "Unknown");
});

test("statusTone sent returns good", () => {
  assert.strictEqual(statusTone("sent"), "good");
});

test("statusTone failed returns bad", () => {
  assert.strictEqual(statusTone("failed"), "bad");
});

test("statusTone claimed returns bad", () => {
  assert.strictEqual(statusTone("claimed"), "bad");
});

test("statusTone skipped returns neutral", () => {
  assert.strictEqual(statusTone("skipped"), "neutral");
});

test("statusTone cancelled returns neutral", () => {
  assert.strictEqual(statusTone("cancelled"), "neutral");
});

test("statusTone unknown returns neutral", () => {
  assert.strictEqual(statusTone("unknown_status"), "neutral");
});

test("reasonLabel null returns empty string", () => {
  assert.strictEqual(reasonLabel(null), "");
});

test("reasonLabel opted_out", () => {
  assert.strictEqual(reasonLabel("opted_out"), "Customer opted out");
});

test("reasonLabel no_phone", () => {
  assert.strictEqual(reasonLabel("no_phone"), "No phone number");
});

test("reasonLabel no_consent", () => {
  assert.strictEqual(reasonLabel("no_consent"), "No recorded consent");
});

test("reasonLabel window_open", () => {
  assert.strictEqual(reasonLabel("window_open"), "Customer window is open (template not needed)");
});

test("reasonLabel window_closed", () => {
  assert.strictEqual(reasonLabel("window_closed"), "Customer window is closed");
});

test("reasonLabel expired", () => {
  assert.strictEqual(reasonLabel("expired"), "Too late to send");
});

test("reasonLabel quiet_hours", () => {
  assert.strictEqual(reasonLabel("quiet_hours"), "Outside sending hours");
});

test("reasonLabel cancelled by staff unchanged", () => {
  assert.strictEqual(reasonLabel("cancelled by admin@example.com"), "cancelled by admin@example.com");
});

test("reasonLabel unknown truncated to 120", () => {
  const longReason = "a".repeat(150);
  assert.strictEqual(reasonLabel(longReason), "a".repeat(120));
});

test("channelLabel freeform", () => {
  assert.strictEqual(channelLabel("freeform", null), "WhatsApp message");
});

test("channelLabel template with name", () => {
  assert.strictEqual(channelLabel("template", "survey_reminder"), "Template: survey_reminder");
});

test("channelLabel template without name", () => {
  assert.strictEqual(channelLabel("template", null), "Template: unknown");
});

test("channelLabel null", () => {
  assert.strictEqual(channelLabel(null, null), "");
});

test("formatWhen null returns dash", () => {
  assert.strictEqual(formatWhen(null), "-");
});

test("formatWhen invalid returns dash", () => {
  assert.strictEqual(formatWhen("invalid-date"), "-");
});

test("formatWhen IST conversion", () => {
  const result = formatWhen("2026-10-30T12:45:00.000Z");
  assert.strictEqual(result, "30 Oct 2026, 6:15 PM");
});

test("formatWhen AM time", () => {
  const result = formatWhen("2026-10-30T04:30:00.000Z");
  assert.strictEqual(result, "30 Oct 2026, 10:00 AM");
});

test("formatWhen midnight", () => {
  const result = formatWhen("2026-10-30T18:30:00.000Z");
  assert.strictEqual(result, "31 Oct 2026, 12:00 AM");
});

test("formatWhen noon", () => {
  const result = formatWhen("2026-10-30T06:30:00.000Z");
  assert.strictEqual(result, "30 Oct 2026, 12:00 PM");
});

test("timeUntil invalid returns dash", () => {
  assert.strictEqual(timeUntil("invalid-date", new Date()), "-");
});

test("timeUntil 0 seconds", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T12:00:00.000Z", now);
  assert.strictEqual(result, "due now");
});

test("timeUntil negative returns due now", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T11:00:00.000Z", now);
  assert.strictEqual(result, "due now");
});

test("timeUntil 59 seconds", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T12:00:59.000Z", now);
  assert.strictEqual(result, "in 0 min");
});

test("timeUntil 60 seconds", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T12:01:00.000Z", now);
  assert.strictEqual(result, "in 1 min");
});

test("timeUntil 119 minutes", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T13:59:00.000Z", now);
  assert.strictEqual(result, "in 1 h 59 min");
});

test("timeUntil 3 hours 20 minutes", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T15:20:00.000Z", now);
  assert.strictEqual(result, "in 3 h 20 min");
});

test("timeUntil 25 minutes", () => {
  const now = new Date("2026-10-30T12:00:00.000Z");
  const result = timeUntil("2026-10-30T12:25:00.000Z", now);
  assert.strictEqual(result, "in 25 min");
});

test("cancelErrorMessage not_cancellable", () => {
  assert.strictEqual(cancelErrorMessage("not_cancellable"), "This message can no longer be cancelled");
});

test("cancelErrorMessage already_processed", () => {
  assert.strictEqual(cancelErrorMessage("already_processed"), "This message was already handled");
});

test("cancelErrorMessage not_found", () => {
  assert.strictEqual(cancelErrorMessage("not_found"), "Lead not found");
});

test("cancelErrorMessage invalid", () => {
  assert.strictEqual(cancelErrorMessage("invalid"), "Invalid request");
});

test("cancelErrorMessage undefined", () => {
  assert.strictEqual(cancelErrorMessage(undefined), "Something went wrong. Please try again.");
});

test("cancelErrorMessage unknown", () => {
  assert.strictEqual(cancelErrorMessage("unknown_code"), "Something went wrong. Please try again.");
});
