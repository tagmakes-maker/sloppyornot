// Think Like Olivia: schema checks. Node built-ins only. Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const readJson = (p) => JSON.parse(read(p));
const schema = readJson("agent/experts/expert-profile.schema.json");
const verdictSchema = readJson("agent/experts/validation.schema.json");
const draft = readJson("seed/experts/olivia.draft.json");
const evalFile = readJson("agent/evals/expert-review.json");

// Minimal validator: required fields, types, enums, bounds, additionalProperties false.
function validate(value, s, path = "$") {
  const errors = [];
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  if (s.type) {
    const ok = s.type === type || (s.type === "integer" && Number.isInteger(value)) || (s.type === "number" && type === "number");
    if (!ok) return [`${path}: expected ${s.type}, got ${type}`];
  }
  if (s.enum && !s.enum.includes(value)) errors.push(`${path}: ${JSON.stringify(value)} not in ${s.enum.join(", ")}`);
  if (typeof value === "number" && s.minimum !== undefined && value < s.minimum) errors.push(`${path}: below ${s.minimum}`);
  if (typeof value === "string") {
    if (s.minLength !== undefined && value.length < s.minLength) errors.push(`${path}: shorter than ${s.minLength}`);
    if (s.maxLength !== undefined && value.length > s.maxLength) errors.push(`${path}: longer than ${s.maxLength}`);
    if (s.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: not a date-time`);
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

test("olivia.draft.json validates against expert-profile.schema.json", () => {
  assert.deepEqual(validate(draft, schema), []);
});

test("the seed draft is inactive and labeled", () => {
  assert.equal(draft.approval_status, "draft");
  assert.equal(draft.is_seed, true);
  assert.equal(draft.approved_at, undefined);
  for (const r of draft.decision_rules) assert.ok(r.rule.startsWith("PLACEHOLDER"), `${r.id} is not labeled PLACEHOLDER`);
});

test("decision rule ids are unique", () => {
  const ids = draft.decision_rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("the validator rejects an unknown field and a bad enum", () => {
  assert.ok(validate({ ...draft, mood: "great" }, schema).some((e) => e.includes("unexpected field mood")));
  assert.ok(validate({ ...draft, approval_status: "live" }, schema).length > 0);
  assert.ok(validate({ expert_id: "olivia", product_id: "x", suggestion_id: "s1", verdict: "maybe", rationale: "r", decided_by: "o" }, verdictSchema).length > 0);
});

test("every expected principle_id in the eval exists in the profile", () => {
  const ids = new Set(readJson(evalFile.input.expert_profile).decision_rules.map((r) => r.id));
  for (const id of evalFile.expected.principle_ids) assert.ok(ids.has(id), `${id} is not a rule in the profile`);
});

test("the review prompt ends with the human-decides line", () => {
  const text = read("agent/prompts/expert-review.md").trim();
  assert.ok(text.endsWith("Humans decide. Propose and explain. Never act on a match without approval. This is a model of one expert's stated rules, not the expert."));
});

test("interview.md has eight core questions with the opening copy", () => {
  const md = read("agent/experts/interview.md");
  const questions = JSON.parse(md.match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.equal(questions.length, 8);
  assert.ok(md.includes("Hey Olivia. Can we borrow your brain?"));
  for (const q of questions) for (const f of q.followups) if (f.trigger !== "always") new RegExp(f.trigger, "i");
});

test("Think Like Olivia files have no em dashes and never say visibility", () => {
  const files = [
    "agent/experts/interview.md", "agent/experts/README.md", "agent/prompts/expert-review.md",
    "agent/experts/expert-profile.schema.json", "agent/experts/validation.schema.json",
    "seed/experts/olivia.draft.json", "agent/evals/expert-review.json",
    "experts-worker/public/interview.html", "experts-worker/public/review.html", "experts-worker/src/index.js",
  ];
  for (const f of files) {
    const text = read(f);
    assert.ok(!text.includes("\u2014"), `${f} has an em dash`);
    assert.ok(!/visibility/i.test(text), `${f} says visibility`);
  }
});
