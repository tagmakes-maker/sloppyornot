// Core loop acceptance test. Node built-ins only. Run with: node --test tests/
//
// Checks three things:
// 1. Every seed/*.json validates against shared/profile.schema.json.
// 2. The demo pair holds: product B carries a capability tag that names one of product A's weaknesses.
// 3. The decoy does not: product C carries no tag that appears in product A's weaknesses.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(root, "shared", "profile.schema.json");
const seedDir = path.join(root, "seed");
const evalsDir = path.join(root, "agent", "evals");

const DEMO_A = "tidecheck";
const DEMO_B = "firststep";
const DECOY_C = "helpharbor";

// Minimal JSON Schema validator. Covers what the contract uses:
// required, type, enum, additionalProperties false, minimum, maximum, minItems, maxLength, items, properties.
function validate(schema, value, where, errors) {
  if (schema.type !== undefined) {
    const ok = checkType(schema.type, value);
    if (!ok) {
      errors.push(`${where}: expected type ${schema.type}, got ${describe(value)}`);
      return;
    }
  }
  if (schema.enum !== undefined && !schema.enum.includes(value)) {
    errors.push(`${where}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${where}: ${value} is below minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${where}: ${value} is above maximum ${schema.maximum}`);
    }
  }
  if (typeof value === "string" && schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push(`${where}: string length ${value.length} exceeds maxLength ${schema.maxLength}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${where}: ${value.length} items is below minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => validate(schema.items, item, `${where}[${i}]`, errors));
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${where}: missing required field "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key in props) {
        validate(props[key], child, `${where}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${where}: unexpected field "${key}" (additionalProperties is false)`);
      }
    }
  }
}

function checkType(type, value) {
  switch (type) {
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "array": return Array.isArray(value);
    case "object": return value !== null && typeof value === "object" && !Array.isArray(value);
    case "null": return value === null;
    default: return true;
  }
}

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const schema = readJson(schemaPath);
const seedFiles = fs.readdirSync(seedDir).filter((f) => f.endsWith(".json")).sort();
const seeds = Object.fromEntries(
  seedFiles.map((f) => {
    const profile = readJson(path.join(seedDir, f));
    return [profile.id, { file: f, profile }];
  })
);

test("seed/ holds at least five products", () => {
  assert.ok(seedFiles.length >= 5, `expected at least 5 seed files, found ${seedFiles.length}`);
});

for (const file of seedFiles) {
  test(`seed/${file} validates against shared/profile.schema.json`, () => {
    const profile = readJson(path.join(seedDir, file));
    const errors = [];
    validate(schema, profile, "profile", errors);
    assert.deepEqual(errors, [], errors.join("\n"));
    assert.equal(profile.is_seed, true, "is_seed must be true");
    assert.equal(profile.status, "seed", 'status must be "seed"');
    assert.equal(`${profile.id}.json`, file, "file name must equal the id slug");
    assert.match(profile.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a lowercase hyphen slug");
  });
}

test("every seed is verified per docs/scoring.md (at least 5 swipes)", () => {
  for (const { file, profile } of Object.values(seeds)) {
    const hr = profile.human_review || {};
    assert.ok((hr.swipe_count || 0) >= 5, `${file}: swipe_count ${hr.swipe_count} is under 5`);
    assert.equal(hr.verified, true, `${file}: verified must be true once swipe_count is at least 5`);
  }
});

test("every seed carries automated_checks and at least one agent observation", () => {
  for (const { file, profile } of Object.values(seeds)) {
    assert.ok(profile.automated_checks && typeof profile.automated_checks.checked_at === "string", `${file}: automated_checks.checked_at missing`);
    assert.ok(Array.isArray(profile.agent_observations) && profile.agent_observations.length >= 1, `${file}: needs at least one agent_observations entry`);
  }
});

test("weaknesses follow docs/scoring.md: a human metric under 0.5 or a failing check produces a tag", () => {
  const tagFor = {
    understood_immediately: "onboarding",
    easy_to_use: "ux",
    feels_distinctive: "design",
    would_use: "value",
  };
  for (const { file, profile } of Object.values(seeds)) {
    const weaknesses = profile.weaknesses || [];
    const hr = profile.human_review || {};
    for (const [metric, tag] of Object.entries(tagFor)) {
      if (typeof hr[metric] === "number" && hr[metric] < 0.5) {
        assert.ok(weaknesses.includes(tag), `${file}: ${metric} is ${hr[metric]} so weaknesses must include "${tag}"`);
      }
    }
    if (typeof hr.looks_like_slop === "number" && hr.looks_like_slop >= 0.5) {
      assert.ok(weaknesses.includes("polish"), `${file}: looks_like_slop is ${hr.looks_like_slop} so weaknesses must include "polish"`);
    }
    const ac = profile.automated_checks || {};
    if (ac.mobile_ok === false) assert.ok(weaknesses.includes("mobile"), `${file}: mobile_ok failed so weaknesses must include "mobile"`);
    if (ac.security_headers === false) assert.ok(weaknesses.includes("security"), `${file}: security_headers failed so weaknesses must include "security"`);
    if (ac.loads === false) assert.ok(weaknesses.includes("hosting"), `${file}: loads failed so weaknesses must include "hosting"`);
    if ((ac.console_errors || 0) > 0) assert.ok(weaknesses.includes("stability"), `${file}: console_errors is ${ac.console_errors} so weaknesses must include "stability"`);
  }
});

test(`demo pair: ${DEMO_B} carries a capability tag that names a weakness of ${DEMO_A}`, () => {
  const a = seeds[DEMO_A]?.profile;
  const b = seeds[DEMO_B]?.profile;
  assert.ok(a, `seed/${DEMO_A}.json is missing`);
  assert.ok(b, `seed/${DEMO_B}.json is missing`);
  const overlap = b.capabilities.filter((tag) => a.weaknesses.includes(tag));
  assert.ok(overlap.length >= 1, `${DEMO_B}.capabilities ${JSON.stringify(b.capabilities)} shares no tag with ${DEMO_A}.weaknesses ${JSON.stringify(a.weaknesses)}`);
  assert.ok(overlap.includes(a.weaknesses[0]), `${DEMO_B} must fill ${DEMO_A}'s first weakness "${a.weaknesses[0]}", not only a secondary one`);
  assert.ok(!b.weaknesses.includes(a.weaknesses[0]), `${DEMO_B} reports "${a.weaknesses[0]}" as its own weakness and cannot fill it`);
});

