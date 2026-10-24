import { test } from "node:test";
import assert from "node:assert/strict";
import { isAwaitingReply, filterLeads, countBy, buildInboxHref } from "./inbox";

const baseLead = {
  id: "test-id",
  contact_display_name: null,
  contact_name: null,
  contact_instagram_username: null,
  whatsapp_number: "1234567890",
  contact_phone_e164: null,
  origin: null,
  destination: null,
  move_type: null,
  source: "whatsapp",
  status: "new",
  last_direction: null as "inbound" | "outbound" | null,
  closed_at: null,
  escalated: false,
  human_takeover: false,
  opted_out: false,
  closed_reason: null,
  contact_enquiry_count: 1,
  created_at: "2024-01-01T00:00:00Z",
};

test("isAwaitingReply: inbound and not closed", () => {
  assert.equal(
    isAwaitingReply({ ...baseLead, last_direction: "inbound", closed_at: null }),
    true
  );
});

test("isAwaitingReply: outbound", () => {
  assert.equal(
    isAwaitingReply({ ...baseLead, last_direction: "outbound", closed_at: null }),
    false
  );
});

test("isAwaitingReply: closed", () => {
  assert.equal(
    isAwaitingReply({
      ...baseLead,
      last_direction: "inbound",
      closed_at: "2024-01-01T00:00:00Z",
    }),
    false
  );
});

test("filterLeads: match contact_display_name", () => {
  const leads = [
    { ...baseLead, contact_display_name: "Alice Smith" },
    { ...baseLead, contact_display_name: "Bob Jones" },
  ];
  const result = filterLeads(leads, { q: "alice" });
  assert.equal(result.length, 1);
  assert.equal(result[0].contact_display_name, "Alice Smith");
});

test("filterLeads: match contact_name", () => {
  const leads = [
    { ...baseLead, contact_name: "Charlie" },
    { ...baseLead, contact_name: "Diana" },
  ];
  const result = filterLeads(leads, { q: "charlie" });
  assert.equal(result.length, 1);
  assert.equal(result[0].contact_name, "Charlie");
});

test('filterLeads: match instagram_username with "@acme" vs "acme"', () => {
  const leads = [
    { ...baseLead, contact_instagram_username: "acme" },
    { ...baseLead, contact_instagram_username: "other" },
  ];
  const resultWithAt = filterLeads(leads, { q: "@acme" });
  assert.equal(resultWithAt.length, 1);
  assert.equal(resultWithAt[0].contact_instagram_username, "acme");

  const resultWithout = filterLeads(leads, { q: "acme" });
  assert.equal(resultWithout.length, 1);
  assert.equal(resultWithout[0].contact_instagram_username, "acme");
});

test("filterLeads: phone digit matching with formatting", () => {
  const leads = [
    { ...baseLead, whatsapp_number: "15551234567", contact_phone_e164: "+1-555-123-4567" },
    { ...baseLead, whatsapp_number: "15559998888", contact_phone_e164: "+1-555-999-8888" },
  ];
  const result = filterLeads(leads, { q: "1234" });
  assert.equal(result.length, 1);
  assert.equal(result[0].contact_phone_e164, "+1-555-123-4567");
});

test("filterLeads: phone digit matching requires at least 3 digits", () => {
  const leads = [{ ...baseLead, whatsapp_number: "15551234567", contact_phone_e164: "+1-555-123-4567" }];
  const result = filterLeads(leads, { q: "12" });
  assert.equal(result.length, 0);
});

test("filterLeads: formatted Indian phone matches whatsapp_number", () => {
  const leads = [
    { ...baseLead, whatsapp_number: "919876543210", contact_phone_e164: null },
    { ...baseLead, whatsapp_number: "911234567890", contact_phone_e164: null },
  ];
  const result = filterLeads(leads, { q: "+91 98765 43210" });
  assert.equal(result.length, 1);
  assert.equal(result[0].whatsapp_number, "919876543210");
});

test("filterLeads: formatted Indian phone matches contact_phone_e164", () => {
  const leads = [
    { ...baseLead, whatsapp_number: "999999999", contact_phone_e164: "+91 98765-43210" },
    { ...baseLead, whatsapp_number: "888888888", contact_phone_e164: "+91 1234567890" },
  ];
  const result = filterLeads(leads, { q: "+91 98765 43210" });
  assert.equal(result.length, 1);
  assert.equal(result[0].contact_phone_e164, "+91 98765-43210");
});

test("filterLeads: letters-only query never matches phone", () => {
  const leads = [
    { ...baseLead, whatsapp_number: "919876543210", contact_phone_e164: "+1-555-123-4567" },
  ];
  const result = filterLeads(leads, { q: "abcdef" });
  assert.equal(result.length, 0);
});

test("filterLeads: escalated filter", () => {
  const leads = [
    { ...baseLead, escalated: true },
    { ...baseLead, escalated: false },
  ];
  const result = filterLeads(leads, { escalated: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].escalated, true);
});

