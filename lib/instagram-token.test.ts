import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenHeadline, shouldShowBanner, bannerText, refreshErrorMessage, type InstagramTokenStatus } from "./instagram-token";

const baseStatus: InstagramTokenStatus = {
  ok: true,
  configured: true,
  source: "database",
  level: "ok",
  daysLeft: 30,
  expiresAt: "2026-11-24T00:00:00Z",
  refreshedAt: "2026-10-24T00:00:00Z",
  lastAttemptAt: null,
  lastError: null,
};

test("tokenHeadline: not configured", () => {
  const status = { ...baseStatus, configured: false };
  assert.equal(tokenHeadline(status), "Instagram is not connected");
});

test("tokenHeadline: expired", () => {
  const status = { ...baseStatus, level: "expired" as const };
  assert.equal(tokenHeadline(status), "The Instagram access token has expired");
});

test("tokenHeadline: ok with 30 days", () => {
  const status = { ...baseStatus, level: "ok" as const, daysLeft: 30 };
  assert.equal(tokenHeadline(status), "The Instagram access token is valid for about 30 more day(s)");
});

test("tokenHeadline: ok with 1 day (singular)", () => {
  const status = { ...baseStatus, level: "ok" as const, daysLeft: 1 };
  assert.equal(tokenHeadline(status), "The Instagram access token is valid for about 1 more day");
});

test("tokenHeadline: warning with 5 days", () => {
  const status = { ...baseStatus, level: "warning" as const, daysLeft: 5 };
  assert.equal(tokenHeadline(status), "The Instagram access token is valid for about 5 more day(s)");
});

test("tokenHeadline: critical with 2 days", () => {
  const status = { ...baseStatus, level: "critical" as const, daysLeft: 2 };
  assert.equal(tokenHeadline(status), "The Instagram access token is valid for about 2 more day(s)");
});

test("tokenHeadline: unknown", () => {
  const status = { ...baseStatus, level: "unknown" as const, daysLeft: null };
  assert.equal(tokenHeadline(status), "Token expiry is not known yet (it is checked automatically)");
});

test("tokenHeadline: ok but daysLeft is null", () => {
  const status = { ...baseStatus, level: "ok" as const, daysLeft: null };
  assert.equal(tokenHeadline(status), "Token expiry is not known yet (it is checked automatically)");
});

test("shouldShowBanner: null input", () => {
  assert.equal(shouldShowBanner(null), false);
});

test("shouldShowBanner: not configured", () => {
  const status = { ...baseStatus, configured: false };
  assert.equal(shouldShowBanner(status), false);
});

test("shouldShowBanner: ok level", () => {
  const status = { ...baseStatus, level: "ok" as const };
  assert.equal(shouldShowBanner(status), false);
});

test("shouldShowBanner: unknown level", () => {
  const status = { ...baseStatus, level: "unknown" as const };
  assert.equal(shouldShowBanner(status), false);
});

test("shouldShowBanner: warning level", () => {
  const status = { ...baseStatus, level: "warning" as const };
  assert.equal(shouldShowBanner(status), true);
});

test("shouldShowBanner: critical level", () => {
  const status = { ...baseStatus, level: "critical" as const };
  assert.equal(shouldShowBanner(status), true);
});

test("shouldShowBanner: expired level", () => {
  const status = { ...baseStatus, level: "expired" as const };
  assert.equal(shouldShowBanner(status), true);
});

test("bannerText: expired", () => {
  const status = { ...baseStatus, level: "expired" as const };
  assert.equal(
    bannerText(status),
    "Instagram messaging will stop working: the access token has expired. Create a new token in the Meta app dashboard and put it in INSTAGRAM_ACCESS_TOKEN."
  );
});

test("bannerText: critical with 2 days", () => {
  const status = { ...baseStatus, level: "critical" as const, daysLeft: 2 };
  assert.equal(
    bannerText(status),
    "Instagram token expires in about 2 day(s). Automatic refresh may be failing; open Settings."
  );
});

test("bannerText: warning with 5 days", () => {
  const status = { ...baseStatus, level: "warning" as const, daysLeft: 5 };
  assert.equal(
    bannerText(status),
    "Instagram token expires in about 5 day(s). Automatic refresh may be failing; open Settings."
  );
});

test("bannerText: ok level returns empty string", () => {
  const status = { ...baseStatus, level: "ok" as const };
  assert.equal(bannerText(status), "");
});

test("refreshErrorMessage: with error text", () => {
  assert.equal(refreshErrorMessage("Token refresh failed"), "Token refresh failed");
});

test("refreshErrorMessage: null", () => {
  assert.equal(refreshErrorMessage(null), "Something went wrong. Please try again.");
});

test("refreshErrorMessage: undefined", () => {
  assert.equal(refreshErrorMessage(undefined), "Something went wrong. Please try again.");
});

test("refreshErrorMessage: blank string", () => {
  assert.equal(refreshErrorMessage("   "), "Something went wrong. Please try again.");
});

test("refreshErrorMessage: empty string", () => {
  assert.equal(refreshErrorMessage(""), "Something went wrong. Please try again.");
});
