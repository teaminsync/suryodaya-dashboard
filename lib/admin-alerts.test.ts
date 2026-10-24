import { test } from "node:test";
import assert from "node:assert/strict";
import { alertEventLabel, alertChannelLabel, alertStatusTone } from "./admin-alerts";

test("alertEventLabel: booking_confirmed", () => {
  assert.equal(alertEventLabel("booking_confirmed"), "Survey booked");
});

test("alertEventLabel: human_requested", () => {
  assert.equal(alertEventLabel("human_requested"), "Customer wants a human");
});

test("alertEventLabel: needs_followup", () => {
  assert.equal(alertEventLabel("needs_followup"), "Needs team follow-up");
});

test("alertEventLabel: unknown type", () => {
  assert.equal(alertEventLabel("some_other_event"), "some_other_event");
});

test("alertEventLabel: empty string", () => {
  assert.equal(alertEventLabel(""), "Unknown");
});

test("alertEventLabel: null", () => {
  assert.equal(alertEventLabel(null), "Unknown");
});

test("alertEventLabel: undefined", () => {
  assert.equal(alertEventLabel(undefined), "Unknown");
});

test("alertChannelLabel: email", () => {
  assert.equal(alertChannelLabel("email"), "Email");
});

test("alertChannelLabel: whatsapp", () => {
  assert.equal(alertChannelLabel("whatsapp"), "WhatsApp");
});

test("alertChannelLabel: unknown channel", () => {
  assert.equal(alertChannelLabel("sms"), "sms");
});

test("alertChannelLabel: empty string", () => {
  assert.equal(alertChannelLabel(""), "");
});

test("alertChannelLabel: null", () => {
  assert.equal(alertChannelLabel(null), "");
});

test("alertChannelLabel: undefined", () => {
  assert.equal(alertChannelLabel(undefined), "");
});

test("alertStatusTone: sent", () => {
  assert.equal(alertStatusTone("sent"), "good");
});

test("alertStatusTone: failed", () => {
  assert.equal(alertStatusTone("failed"), "bad");
});

test("alertStatusTone: dry_run", () => {
  assert.equal(alertStatusTone("dry_run"), "neutral");
});

test("alertStatusTone: unknown status", () => {
  assert.equal(alertStatusTone("pending"), "neutral");
});

test("alertStatusTone: empty string", () => {
  assert.equal(alertStatusTone(""), "neutral");
});

test("alertStatusTone: null", () => {
  assert.equal(alertStatusTone(null), "neutral");
});

test("alertStatusTone: undefined", () => {
  assert.equal(alertStatusTone(undefined), "neutral");
});
