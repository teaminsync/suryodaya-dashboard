import { test } from "node:test";
import assert from "node:assert/strict";
import {
  valuesToForm,
  formToValues,
  validateForm,
  addHoliday,
  removeHoliday,
  friendlyError,
} from "./survey-settings";

test("round trip default values", () => {
  const values = {
    SURVEY_WORKDAYS: "mon,tue,wed,thu,fri,sat",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "13:00",
    SURVEY_BREAK_END: "14:00",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  };

  const form = valuesToForm(values);
  const result = formToValues(form);

  assert.deepStrictEqual(result, values);
});

test("break none", () => {
  const values = {
    SURVEY_WORKDAYS: "mon,tue,wed,thu,fri",
    SURVEY_WORK_START: "09:00",
    SURVEY_WORK_END: "17:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "45",
    SURVEY_BUFFER_MINUTES: "15",
    SURVEY_SLOT_STEP_MINUTES: "30",
    SURVEY_CONCURRENCY: "2",
    SURVEY_MIN_NOTICE_HOURS: "24",
    SURVEY_MAX_DAYS_AHEAD: "30",
    SURVEY_HOLIDAYS: "",
  };

  const form = valuesToForm(values);
  assert.strictEqual(form.breakEnabled, false);
  assert.strictEqual(form.breakStart, "");
  assert.strictEqual(form.breakEnd, "");

  const result = formToValues(form);
  assert.strictEqual(result.SURVEY_BREAK_START, "none");
  assert.strictEqual(result.SURVEY_BREAK_END, "none");
});

test("holidays sorted and de-duplicated", () => {
  const values = {
    SURVEY_WORKDAYS: "mon,tue",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "0",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "0",
    SURVEY_MAX_DAYS_AHEAD: "7",
    SURVEY_HOLIDAYS: "2026-12-25,2026-01-01,2026-12-25,2026-08-15",
  };

  const form = valuesToForm(values);
  assert.deepStrictEqual(form.holidays, ["2026-01-01", "2026-08-15", "2026-12-25"]);

  const result = formToValues(form);
  assert.strictEqual(result.SURVEY_HOLIDAYS, "2026-01-01,2026-08-15,2026-12-25");
});

test("validateForm no workday selected", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("At least one working day")));
});

test("validateForm invalid time format", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "25:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Work end time must be in HH:MM format")));
});

test("validateForm end not after start", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "18:00",
    SURVEY_WORK_END: "10:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Work end time must be after start time")));
});

test("validateForm break outside work hours", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "09:00",
    SURVEY_BREAK_END: "10:00",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });
  form.breakEnabled = true;

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Lunch break must be within working hours")));
});

test("validateForm break end not after start", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "14:00",
    SURVEY_BREAK_END: "13:00",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });
  form.breakEnabled = true;

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Lunch break end time must be after start time")));
});

test("validateForm duration boundary 14 invalid", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "14",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Survey length") && e.includes("between 15 and 240")));
});

test("validateForm duration boundary 15 valid", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "15",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(!errors.some(e => e.includes("Survey length")));
});

test("validateForm duration boundary 240 valid", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "240",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(!errors.some(e => e.includes("Survey length")));
});

test("validateForm duration boundary 241 invalid", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "241",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Survey length") && e.includes("between 15 and 240")));
});

test("validateForm number blank", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Survey length is required")));
});

test("validateForm number non-integer", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60.5",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("Survey length must be an integer")));
});

test("validateForm invalid holiday", () => {
  const form = valuesToForm({
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "2026-13-40",
  });

  const errors = validateForm(form);
  assert.ok(errors.some(e => e.includes("2026-13-40") && e.includes("not a valid date")));
});

test("addHoliday ignores invalid date", () => {
  const list = ["2026-01-01"];
  const result = addHoliday(list, "2026-13-40");
  assert.deepStrictEqual(result, ["2026-01-01"]);
});

test("addHoliday ignores duplicate", () => {
  const list = ["2026-01-01", "2026-12-25"];
  const result = addHoliday(list, "2026-01-01");
  assert.deepStrictEqual(result, ["2026-01-01", "2026-12-25"]);
});

test("addHoliday does not mutate input", () => {
  const list = ["2026-01-01"];
  const original = [...list];
  addHoliday(list, "2026-12-25");
  assert.deepStrictEqual(list, original);
});

test("addHoliday sorts", () => {
  const list = ["2026-12-25"];
  const result = addHoliday(list, "2026-01-01");
  assert.deepStrictEqual(result, ["2026-01-01", "2026-12-25"]);
});

test("removeHoliday removes date", () => {
  const list = ["2026-01-01", "2026-12-25"];
  const result = removeHoliday(list, "2026-01-01");
  assert.deepStrictEqual(result, ["2026-12-25"]);
});

test("friendlyError replaces key names", () => {
  const message = "SURVEY_DURATION_MINUTES must be between 15 and 240";
  const result = friendlyError(message);
  assert.strictEqual(result, "Survey length (minutes) must be between 15 and 240");
});

test("valuesToForm with empty holidays string", () => {
  const values = {
    SURVEY_WORKDAYS: "mon",
    SURVEY_WORK_START: "10:00",
    SURVEY_WORK_END: "18:00",
    SURVEY_BREAK_START: "none",
    SURVEY_BREAK_END: "none",
    SURVEY_DURATION_MINUTES: "60",
    SURVEY_BUFFER_MINUTES: "30",
    SURVEY_SLOT_STEP_MINUTES: "60",
    SURVEY_CONCURRENCY: "1",
    SURVEY_MIN_NOTICE_HOURS: "6",
    SURVEY_MAX_DAYS_AHEAD: "14",
    SURVEY_HOLIDAYS: "",
  };

  const form = valuesToForm(values);
  assert.deepStrictEqual(form.holidays, []);
});