test(`decoy: ${DECOY_C} carries no capability tag that names a weakness of ${DEMO_A}`, () => {
  const a = seeds[DEMO_A]?.profile;
  const c = seeds[DECOY_C]?.profile;
  assert.ok(c, `seed/${DECOY_C}.json is missing`);
  const overlap = c.capabilities.filter((tag) => a.weaknesses.includes(tag));
  assert.deepEqual(overlap, [], `${DECOY_C} fills ${DEMO_A}'s gap through ${JSON.stringify(overlap)}, so it is not a decoy`);
});

test(`decoy resembles the demo match: ${DECOY_C} and ${DEMO_B} share at least one capability tag`, () => {
  const b = seeds[DEMO_B].profile;
  const c = seeds[DECOY_C].profile;
  const shared = c.capabilities.filter((tag) => b.capabilities.includes(tag));
  assert.ok(shared.length >= 1, `${DECOY_C} shares no tag with ${DEMO_B}, so it does not look similar enough to be a decoy`);
});

test("agent/evals reference seed files that exist and agree on the demo pair and decoy", () => {
  const evalFiles = fs.readdirSync(evalsDir).filter((f) => f.endsWith(".json")).sort();
  assert.ok(evalFiles.length >= 3, `expected at least 3 eval files, found ${evalFiles.length}`);
  for (const file of evalFiles) {
    const scenario = readJson(path.join(evalsDir, file));
    for (const key of ["input", "expected", "why"]) {
      assert.ok(key in scenario, `${file}: missing "${key}"`);
    }
    const refs = [scenario.input.product_a, ...(scenario.input.pool || [])];
    for (const ref of refs) {
      assert.ok(fs.existsSync(path.join(root, ref)), `${file}: ${ref} does not exist`);
    }
  }
  const demo = readJson(path.join(evalsDir, "demo-pair.json"));
  assert.equal(demo.input.product_a, `seed/${DEMO_A}.json`);
  assert.deepEqual(demo.expected.accept_product_ids, [DEMO_B]);
  assert.ok(demo.expected.confidence_min > 0.7 || demo.expected.confidence_min === 0.7);
  const decoy = readJson(path.join(evalsDir, "decoy.json"));
  assert.deepEqual(decoy.input.pool, [`seed/${DECOY_C}.json`]);
  assert.ok(decoy.expected.allow_no_proposal === true);
  assert.ok(decoy.expected.confidence_max < 0.4 || decoy.expected.confidence_max === 0.4);
  const rejection = readJson(path.join(evalsDir, "rejection.json"));
  assert.ok(rejection.input.prior_rejections.some((r) => r.product_id === DEMO_B), "rejection.json must carry a prior rejection of the demo pair");
  assert.ok(rejection.expected.reject_product_ids.includes(DEMO_B));
});

test("no em dashes and no banned words in seed/, agent/, or agent-log/", () => {
  // U+2014 is the em dash. The banned word is assembled so it never appears literally in this repo.
  const banned = new RegExp("\\u2014|" + ["visi", "bility"].join(""), "i");
  const dirs = ["seed", "agent", "agent-log"].map((d) => path.join(root, d));
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(json|md)$/.test(entry.name) && banned.test(fs.readFileSync(full, "utf8"))) offenders.push(path.relative(root, full));
    }
  };
  dirs.forEach(walk);
  assert.deepEqual(offenders, [], `banned content in: ${offenders.join(", ")}`);
});
