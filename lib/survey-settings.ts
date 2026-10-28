export const SURVEY_SETTING_KEYS = [
  "SURVEY_WORKDAYS",
  "SURVEY_WORK_START",
  "SURVEY_WORK_END",
  "SURVEY_BREAK_START",
  "SURVEY_BREAK_END",
  "SURVEY_DURATION_MINUTES",
  "SURVEY_BUFFER_MINUTES",
  "SURVEY_SLOT_STEP_MINUTES",
  "SURVEY_CONCURRENCY",
  "SURVEY_MIN_NOTICE_HOURS",
  "SURVEY_MAX_DAYS_AHEAD",
  "SURVEY_HOLIDAYS",
] as const;

export const SURVEY_SETTING_LABELS: Record<string, string> = {
  SURVEY_WORKDAYS: "Working days",
  SURVEY_WORK_START: "Work start time",
  SURVEY_WORK_END: "Work end time",
  SURVEY_BREAK_START: "Lunch break start",
  SURVEY_BREAK_END: "Lunch break end",
  SURVEY_DURATION_MINUTES: "Survey length (minutes)",
  SURVEY_BUFFER_MINUTES: "Buffer time (minutes)",
  SURVEY_SLOT_STEP_MINUTES: "Slot step (minutes)",
  SURVEY_CONCURRENCY: "Concurrent surveys",
  SURVEY_MIN_NOTICE_HOURS: "Minimum notice (hours)",
  SURVEY_MAX_DAYS_AHEAD: "Maximum days ahead",
  SURVEY_HOLIDAYS: "Holidays",
};

export interface SurveySettingsForm {
  workdays: string[];
  workStart: string;
  workEnd: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
  durationMinutes: string;
  bufferMinutes: string;
  slotStepMinutes: string;
  concurrency: string;
  minNoticeHours: string;
  maxDaysAhead: string;
  holidays: string[];
}

export const DAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export function valuesToForm(values: Record<string, string>): SurveySettingsForm {
  const workdays = values.SURVEY_WORKDAYS ? values.SURVEY_WORKDAYS.split(",").filter(Boolean) : [];
  const orderedWorkdays = DAY_OPTIONS.map(d => d.key).filter(k => workdays.includes(k));

  const breakStart = values.SURVEY_BREAK_START || "none";
  const breakEnd = values.SURVEY_BREAK_END || "none";
  const breakEnabled = breakStart !== "none" && breakEnd !== "none";

  const holidays = values.SURVEY_HOLIDAYS ? values.SURVEY_HOLIDAYS.split(",").filter(Boolean) : [];
  const sortedHolidays = [...new Set(holidays)].sort();

  return {
    workdays: orderedWorkdays,
    workStart: values.SURVEY_WORK_START || "",
    workEnd: values.SURVEY_WORK_END || "",
    breakEnabled,
    breakStart: breakEnabled ? breakStart : "",
    breakEnd: breakEnabled ? breakEnd : "",
    durationMinutes: values.SURVEY_DURATION_MINUTES || "",
    bufferMinutes: values.SURVEY_BUFFER_MINUTES || "",
    slotStepMinutes: values.SURVEY_SLOT_STEP_MINUTES || "",
    concurrency: values.SURVEY_CONCURRENCY || "",
    minNoticeHours: values.SURVEY_MIN_NOTICE_HOURS || "",
    maxDaysAhead: values.SURVEY_MAX_DAYS_AHEAD || "",
    holidays: sortedHolidays,
  };
}

export function formToValues(form: SurveySettingsForm): Record<string, string> {
  const orderedWorkdays = DAY_OPTIONS.map(d => d.key).filter(k => form.workdays.includes(k));
  const sortedHolidays = [...new Set(form.holidays)].sort();

  return {
    SURVEY_WORKDAYS: orderedWorkdays.join(","),
    SURVEY_WORK_START: form.workStart,
    SURVEY_WORK_END: form.workEnd,
    SURVEY_BREAK_START: form.breakEnabled ? form.breakStart : "none",
    SURVEY_BREAK_END: form.breakEnabled ? form.breakEnd : "none",
    SURVEY_DURATION_MINUTES: form.durationMinutes,
    SURVEY_BUFFER_MINUTES: form.bufferMinutes,
    SURVEY_SLOT_STEP_MINUTES: form.slotStepMinutes,
    SURVEY_CONCURRENCY: form.concurrency,
    SURVEY_MIN_NOTICE_HOURS: form.minNoticeHours,
    SURVEY_MAX_DAYS_AHEAD: form.maxDaysAhead,
    SURVEY_HOLIDAYS: sortedHolidays.join(","),
  };
}

export function validateForm(form: SurveySettingsForm): string[] {
  const errors: string[] = [];

  if (form.workdays.length === 0) {
    errors.push("At least one working day must be selected");
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(form.workStart)) {
    errors.push("Work start time must be in HH:MM format");
  }
  if (!timeRegex.test(form.workEnd)) {
    errors.push("Work end time must be in HH:MM format");
  }
  if (timeRegex.test(form.workStart) && timeRegex.test(form.workEnd)) {
    if (form.workEnd <= form.workStart) {
      errors.push("Work end time must be after start time");
    }
  }

  if (form.breakEnabled) {
    if (!timeRegex.test(form.breakStart)) {
      errors.push("Lunch break start time must be in HH:MM format");
    }
    if (!timeRegex.test(form.breakEnd)) {
      errors.push("Lunch break end time must be in HH:MM format");
    }
    if (timeRegex.test(form.breakStart) && timeRegex.test(form.breakEnd)) {
      if (form.breakEnd <= form.breakStart) {
        errors.push("Lunch break end time must be after start time");
      }
    }
    if (timeRegex.test(form.workStart) && timeRegex.test(form.workEnd) && timeRegex.test(form.breakStart) && timeRegex.test(form.breakEnd)) {
      if (form.breakStart < form.workStart || form.breakEnd > form.workEnd) {
        errors.push("Lunch break must be within working hours");
      }
    }
  }

  const validateNumber = (value: string, field: string, min: number, max: number) => {
    if (value === "") {
      errors.push(`${field} is required`);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      errors.push(`${field} must be an integer`);
    } else if (num < min || num > max) {
      errors.push(`${field} must be between ${min} and ${max}`);
    }
  };

  validateNumber(form.durationMinutes, "Survey length", 15, 240);
  validateNumber(form.bufferMinutes, "Buffer time", 0, 120);
  validateNumber(form.slotStepMinutes, "Slot step", 15, 240);
  validateNumber(form.concurrency, "Concurrent surveys", 1, 10);
  validateNumber(form.minNoticeHours, "Minimum notice", 0, 168);
  validateNumber(form.maxDaysAhead, "Maximum days ahead", 1, 60);

  for (const holiday of form.holidays) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(holiday)) {
      errors.push(`Holiday "${holiday}" is not a valid date (must be YYYY-MM-DD)`);
      continue;
    }
    const date = new Date(holiday);
    if (isNaN(date.getTime())) {
      errors.push(`Holiday "${holiday}" is not a valid date`);
    }
  }

  return errors;
}

export function addHoliday(list: string[], date: string): string[] {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return list;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return list;
  }
  const newList = [...new Set([...list, date])];
  return newList.sort();
}

export function removeHoliday(list: string[], date: string): string[] {
  return list.filter(h => h !== date);
}

export function friendlyError(message: string): string {
  let result = message;
  for (const key of SURVEY_SETTING_KEYS) {
    const label = SURVEY_SETTING_LABELS[key];
    if (label) {
      result = result.replace(new RegExp(key, "g"), label);
    }
  }
  return result;
}
