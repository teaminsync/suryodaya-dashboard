import { test } from "node:test";
import assert from "node:assert/strict";
import { contactLabel } from "./contact-label";

test("Instagram with name and username", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: "John Doe",
    instagram_username: "johndoe",
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "John Doe", secondary: "@johndoe" });
});

test("Instagram with only name", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: "Jane Smith",
    instagram_username: null,
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Jane Smith", secondary: null });
});

test("Instagram with only username", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: null,
    instagram_username: "acmeuser",
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "@acmeuser", secondary: null });
});

test("Instagram with neither name nor username", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: null,
    instagram_username: null,
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Instagram user", secondary: null });
});

test("Instagram with contact_name fallback", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: null,
    instagram_username: "testuser",
    contact_name: "Test Contact",
  });
  assert.deepEqual(result, { primary: "Test Contact", secondary: "@testuser" });
});

test("Instagram username with leading @ is normalized", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: "Alice",
    instagram_username: "@acme",
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Alice", secondary: "@acme" });
});

test("Instagram treats 'Unknown' as missing", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: "Unknown",
    instagram_username: "realuser",
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "@realuser", secondary: null });
});

test("Instagram treats empty string as missing", () => {
  const result = contactLabel({
    source: "instagram",
    display_name: "",
    instagram_username: "",
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Instagram user", secondary: null });
});

test("WhatsApp with display_name", () => {
  const result = contactLabel({
    source: "whatsapp",
    display_name: "Bob Builder",
    instagram_username: null,
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Bob Builder", secondary: null });
});

test("WhatsApp with only contact_name", () => {
  const result = contactLabel({
    source: "whatsapp",
    display_name: null,
    instagram_username: null,
    contact_name: "Charlie",
  });
  assert.deepEqual(result, { primary: "Charlie", secondary: null });
});

test("WhatsApp with nothing returns Unknown", () => {
  const result = contactLabel({
    source: "whatsapp",
    display_name: null,
    instagram_username: null,
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Unknown", secondary: null });
});

test("null source uses fallback logic", () => {
  const result = contactLabel({
    source: null,
    display_name: "Diana",
    instagram_username: null,
    contact_name: null,
  });
  assert.deepEqual(result, { primary: "Diana", secondary: null });
});
