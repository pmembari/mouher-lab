import test from "node:test";
import assert from "node:assert/strict";
import { colorDisplayName } from "./colors.js";

test("Persian catalog colors have English display labels without changing filter values", () => {
  const color = { value: "مشکی", label: "مشکی", labelFa: "مشکی" };
  assert.equal(colorDisplayName(color, "english"), "Black");
  assert.equal(colorDisplayName(color, "farsi"), "مشکی");
  assert.equal(color.value, "مشکی");
  assert.equal(colorDisplayName({ label: "سرمه‌ای" }, "english"), "Navy");
  assert.equal(colorDisplayName({ label: "طوسی روشن" }, "english"), "Light gray");
});

test("explicit translations and unknown merchant labels remain available", () => {
  assert.equal(colorDisplayName({ label: "خاص", labelEn: "Custom blue" }, "english"), "Custom blue");
  assert.equal(colorDisplayName({ label: "Black" }, "farsi"), "مشکی");
  assert.equal(colorDisplayName({ label: "Midnight sparkle" }, "english"), "Midnight sparkle");
});
