import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedOrigin } from "./origin";

test("no Origin -> true", () => {
  assert.equal(
    isAllowedOrigin({ origin: null, host: "example.com", forwardedHost: null }),
    true
  );
});

test("same host -> true", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://example.com",
      host: "example.com",
      forwardedHost: null,
    }),
    true
  );
});

test("different host -> false", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://evil.com",
      host: "example.com",
      forwardedHost: null,
    }),
    false
  );
});

test("port mismatch -> false", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://example.com:8080",
      host: "example.com",
      forwardedHost: null,
    }),
    false
  );
});

test("forwardedHost wins over host", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://forwarded.com",
      host: "example.com",
      forwardedHost: "forwarded.com",
    }),
    true
  );
});

test("comma-separated forwardedHost", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://first.com",
      host: "example.com",
      forwardedHost: "first.com, second.com",
    }),
    true
  );
});

test("invalid origin string -> false", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "not a valid url",
      host: "example.com",
      forwardedHost: null,
    }),
    false
  );
});

test("origin present but no host -> false", () => {
  assert.equal(
    isAllowedOrigin({ origin: "https://example.com", host: null, forwardedHost: null }),
    false
  );
});

test("case-insensitive", () => {
  assert.equal(
    isAllowedOrigin({
      origin: "https://Example.COM",
      host: "example.com",
      forwardedHost: null,
    }),
    true
  );
});
