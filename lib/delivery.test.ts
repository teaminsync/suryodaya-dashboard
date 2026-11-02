import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryReasonLabel } from "./delivery";

test("deliveryReasonLabel: 131047", () => {
  assert.equal(
    deliveryReasonLabel("131047", null),
    "The customer's 24-hour window had closed, so the message was not delivered"
  );
});

test("deliveryReasonLabel: 131026", () => {
  assert.equal(
    deliveryReasonLabel("131026", null),
    "WhatsApp reported the message as undeliverable"
  );
});

test("deliveryReasonLabel: 131049", () => {
  assert.equal(
    deliveryReasonLabel("131049", null),
    "WhatsApp chose not to deliver this message (customer engagement limits)"
  );
});

test("deliveryReasonLabel: 131056", () => {
  assert.equal(
    deliveryReasonLabel("131056", null),
    "Too many messages to this customer in a short time"
  );
});

test("deliveryReasonLabel: unknown code with a title", () => {
  assert.equal(
    deliveryReasonLabel("999999", "Custom error message"),
    "Custom error message"
  );
});

test("deliveryReasonLabel: unknown code without a title", () => {
  assert.equal(
    deliveryReasonLabel("999999", null),
    "Delivery failed (code 999999)"
  );
});

test("deliveryReasonLabel: blank title", () => {
  assert.equal(
    deliveryReasonLabel("888888", "   "),
    "Delivery failed (code 888888)"
  );
});

test("deliveryReasonLabel: code unknown", () => {
  assert.equal(
    deliveryReasonLabel("unknown", null),
    "Delivery failed (code unknown)"
  );
});
