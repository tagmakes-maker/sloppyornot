// Core loop acceptance test. Node built-ins only. Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const schema = readJson("shared/profile.schema.json");
const seedFiles = readdirSync(join(root, "seed")).filter((f) => f.endsWith(".json"));
const seeds = Object.fromEntries(seedFiles.map((f) => [f, readJson(`seed/${f}`)]));
const byId = Object.fromEntries(Object.values(seeds).map((p) => [p.id, p]));

// Minimal validator for the subset of JSON Schema the contract uses.
function validate(value, s, path = "$") {
  const errors = [];
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  if (s.type) {
    const ok =
      s.type === type ||
      (s.type === "integer" && Number.isInteger(value)) ||
      (s.type === "number" && type === "number");
    if (!ok) return [`${path}: expected ${s.type}, got ${type}`];
  }
  if (s.enum && !s.enum.includes(value)) errors.push(`${path}: ${JSON.stringify(value)} not in ${s.enum.join(", ")}`);
  if (typeof value === "number") {
    if (s.minimum !== undefined && value < s.minimum) errors.push(`${path}: ${value} below ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) errors.push(`${path}: ${value} above ${s.maximum}`);
  }
  if (typeof value === "string") {
    if (s.maxLength !== undefined && value.length > s.maxLength) errors.push(`${path}: longer than ${s.maxLength}`);
    if (s.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: not a date-time`);
    if (s.format === "uri" && !URL.canParse(value)) errors.push(`${path}: not a uri`);
  }
  if (type === "array") {
    if (s.minItems !== undefined && value.length < s.minItems) errors.push(`${path}: fewer than ${s.minItems} items`);
    if (s.items) value.forEach((v, i) => errors.push(...validate(v, s.items, `${path}[${i}]`)));
  }
  if (type === "object") {
    for (const key of s.required ?? []) if (!(key in value)) errors.push(`${path}: missing ${key}`);
    for (const [key, v] of Object.entries(value)) {
      if (s.properties?.[key]) errors.push(...validate(v, s.properties[key], `${path}.${key}`));
      else if (s.additionalProperties === false) errors.push(`${path}: unexpected field ${key}`);
    }
  }
  return errors;
}

// Weakness rules from docs/scoring.md and agent/tools.md. Returns [{ tag, distance }].
function weaknesses(p) {
  const h = p.human_review ?? {};
  const a = p.automated_checks ?? {};
  const out = [];
  const low = (v, tag) => v !== undefined && v < 0.5 && out.push({ tag, distance: 0.5 - v });
  low(h.understood_immediately, "onboarding");
  low(h.easy_to_use, "ux");
  low(h.would_use, "value-prop");
  low(h.feels_distinctive, "differentiation");
  if (h.looks_like_slop >= 0.5) out.push({ tag: "polish", distance: h.looks_like_slop - 0.5 });
  if (a.loads === false) out.push({ tag: "reliability", distance: 0.15 });
  if (a.console_errors > 0) out.push({ tag: "reliability", distance: 0.15 });
  if (a.performance < 50) out.push({ tag: "performance", distance: (50 - a.performance) / 100 });
  if (a.accessibility < 50) out.push({ tag: "accessibility", distance: (50 - a.accessibility) / 100 });
  if (a.mobile_ok === false) out.push({ tag: "mobile", distance: 0.15 });
  if (a.security_headers === false) out.push({ tag: "security", distance: 0.15 });
  return out.sort((x, y) => y.distance - x.distance);
}

test("seed pool has five products", () => {
  assert.equal(seedFiles.length, 5, `found ${seedFiles.join(", ")}`);
});

for (const [file, p] of Object.entries(seeds)) {
  test(`${file} validates against the schema`, () => {
    assert.deepEqual(validate(p, schema), []);
    assert.equal(p.is_seed, true);
    assert.equal(p.status, "seed");
    assert.equal(`${p.id}.json`, file, "file name must match id");
  });

  test(`${file} is verified and has automated checks`, () => {
    assert.ok(p.human_review.swipe_count >= 5, "needs 5 or more swipes");
    assert.equal(p.human_review.verified, true);
    assert.ok(p.automated_checks, "automated_checks required");
  });

  test(`${file} weaknesses match the scoring rules`, () => {
    const derived = [...new Set(weaknesses(p).map((w) => w.tag))].sort();
    assert.deepEqual([...p.weaknesses].sort(), derived);
  });

  test(`${file} has no em dashes`, () => {
    assert.ok(!JSON.stringify(p).includes("\u2014"));
  });
}

test("demo pair: firstrun fills floodwatch-chs's weakest tag", () => {
  const a = byId["floodwatch-chs"];
  const b = byId["firstrun"];
  const weakest = weaknesses(a)[0].tag;
  assert.equal(weakest, "onboarding");
  assert.ok(b.capabilities.includes(weakest));
  assert.equal(b.capabilities[0], weakest, "the gap is B's core capability");
});

test("decoy: helpdock looks like firstrun but does not fill the gap", () => {
  const decoy = byId["helpdock"].capabilities;
  assert.ok(decoy.some((c) => byId["firstrun"].capabilities.includes(c)), "decoy should share a tag with B");
  assert.ok(!decoy.includes(weaknesses(byId["floodwatch-chs"])[0].tag));
});

test("no match: nothing in the pool fills porchlight's gaps", () => {
  const gaps = weaknesses(byId["porchlight"]).map((w) => w.tag);
  assert.ok(gaps.length > 0);
  for (const p of Object.values(byId)) {
    if (p.id === "porchlight") continue;
    for (const g of gaps) assert.ok(!p.capabilities.includes(g), `${p.id} fills ${g}`);
  }
});

test("fallback: shiftswap-chs fills the gap as a secondary capability", () => {
  const caps = byId["shiftswap-chs"].capabilities;
  assert.ok(caps.includes("onboarding"));
  assert.notEqual(caps[0], "onboarding");
});

for (const f of readdirSync(join(root, "agent/evals")).filter((f) => f.endsWith(".json"))) {
  test(`eval ${f} points at real files`, () => {
    const e = readJson(`agent/evals/${f}`);
    for (const p of [e.prompt, e.input.product_a, ...e.input.candidates]) {
      assert.ok(existsSync(join(root, p)), `${p} missing`);
    }
  });
}

test("every prompt ends with the human-decides line", () => {
  for (const f of ["observe", "find-gap", "propose-match", "blueprint"]) {
    const text = readFileSync(join(root, `agent/prompts/${f}.md`), "utf8").trim();
    assert.ok(text.endsWith("Humans decide. Propose and explain. Never act on a match without approval."), f);
  }
});
