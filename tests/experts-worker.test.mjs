// Think Like Olivia worker: route behavior against an in-memory KV. Node built-ins only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../experts-worker/src/index.js";
import { build } from "../experts-worker/scripts/build-prompts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const demo = JSON.parse(readFileSync(join(root, "seed/floodwatch-chs.json"), "utf8"));
const TOKEN = "test-token";

function makeEnv(extra = {}) {
  const store = new Map();
  return {
    store,
    EXPERTS_KV: { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) },
    ADMIN_TOKEN: TOKEN,
    ...extra,
  };
}

async function call(env, method, path, body, admin = false) {
  const headers = { "content-type": "application/json" };
  if (admin) headers["x-admin-token"] = TOKEN;
  const res = await worker.fetch(new Request(`http://experts.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env);
  return { status: res.status, body: await res.json() };
}

const ANSWER = "A new user should understand the first screen without help. I check contrast and keyboard use. Yes, cutting it was the right call because simple beats clever.";

async function finishInterview(env) {
  for (let i = 0; i < 40; i++) {
    const next = await call(env, "GET", "/api/interview/olivia/next");
    if (next.body.done) return i;
    await call(env, "POST", "/api/interview/olivia/answer", { question_id: next.body.question.question_id, answer: ANSWER });
  }
  throw new Error("interview never finished");
}

async function approvedEnv() {
  const env = makeEnv();
  await finishInterview(env);
  await call(env, "POST", "/api/interview/olivia/finish");
  await call(env, "POST", "/api/profile/olivia/approve", undefined, true);
  return env;
}

test("src/prompts.js is up to date with agent/ (run npm run build in experts-worker/)", () => {
  assert.equal(readFileSync(join(root, "experts-worker/src/prompts.js"), "utf8"), build());
});

test("interview resumes from KV: a reload gets the same pending question", async () => {
  const env = makeEnv();
  const first = await call(env, "GET", "/api/interview/olivia/next");
  assert.equal(first.body.question.question_id, "q1");
  assert.equal(first.body.mode, "rule-based");
  await call(env, "POST", "/api/interview/olivia/answer", { question_id: "q1", answer: ANSWER });
  const second = await call(env, "GET", "/api/interview/olivia/next");
  const reload = await call(env, "GET", "/api/interview/olivia/next");
  assert.deepEqual(reload.body.question, second.body.question);
  assert.equal(reload.body.progress.answers, 1);
});

test("an answer to the wrong question is refused", async () => {
  const env = makeEnv();
  await call(env, "GET", "/api/interview/olivia/next");
  const res = await call(env, "POST", "/api/interview/olivia/answer", { question_id: "q5", answer: ANSWER });
  assert.equal(res.status, 409);
});

test("follow-ups stay at two or fewer per main question", async () => {
  const env = makeEnv();
  await finishInterview(env);
  const state = JSON.parse(env.store.get("interview:olivia"));
  for (const core of ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"]) {
    const followups = state.answers.filter((a) => a.core_id === core && a.question_id !== core).length;
    assert.ok(followups <= 2, `${core} has ${followups} follow-ups`);
  }
});

test("finish produces a valid draft profile", async () => {
  const env = makeEnv();
  const early = await call(env, "POST", "/api/interview/olivia/finish");
  assert.equal(early.status, 409);
  await finishInterview(env);
  const res = await call(env, "POST", "/api/interview/olivia/finish");
  assert.equal(res.status, 201);
  assert.equal(res.body.profile.approval_status, "draft");
  assert.equal(res.body.profile.version, 0);
  assert.ok(res.body.profile.decision_rules.length >= 1);
  assert.ok(res.body.profile.limitations.some((l) => l.includes("not Olivia")));
});

test("review is refused while the profile is a draft", async () => {
  const env = makeEnv();
  await finishInterview(env);
  await call(env, "POST", "/api/interview/olivia/finish");
  const res = await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true);
  assert.equal(res.status, 409);
});

test("approve needs the admin token, and a PLACEHOLDER profile cannot be approved", async () => {
  const env = makeEnv();
  const seed = JSON.parse(readFileSync(join(root, "seed/experts/olivia.draft.json"), "utf8"));
  const put = await call(env, "PUT", "/api/profile/olivia", seed, true);
  assert.equal(put.status, 200);
  assert.equal((await call(env, "POST", "/api/profile/olivia/approve")).status, 401);
  assert.equal((await call(env, "POST", "/api/profile/olivia/approve", undefined, true)).status, 409);
});

test("review is allowed after approve and cites only the expert's rules", async () => {
  const env = await approvedEnv();
  const profile = (await call(env, "GET", "/api/profile/olivia")).body.profile;
  assert.equal(profile.approval_status, "approved");
  assert.equal(profile.version, 1);
  const res = await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true);
  assert.equal(res.status, 201);
  assert.ok(res.body.suggestions.length > 0);
  const ids = new Set(profile.decision_rules.map((r) => r.id));
  for (const s of res.body.suggestions) {
    assert.ok(ids.has(s.principle_id));
    if (s.confidence < 0.6) assert.ok(s.uncertainty_note);
  }
});

test("editing an approved profile sets it back to draft", async () => {
  const env = await approvedEnv();
  const res = await call(env, "PUT", "/api/profile/olivia", { name: "Olivia Dennehy" }, true);
  assert.equal(res.body.profile.approval_status, "draft");
  assert.equal(res.body.profile.approved_at, undefined);
});

test("a verdict never mutates the suggestion, and the review is immutable", async () => {
  const env = await approvedEnv();
  await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true);
  const before = env.store.get("review:olivia:floodwatch-chs");
  const missingCorrection = await call(env, "POST", "/api/verdict", { expert_id: "olivia", product_id: "floodwatch-chs", suggestion_id: "s1", verdict: "modify", rationale: "Needs a legend.", decided_by: "Olivia" }, true);
  assert.equal(missingCorrection.status, 400);
  const ok = await call(env, "POST", "/api/verdict", { expert_id: "olivia", product_id: "floodwatch-chs", suggestion_id: "s1", verdict: "modify", correction: "Add a pin legend.", rationale: "Needs a legend.", decided_by: "Olivia" }, true);
  assert.equal(ok.status, 201);
  assert.equal(env.store.get("review:olivia:floodwatch-chs"), before);
  const again = await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true);
  assert.equal(again.body.existing, true);
  assert.equal(env.store.get("review:olivia:floodwatch-chs"), before);
});

test("comparison returns reasoning_gap only for modify or reject", async () => {
  const env = await approvedEnv();
  const review = (await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true)).body;
  assert.ok(review.suggestions.length >= 2, "need two suggestions for this test");
  const base = { expert_id: "olivia", product_id: "floodwatch-chs", decided_by: "Olivia" };
  await call(env, "POST", "/api/verdict", { ...base, suggestion_id: "s1", verdict: "accept", rationale: "Right call." }, true);
  await call(env, "POST", "/api/verdict", { ...base, suggestion_id: "s2", verdict: "reject", rationale: "The score is fine here." }, true);
  const res = await call(env, "GET", "/api/comparison/olivia/floodwatch-chs");
  assert.equal(res.status, 200);
  const [a, b, ...rest] = res.body.items;
  assert.equal(a.status, "accepted");
  assert.equal(a.reasoning_gap, null);
  assert.equal(b.status, "rejected");
  assert.match(b.reasoning_gap, /rejected it because the score is fine here\.$/);
  for (const item of rest) {
    assert.equal(item.status, "pending");
    assert.equal(item.reasoning_gap, null);
  }
  assert.ok(res.body.disclaimer.includes("not the expert"));
});

test("writes are locked without the admin token", async () => {
  const env = makeEnv({ ADMIN_TOKEN: "" });
  assert.equal((await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true)).status, 503);
  assert.equal((await call(makeEnv(), "POST", "/api/verdict", {})).status, 401);
});

test("Claude suggestions that cite a rule Olivia never wrote are thrown away", async () => {
  const env = await approvedEnv();
  env.ANTHROPIC_API_KEY = "fake";
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify({ suggestions: [
        { id: "s1", principle_id: "usability", suggestion: "Explain the pins on the first screen.", evidence: "human_review.understood_immediately", confidence: 0.9 },
        { id: "s2", principle_id: "made-up-rule", suggestion: "Add dark mode.", evidence: "what_it_does", confidence: 0.8 },
        { id: "s3", principle_id: "accessibility", suggestion: "Pins may rely on color alone.", evidence: "what_it_does", confidence: 0.4 },
      ] }) }],
    }));
  try {
    const res = await call(env, "POST", "/api/review", { expert_id: "olivia", product: demo }, true);
    assert.equal(res.body.mode, "claude");
    assert.deepEqual(res.body.suggestions.map((s) => s.principle_id), ["usability"]);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("page routes serve the static pages", async () => {
  const env = makeEnv({ ASSETS: { fetch: async (req) => new Response(new URL(req.url).pathname) } });
  const res = await worker.fetch(new Request("http://experts.test/experts/olivia/interview"), env);
  assert.equal(await res.text(), "/interview.html");
});
