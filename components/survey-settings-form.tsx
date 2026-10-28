"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SurveySettingsInfo } from "@/lib/internal-api";
import {
  valuesToForm,
  formToValues,
  validateForm,
  addHoliday,
  removeHoliday,
  friendlyError,
  DAY_OPTIONS,
  type SurveySettingsForm,
} from "@/lib/survey-settings";

interface SurveySettingsFormProps {
  initial: SurveySettingsInfo;
}

export function SurveySettingsFormComponent({ initial }: SurveySettingsFormProps) {
  const router = useRouter();
  const [info, setInfo] = useState<SurveySettingsInfo>(initial);
  const [form, setForm] = useState<SurveySettingsForm>(() => valuesToForm(initial.values));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newHoliday, setNewHoliday] = useState("");

  const handleSave = async () => {
    const validationErrors = validateForm(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResult(null);
      return;
    }

    setLoading(true);
    setErrors([]);
    setResult(null);

    try {
      const response = await fetch("/api/settings/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: formToValues(form) }),
      });

      const data = await response.json();

      if (response.status === 200 && data.ok) {
        setInfo(data);
        setForm(valuesToForm(data.values));
        setResult({ type: "success", message: "Saved" });
        router.refresh();
      } else if (response.status === 400 && data.errors) {
        const friendlyErrors = data.errors.map((e: string) => friendlyError(e));
        setErrors(friendlyErrors);
        setResult({ type: "error", message: "Please fix the errors below" });
      } else {
        setResult({ type: "error", message: "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all settings to .env defaults? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setErrors([]);
    setResult(null);

    try {
      const response = await fetch("/api/settings/survey/reset", {
        method: "POST",
      });

      const data = await response.json();

      if (response.status === 200 && data.ok) {
        setInfo(data);
        setForm(valuesToForm(data.values));
        setResult({ type: "success", message: "Reset" });
        router.refresh();
      } else {
        setResult({ type: "error", message: "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    const updated = addHoliday(form.holidays, newHoliday);
    if (updated.length > form.holidays.length) {
      setForm({ ...form, holidays: updated });
      setNewHoliday("");
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setForm({ ...form, holidays: removeHoliday(form.holidays, date) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={info.source === "database" ? "default" : "secondary"}>
          {info.source === "database" ? "Using saved settings" : "Using .env defaults"}
        </Badge>
        {info.updatedAt && (
          <span className="text-sm text-gray-600">
            Last updated: {new Date(info.updatedAt).toLocaleString()}
            {info.updatedBy && ` by ${info.updatedBy}`}
          </span>
        )}
      </div>

      {info.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <h4 className="font-semibold text-sm mb-2">Warnings</h4>
          <ul className="text-sm space-y-1">
            {info.warnings.map((warning, index) => (
              <li key={index} className="text-amber-800">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-gray-600">
        All times are India time. Changes apply to new survey offers only; surveys already booked are not changed.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Working days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {DAY_OPTIONS.map((day) => (
              <div key={day.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`day-${day.key}`}
                  checked={form.workdays.includes(day.key)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({
                      ...form,
                      workdays: checked
                        ? [...form.workdays, day.key]
                        : form.workdays.filter((d) => d !== day.key),
                    });
                  }}
                  disabled={loading}
                />
                <Label htmlFor={`day-${day.key}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="work-start">Start time</Label>
              <Input
                id="work-start"
                type="time"
                value={form.workStart}
                onChange={(e) => setForm({ ...form, workStart: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="work-end">End time</Label>
              <Input
                id="work-end"
                type="time"
                value={form.workEnd}
                onChange={(e) => setForm({ ...form, workEnd: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lunch break</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              id="break-enabled"
              checked={form.breakEnabled}
              onCheckedChange={(checked) =>
                setForm({ ...form, breakEnabled: checked })
              }
              disabled={loading}
            />
            <Label htmlFor="break-enabled">Enable lunch break</Label>
          </div>
          {form.breakEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="break-start">Start time</Label>
                <Input
                  id="break-start"
                  type="time"
                  value={form.breakStart}
                  onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="break-end">End time</Label>
                <Input
                  id="break-end"
                  type="time"
                  value={form.breakEnd}
                  onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Survey rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="duration">Survey length (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={240}
              step={1}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">How long each survey takes</p>
          </div>
          <div>
            <Label htmlFor="buffer">Buffer time (minutes)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              max={120}
              step={1}
              value={form.bufferMinutes}
              onChange={(e) => setForm({ ...form, bufferMinutes: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Free time kept before and after each survey for travel</p>
          </div>
          <div>
            <Label htmlFor="slot-step">Slot step (minutes)</Label>
            <Input
              id="slot-step"
              type="number"
              min={15}
              max={240}
              step={1}
              value={form.slotStepMinutes}
              onChange={(e) => setForm({ ...form, slotStepMinutes: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Time between offered slots</p>
          </div>
          <div>
            <Label htmlFor="concurrency">Concurrent surveys</Label>
            <Input
              id="concurrency"
              type="number"
              min={1}
              max={10}
              step={1}
              value={form.concurrency}
              onChange={(e) => setForm({ ...form, concurrency: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">How many surveys can overlap, i.e. number of surveyors</p>
          </div>
          <div>
            <Label htmlFor="min-notice">Minimum notice (hours)</Label>
            <Input
              id="min-notice"
              type="number"
              min={0}
              max={168}
              step={1}
              value={form.minNoticeHours}
              onChange={(e) => setForm({ ...form, minNoticeHours: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">How far ahead a survey must be booked</p>
          </div>
          <div>
            <Label htmlFor="max-days">Maximum days ahead</Label>
            <Input
              id="max-days"
              type="number"
              min={1}
              max={60}
              step={1}
              value={form.maxDaysAhead}
              onChange={(e) => setForm({ ...form, maxDaysAhead: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">How far in the future customers can book</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleAddHoliday} disabled={loading || !newHoliday}>
              Add
            </Button>
          </div>
          {form.holidays.length > 0 && (
            <div className="space-y-2">
              {form.holidays.map((date) => (
                <div key={date} className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm">{date}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveHoliday(date)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          {form.holidays.length === 0 && (
            <p className="text-sm text-gray-500">No holidays configured</p>
          )}
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <ul className="text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-800">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <p className={`text-sm ${result.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {result.message}
        </p>
      )}

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={loading}>
          Save
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          Reset to defaults from .env
        </Button>
      </div>
    </div>
  );
}
