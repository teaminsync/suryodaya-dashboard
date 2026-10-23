import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseItems,
  formatRoomLabel,
  groupCaptures,
  type CaptureLike,
} from "./captures";

test("groupCaptures: same room_key and null qualifier", () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: "bedroom",
      room_qualifier: null,
      suggested_room_label: "Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 10,
      total_estimated_weight_kg: 5,
    },
    {
      id: "2",
      room_key: "bedroom",
      room_qualifier: null,
      suggested_room_label: "Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 8,
      total_estimated_weight_kg: 4,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "Bedroom");
  assert.equal(groups[0].captures.length, 2);
  assert.equal(groups[0].cubicFeet, 18);
  assert.equal(groups[0].weightKg, 9);
});

test("groupCaptures: bedroom with qualifier master and bedroom with null qualifier", () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: "bedroom",
      room_qualifier: "master",
      suggested_room_label: "Master Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 15,
      total_estimated_weight_kg: 10,
    },
    {
      id: "2",
      room_key: "bedroom",
      room_qualifier: null,
      suggested_room_label: "Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 8,
      total_estimated_weight_kg: 5,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Master Bedroom");
  assert.equal(groups[0].captures.length, 1);
  assert.equal(groups[1].label, "Bedroom");
  assert.equal(groups[1].captures.length, 1);
});

test("groupCaptures: qualifier comparison ignores case and whitespace", () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: "bedroom",
      room_qualifier: "Master",
      suggested_room_label: "Master Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 10,
      total_estimated_weight_kg: 5,
    },
    {
      id: "2",
      room_key: "bedroom",
      room_qualifier: " master ",
      suggested_room_label: "Master Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 5,
      total_estimated_weight_kg: 3,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "Master Bedroom");
  assert.equal(groups[0].captures.length, 2);
});

test('groupCaptures: legacy rows with "living_room" and "Living Room"', () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: null,
      room_qualifier: null,
      suggested_room_label: "living_room",
      items: "[]",
      total_estimated_cubic_feet: 20,
      total_estimated_weight_kg: 12,
    },
    {
      id: "2",
      room_key: null,
      room_qualifier: null,
      suggested_room_label: "Living Room",
      items: "[]",
      total_estimated_cubic_feet: 18,
      total_estimated_weight_kg: 10,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "Living Room");
  assert.equal(groups[0].captures.length, 2);
});

test("groupCaptures: subtotals add stored totals and round to 1 decimal", () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: "kitchen",
      room_qualifier: null,
      suggested_room_label: "Kitchen",
      items: "[]",
      total_estimated_cubic_feet: 10.56,
      total_estimated_weight_kg: 5.44,
    },
    {
      id: "2",
      room_key: "kitchen",
      room_qualifier: null,
      suggested_room_label: "Kitchen",
      items: "[]",
      total_estimated_cubic_feet: 8.77,
      total_estimated_weight_kg: 4.89,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cubicFeet, 19.3);
  assert.equal(groups[0].weightKg, 10.3);
});

test("groupCaptures: first-appearance ordering", () => {
  const captures: CaptureLike[] = [
    {
      id: "1",
      room_key: "bedroom",
      room_qualifier: null,
      suggested_room_label: "Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 10,
      total_estimated_weight_kg: 5,
    },
    {
      id: "2",
      room_key: "kitchen",
      room_qualifier: null,
      suggested_room_label: "Kitchen",
      items: "[]",
      total_estimated_cubic_feet: 8,
      total_estimated_weight_kg: 4,
    },
    {
      id: "3",
      room_key: "bedroom",
      room_qualifier: null,
      suggested_room_label: "Bedroom",
      items: "[]",
      total_estimated_cubic_feet: 5,
      total_estimated_weight_kg: 3,
    },
  ];
  const groups = groupCaptures(captures);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Bedroom");
  assert.equal(groups[1].label, "Kitchen");
});

test("parseItems: valid JSON", () => {
  const json = '[{"name":"Chair","quantity":4,"alreadyCounted":false},{"name":"Table","quantity":1,"alreadyCounted":true}]';
  const items = parseItems(json);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { name: "Chair", quantity: 4, alreadyCounted: false });
  assert.deepEqual(items[1], { name: "Table", quantity: 1, alreadyCounted: true });
});

test("parseItems: bad JSON", () => {
  const json = "not valid json";
  const items = parseItems(json);
  assert.deepEqual(items, []);
});

test("parseItems: non-array", () => {
  const json = '{"name":"Chair"}';
  const items = parseItems(json);
  assert.deepEqual(items, []);
});

test("parseItems: missing name skipped", () => {
  const json = '[{"name":"Chair","quantity":2},{"quantity":3},{"name":"","quantity":1}]';
  const items = parseItems(json);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], { name: "Chair", quantity: 2, alreadyCounted: false });
});

test("parseItems: missing quantity defaults to 1", () => {
  const json = '[{"name":"Chair"},{"name":"Table","quantity":"not a number"}]';
  const items = parseItems(json);
  assert.equal(items.length, 2);
  assert.equal(items[0].quantity, 1);
  assert.equal(items[1].quantity, 1);
});

test("parseItems: alreadyCounted true/false/absent", () => {
  const json = '[{"name":"A","alreadyCounted":true},{"name":"B","alreadyCounted":false},{"name":"C"}]';
  const items = parseItems(json);
  assert.equal(items.length, 3);
  assert.equal(items[0].alreadyCounted, true);
  assert.equal(items[1].alreadyCounted, false);
  assert.equal(items[2].alreadyCounted, false);
});

test('formatRoomLabel: "living_room" -> "Living Room"', () => {
  assert.equal(formatRoomLabel("living_room"), "Living Room");
});

test('formatRoomLabel: "master_bedroom" -> "Master Bedroom"', () => {
  assert.equal(formatRoomLabel("master_bedroom"), "Master Bedroom");
});

test('formatRoomLabel: "" -> "Unlabeled"', () => {
  assert.equal(formatRoomLabel(""), "Unlabeled");
});