test("filterLeads: combined escalated and source filter", () => {
  const leads = [
    { ...baseLead, escalated: true, source: "whatsapp" },
    { ...baseLead, escalated: true, source: "instagram" },
    { ...baseLead, escalated: false, source: "whatsapp" },
  ];
  const result = filterLeads(leads, { escalated: true, source: "whatsapp" });
  assert.equal(result.length, 1);
  assert.equal(result[0].escalated, true);
  assert.equal(result[0].source, "whatsapp");
});

test("filterLeads: match origin", () => {
  const leads = [
    { ...baseLead, origin: "Mumbai" },
    { ...baseLead, origin: "Delhi" },
  ];
  const result = filterLeads(leads, { q: "mumbai" });
  assert.equal(result.length, 1);
});

test("filterLeads: match destination", () => {
  const leads = [
    { ...baseLead, destination: "Bangalore" },
    { ...baseLead, destination: "Chennai" },
  ];
  const result = filterLeads(leads, { q: "bangalore" });
  assert.equal(result.length, 1);
});

test("filterLeads: match move_type", () => {
  const leads = [
    { ...baseLead, move_type: "local" },
    { ...baseLead, move_type: "intercity" },
  ];
  const result = filterLeads(leads, { q: "local" });
  assert.equal(result.length, 1);
});

test("filterLeads: source exact match", () => {
  const leads = [
    { ...baseLead, source: "whatsapp" },
    { ...baseLead, source: "instagram" },
  ];
  const result = filterLeads(leads, { source: "instagram" });
  assert.equal(result.length, 1);
  assert.equal(result[0].source, "instagram");
});

test("filterLeads: status exact match", () => {
  const leads = [
    { ...baseLead, status: "new" },
    { ...baseLead, status: "in_progress" },
  ];
  const result = filterLeads(leads, { status: "new" });
  assert.equal(result.length, 1);
  assert.equal(result[0].status, "new");
});

test("filterLeads: awaiting filter", () => {
  const leads = [
    { ...baseLead, last_direction: "inbound" as const, closed_at: null },
    { ...baseLead, last_direction: "outbound" as const, closed_at: null },
  ];
  const result = filterLeads(leads, { awaiting: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].last_direction, "inbound");
});

test("filterLeads: combined filters", () => {
  const leads = [
    {
      ...baseLead,
      contact_display_name: "Alice",
      source: "whatsapp",
      status: "new",
      last_direction: "inbound" as const,
      closed_at: null,
    },
    {
      ...baseLead,
      contact_display_name: "Alice",
      source: "instagram",
      status: "new",
      last_direction: "inbound" as const,
      closed_at: null,
    },
    {
      ...baseLead,
      contact_display_name: "Bob",
      source: "whatsapp",
      status: "new",
      last_direction: "inbound" as const,
      closed_at: null,
    },
  ];
  const result = filterLeads(leads, {
    q: "alice",
    source: "whatsapp",
    status: "new",
    awaiting: true,
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].contact_display_name, "Alice");
  assert.equal(result[0].source, "whatsapp");
});

test("countBy: source ordering by count then value", () => {
  const leads = [
    { ...baseLead, source: "whatsapp" },
    { ...baseLead, source: "whatsapp" },
    { ...baseLead, source: "instagram" },
    { ...baseLead, source: "instagram" },
    { ...baseLead, source: "instagram" },
    { ...baseLead, source: "justdial" },
  ];
  const result = countBy(leads, "source");
  assert.equal(result.length, 3);
  assert.deepEqual(result[0], { value: "instagram", count: 3 });
  assert.deepEqual(result[1], { value: "whatsapp", count: 2 });
  assert.deepEqual(result[2], { value: "justdial", count: 1 });
});

test("countBy: null source counted as unknown", () => {
  const leads = [
    { ...baseLead, source: "whatsapp" },
    { ...baseLead, source: null },
    { ...baseLead, source: null },
  ];
  const result = countBy(leads, "source");
  const unknownCount = result.find((r) => r.value === "unknown");
  assert.equal(unknownCount?.count, 2);
});

test("buildInboxHref: encoding and omission of empty values", () => {
  assert.equal(buildInboxHref({}, { q: "hello world" }), "/?q=hello%20world");
  assert.equal(buildInboxHref({}, { source: "whatsapp" }), "/?source=whatsapp");
  assert.equal(buildInboxHref({}, { status: "new" }), "/?status=new");
  assert.equal(buildInboxHref({}, { awaiting: true }), "/?awaiting=1");
  assert.equal(
    buildInboxHref({}, { q: "test", source: "instagram" }),
    "/?q=test&source=instagram"
  );
  assert.equal(buildInboxHref({}, {}), "/");
});

test("buildInboxHref: overrides clearing a value", () => {
  assert.equal(
    buildInboxHref({ q: "test", source: "whatsapp" }, { source: "" }),
    "/?q=test"
  );
  assert.equal(
    buildInboxHref({ awaiting: true }, { awaiting: false }),
    "/"
  );
});

test("buildInboxHref: awaiting and escalated both true", () => {
  assert.equal(
    buildInboxHref({}, { awaiting: true, escalated: true }),
    "/?awaiting=1&escalated=1"
  );
});
