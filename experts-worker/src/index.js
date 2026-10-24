// Think Like Olivia. Cloudflare Worker, plain JS, no framework.
// Owner: Therese. Standalone: does not depend on worker/. Keys documented in wrangler.toml.
// Prompts and schemas are inlined into ./prompts.js by scripts/build-prompts.mjs.
import {
  INTERVIEW_PROMPT,
  INTERVIEW_QUESTIONS,
  REVIEW_PROMPT,
  EXPERT_PROFILE_SCHEMA,
  VALIDATION_SCHEMA,
  PRODUCT_SCHEMA,
  DEMO_PRODUCT,
} from "./prompts.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  "access-control-allow-headers": "content-type,x-admin-token",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...CORS } });

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_FOLLOWUPS = 2;
const DISCLAIMER = "This is a model of one expert's stated rules, not the expert. Humans decide.";
const EDITABLE = ["name", "domains", "decision_rules", "red_flags", "limitations"];
const now = () => new Date().toISOString();

// Minimal validator for the subset of JSON Schema our schemas use. Same rules as tests/core-loop.test.mjs.
export function validate(value, s, path = "$") {
  const errors = [];
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  if (s.type) {
    const ok = s.type === type || (s.type === "integer" && Number.isInteger(value)) || (s.type === "number" && type === "number");
    if (!ok) return [`${path}: expected ${s.type}, got ${type}`];
  }
  if (s.enum && !s.enum.includes(value)) errors.push(`${path}: ${JSON.stringify(value)} not in ${s.enum.join(", ")}`);
  if (typeof value === "number") {
    if (s.minimum !== undefined && value < s.minimum) errors.push(`${path}: ${value} below ${s.minimum}`);
    if (s.maximum !== undefined && value > s.maximum) errors.push(`${path}: ${value} above ${s.maximum}`);
  }
  if (typeof value === "string") {
    if (s.minLength !== undefined && value.length < s.minLength) errors.push(`${path}: shorter than ${s.minLength}`);
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

// ---------- helpers ----------

const getJson = async (env, key) => {
  const raw = await env.EXPERTS_KV.get(key);
  return raw ? JSON.parse(raw) : null;
};
const putJson = (env, key, value) => env.EXPERTS_KV.put(key, JSON.stringify(value));
const mode = (env) => (env.ANTHROPIC_API_KEY ? "claude" : "rule-based");
const noDashes = (s) => String(s).replace(/\s*[\u2014\u2013]\s*/g, ", ");
const shorten = (s, n) => {
  s = String(s).trim().replace(/\s+/g, " ");
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 3);
  return cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length) + "...";
};
const stripPlaceholder = (s) => String(s).replace(/^PLACEHOLDER, replace after interview\.\s*/, "");
const clause = (s) => {
  const t = String(s).trim().replace(/[.!?]+$/, "");
  return t.charAt(0).toLowerCase() + t.slice(1);
};
const firstName = (profile) => String(profile?.name ?? profile?.expert_id ?? "the expert").split(" ")[0];

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns a Response when the request is not allowed, null when it is.
function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return json({ error: "ADMIN_TOKEN is not set on this worker, so writes are locked." }, 503);
  if (!safeEqual(request.headers.get("x-admin-token") ?? "", env.ADMIN_TOKEN)) return json({ error: "X-Admin-Token is missing or wrong." }, 401);
  return null;
}

async function askClaude(env, system, user, effort = "low") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort },
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`);
  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("The model declined this request.");
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in the model reply.");
  return JSON.parse(text.slice(start, end + 1));
}

// ---------- interview ----------

const CORE = INTERVIEW_QUESTIONS;
const coreById = Object.fromEntries(CORE.map((q) => [q.id, q]));

function freshInterview(expert_id) {
  return { expert_id, started_at: now(), updated_at: now(), answers: [], pending: null, moved_on: {} };
}

function progress(state) {
  const answered = new Set(state.answers.map((a) => a.question_id));
  return { core_answered: CORE.filter((q) => answered.has(q.id)).length, core_total: CORE.length, answers: state.answers.length };
}

function ruleFollowup(core, state) {
  const coreAnswer = state.answers.find((a) => a.question_id === core.id)?.answer ?? "";
  const asked = new Set(state.answers.filter((a) => a.core_id === core.id).map((a) => a.question));
  for (const f of core.followups) {
    if (asked.has(f.question)) continue;
    if (f.trigger === "always" || new RegExp(f.trigger, "i").test(coreAnswer)) return f.question;
  }
  return null;
}

async function claudeFollowup(env, core, state) {
  const transcript = state.answers.map((a) => ({ question: a.question, answer: a.answer }));
  const reply = await askClaude(
    env,
    INTERVIEW_PROMPT,
    JSON.stringify({ main_question_just_answered: core.question, topic: core.topic, transcript }),
  );
  if (reply.action === "followup" && typeof reply.question === "string" && reply.question.trim()) return noDashes(shorten(reply.question, 240));
  return null;
}

async function nextQuestion(env, state) {
  if (state.pending) return { state, note: null };
  let note = null;
  const last = state.answers.at(-1);
  if (last && !state.moved_on[last.core_id]) {
    const core = coreById[last.core_id];
    const asked = state.answers.filter((a) => a.core_id === core.id && a.question_id !== core.id).length;
    let question = null;
    let source = "rule-based";
    if (asked < MAX_FOLLOWUPS && core.followups.length > 0) {
      if (mode(env) === "claude") {
        try {
          question = await claudeFollowup(env, core, state);
          source = "claude";
        } catch (e) {
          note = `Claude call failed, so this follow-up is rule-based. ${e.message}`;
          question = ruleFollowup(core, state);
        }
      } else {
        question = ruleFollowup(core, state);
      }
    }
    if (question) {
      state.pending = { question_id: `${core.id}-f${asked + 1}`, core_id: core.id, kind: "followup", question, source };
      return { state, note };
    }
    state.moved_on[core.id] = true;
  }
  const answered = new Set(state.answers.map((a) => a.question_id));
  const core = CORE.find((q) => !answered.has(q.id));
  if (core) state.pending = { question_id: core.id, core_id: core.id, kind: "core", question: core.question, source: "script" };
  return { state, note };
}

function templateProfile(expert_id, state, existing) {
  const answerOf = (id) => state.answers.find((a) => a.question_id === id)?.answer ?? "";
  const followupsOf = (id) => state.answers.filter((a) => a.core_id === id && a.question_id !== id).map((a) => a.answer);
  const byTopic = Object.fromEntries(CORE.map((q) => [q.topic, q]));
  const name = existing?.name ?? expert_id.charAt(0).toUpperCase() + expert_id.slice(1);
  const ruleTopics = CORE.filter((q) => !["red-flags", "limitations"].includes(q.topic));
  const sentences = (s) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  return {
    expert_id,
    name,
    domains: CORE.filter((q) => q.topic !== "limitations").map((q) => q.topic),
    decision_rules: ruleTopics.map((q) => ({
      id: q.topic,
      rule: noDashes(shorten(answerOf(q.id) || "No answer given.", 400)),
      example: noDashes(shorten(followupsOf(q.id).join(" ") || "No example given yet. Add one before approving.", 600)),
      severity: ["decision-rules", "red-flags", "accessibility"].includes(q.topic) ? "high" : "medium",
    })),
    red_flags: [answerOf(byTopic["red-flags"].id), ...followupsOf(byTopic["red-flags"].id)].flatMap(sentences).map(noDashes),
    limitations: [
      ...sentences(answerOf(byTopic.limitations.id)).map(noDashes),
      `This profile is a model of ${name.split(" ")[0]}'s stated rules, not ${name.split(" ")[0]}.`,
      "Drafted in rule-based mode. Each rule is her answer as she said it, not a summary. Edit before approving.",
    ],
  };
}

function finalizeDraft(draft, expert_id, existing) {
  const profile = {};
  for (const key of EDITABLE) if (draft[key] !== undefined) profile[key] = draft[key];
  return {
    expert_id,
    ...profile,
    approval_status: "draft",
    version: existing?.version ?? 0,
    is_seed: false,
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  };
}

// ---------- review ----------

// Rule-based review: match each rule to one Product Profile field by keyword. Never invents a number.
const SIGNALS = [
  { re: /first|understand|explain|onboard|confus|clear|start/i, path: "human_review.understood_immediately", bad: (v) => v < 0.5 },
  { re: /access|contrast|wcag|keyboard|screen reader|color/i, path: "automated_checks.accessibility", bad: (v) => v < 50 },
  { re: /phone|mobile|one-handed|responsive|small screen/i, path: "automated_checks.mobile_ok", bad: (v) => v === false },
  { re: /fast|load|slow|speed|perform|wait/i, path: "automated_checks.performance", bad: (v) => v < 50 },
  { re: /error|crash|broken|reliab|console/i, path: "automated_checks.console_errors", bad: (v) => v > 0 },
  { re: /easy|usab|friction|next step|button|action|guess/i, path: "human_review.easy_to_use", bad: (v) => v < 0.5 },
  { re: /slop|polish|generic|template|clever|simple|stutter/i, path: "human_review.looks_like_slop", bad: (v) => v >= 0.5 },
  { re: /distinct|different|unique|stand out/i, path: "human_review.feels_distinctive", bad: (v) => v < 0.5 },
  { re: /value|want|need|would use/i, path: "human_review.would_use", bad: (v) => v < 0.5 },
];
const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

function ruleBasedSuggestions(profile, product) {
  const who = firstName(profile);
  const out = [];
  const used = new Set();
  const usable = (s) => !used.has(s.path) && getPath(product, s.path) !== undefined;
  for (const r of profile.decision_rules) {
    // The rule's own words first, then its example. Each field backs at most one suggestion.
    const signal = SIGNALS.find((s) => usable(s) && s.re.test(r.rule)) ?? SIGNALS.find((s) => usable(s) && s.re.test(r.example));
    if (!signal) continue;
    used.add(signal.path);
    const value = getPath(product, signal.path);
    const crosses = signal.bad(value);
    const quoted = shorten(stripPlaceholder(r.rule), 120);
    out.push({
      id: `s${out.length + 1}`,
      principle_id: r.id,
      principle: r.rule,
      suggestion: crosses
        ? `Under ${who}'s stated rule "${quoted}", ${signal.path} is ${value}, which crosses the line. Fix this before polishing anything else.`
        : `Under ${who}'s stated rule "${quoted}", ${signal.path} is ${value}, which does not cross the line on its own. Check the real screen against this rule anyway.`,
      evidence: signal.path,
      confidence: crosses ? 0.55 : 0.3,
      uncertainty_note: "Rule-based mode matched this rule to a profile field by keyword. It cannot see the screen, so a human should check it.",
    });
  }
  return out;
}

function cleanSuggestions(raw, profile) {
  const rules = Object.fromEntries(profile.decision_rules.map((r) => [r.id, r]));
  const seen = new Set();
  const out = [];
  for (const s of Array.isArray(raw) ? raw : []) {
    if (!s || !rules[s.principle_id] || seen.has(s.principle_id)) continue;
    if (typeof s.suggestion !== "string" || typeof s.evidence !== "string") continue;
    if (typeof s.confidence !== "number" || s.confidence < 0 || s.confidence > 1) continue;
    if (s.confidence < 0.6 && !(typeof s.uncertainty_note === "string" && s.uncertainty_note.trim())) continue;
    seen.add(s.principle_id);
    const clean = {
      id: `s${out.length + 1}`,
      principle_id: s.principle_id,
      principle: rules[s.principle_id].rule,
      suggestion: noDashes(s.suggestion),
      evidence: s.evidence,
      confidence: s.confidence,
    };
    if (typeof s.uncertainty_note === "string" && s.uncertainty_note.trim()) clean.uncertainty_note = noDashes(s.uncertainty_note);
    out.push(clean);
  }
  return out;
}

async function loadProduct(env, body) {
  if (body.product) {
    const errors = validate(body.product, PRODUCT_SCHEMA);
    if (errors.length) return { error: json({ error: "product does not match shared/profile.schema.json", errors }, 400) };
    return { product: body.product };
  }
  if (!body.product_id) return { error: json({ error: "Send product (a Product Profile) or product_id." }, 400) };
  if (!ID.test(body.product_id)) return { error: json({ error: "product_id must be a lowercase slug." }, 400) };
  if (!env.CORE_API_URL) return { error: json({ error: "CORE_API_URL is not set, so send the Product Profile in the body as product." }, 400) };
  const res = await fetch(`${env.CORE_API_URL.replace(/\/+$/, "")}/products/${body.product_id}`);
  if (!res.ok) return { error: json({ error: `Core API returned ${res.status} for ${body.product_id}.` }, 502) };
  const data = await res.json();
  const product = data?.product ?? data;
  const errors = validate(product, PRODUCT_SCHEMA);
  if (errors.length) return { error: json({ error: "Core API product does not match shared/profile.schema.json", errors }, 502) };
  return { product };
}

function reasoningGap(s, v, who) {
  if (!v || v.verdict === "accept") return null;
  if (v.verdict === "reject") return `The AI applied rule "${s.principle_id}" here, and ${who} rejected it because ${clause(v.rationale)}.`;
  return `The AI said "${shorten(s.suggestion, 140)}", and ${who} corrected it to "${shorten(v.correction, 140)}" because ${clause(v.rationale)}.`;
}

// ---------- router ----------

export async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method;
  const parts = path.split("/").filter(Boolean);

  if (method === "OPTIONS") return new Response(null, { headers: CORS });
  if (path === "/") return Response.redirect(new URL("/experts/olivia/interview", url), 302);
  if (path === "/health") return json({ ok: true, service: "sloppyornot-experts", mode: mode(env) });

  // Pages: /experts/:id/interview and /experts/:id/review
  if (method === "GET" && parts[0] === "experts" && parts.length === 3 && ID.test(parts[1]) && ["interview", "review"].includes(parts[2])) {
    if (!env.ASSETS) return json({ error: "static assets are not bound" }, 404);
    return env.ASSETS.fetch(new Request(new URL(`/${parts[2]}.html`, url)));
  }

  if (parts[0] !== "api") return json({ error: "not found", path }, 404);

  if (method === "GET" && path === "/api/config") {
    return json({ mode: mode(env), core_api: Boolean(env.CORE_API_URL), writes_locked: !env.ADMIN_TOKEN, disclaimer: DISCLAIMER });
  }

  if (method === "GET" && path === "/api/demo/product") {
    return json({ label: "Seed data for the demo. FloodWatch CHS is not a real HarborHack team.", product: DEMO_PRODUCT });
  }

  // /api/interview/:expert_id/(next|answer|finish)
  if (parts[1] === "interview" && parts.length === 4) {
    const expert_id = parts[2];
    if (!ID.test(expert_id)) return json({ error: "expert_id must be a lowercase slug." }, 400);
    const key = `interview:${expert_id}`;
    const state = (await getJson(env, key)) ?? freshInterview(expert_id);

    if (method === "GET" && parts[3] === "next") {
      const { note } = await nextQuestion(env, state);
      state.updated_at = now();
      await putJson(env, key, state);
      return json({ expert_id, done: !state.pending, question: state.pending, progress: progress(state), mode: mode(env), note });
    }

    if (method === "POST" && parts[3] === "answer") {
      const body = await readBody(request);
      if (!body || typeof body.answer !== "string" || !body.answer.trim()) return json({ error: "Send { question_id, answer } with a non-empty answer." }, 400);
      if (body.answer.length > 4000) return json({ error: "answer is longer than 4000 characters." }, 400);
      if (!state.pending || state.pending.question_id !== body.question_id) {
        return json({ error: "question_id does not match the pending question. Call next first.", pending: state.pending }, 409);
      }
      const p = state.pending;
      state.answers.push({ question_id: p.question_id, core_id: p.core_id, question: p.question, answer: body.answer.trim(), ts: now(), source: p.source });
      state.pending = null;
      state.updated_at = now();
      await putJson(env, key, state);
      return json({ ok: true, progress: progress(state) });
    }

    if (method === "POST" && parts[3] === "finish") {
      const answered = new Set(state.answers.map((a) => a.question_id));
      const missing = CORE.filter((q) => !answered.has(q.id)).map((q) => q.id);
      if (missing.length) return json({ error: "Answer every main question first.", missing }, 409);
      const existing = await getJson(env, `profile:${expert_id}`);
      let draft = null;
      let draftMode = "rule-based";
      let note = null;
      if (mode(env) === "claude") {
        try {
          const reply = await askClaude(
            env,
            INTERVIEW_PROMPT,
            JSON.stringify({
              instruction: "Draft the Expert Reasoning Profile now. Return only the profile JSON.",
              expert_id,
              transcript: state.answers.map((a) => ({ question: a.question, answer: a.answer })),
              schema: EXPERT_PROFILE_SCHEMA,
            }),
            "medium",
          );
          const candidate = finalizeDraft(reply, expert_id, existing);
          const errors = validate(candidate, EXPERT_PROFILE_SCHEMA);
          if (errors.length) note = `Claude draft did not validate, so this is the template draft. ${errors.slice(0, 3).join("; ")}`;
          else {
            draft = candidate;
            draftMode = "claude";
          }
        } catch (e) {
          note = `Claude call failed, so this is the template draft. ${e.message}`;
        }
      }
      if (!draft) draft = finalizeDraft(templateProfile(expert_id, state, existing), expert_id, existing);
      const errors = validate(draft, EXPERT_PROFILE_SCHEMA);
      if (errors.length) return json({ error: "Draft profile did not validate.", errors }, 500);
      await putJson(env, `profile:${expert_id}`, draft);
      return json({ profile: draft, mode: draftMode, note }, 201);
    }
  }

  // /api/profile/:expert_id and /api/profile/:expert_id/approve
  if (parts[1] === "profile" && (parts.length === 3 || (parts.length === 4 && parts[3] === "approve"))) {
    const expert_id = parts[2];
    if (!ID.test(expert_id)) return json({ error: "expert_id must be a lowercase slug." }, 400);
    const key = `profile:${expert_id}`;
    const existing = await getJson(env, key);

    if (method === "GET" && parts.length === 3) {
      return existing ? json({ profile: existing }) : json({ error: "No profile yet. Finish the interview first." }, 404);
    }

    if (method === "PUT" && parts.length === 3) {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      const body = await readBody(request);
      if (!body || typeof body !== "object") return json({ error: "Send the profile fields as JSON." }, 400);
      const ignored = ["expert_id", "approval_status", "version", "is_seed", "created_at", "updated_at", "approved_at"];
      const unknown = Object.keys(body).filter((k) => !EDITABLE.includes(k) && !ignored.includes(k));
      if (unknown.length) return json({ error: `These fields cannot be edited: ${unknown.join(", ")}` }, 400);
      const merged = { ...(existing ?? {}) };
      for (const k of EDITABLE) if (body[k] !== undefined) merged[k] = body[k];
      const profile = finalizeDraft(merged, expert_id, existing);
      const errors = validate(profile, EXPERT_PROFILE_SCHEMA);
      if (errors.length) return json({ error: "Profile does not match agent/experts/expert-profile.schema.json", errors }, 400);
      await putJson(env, key, profile);
      return json({ profile });
    }

    if (method === "POST" && parts.length === 4) {
      const denied = requireAdmin(request, env);
      if (denied) return denied;
      if (!existing) return json({ error: "No profile yet. Finish the interview first." }, 404);
      if (existing.approval_status === "approved") return json({ profile: existing, already_approved: true });
      if (JSON.stringify(existing).includes("PLACEHOLDER")) return json({ error: "Replace every PLACEHOLDER before approving." }, 409);
      const profile = { ...existing, approval_status: "approved", approved_at: now(), updated_at: now(), version: (existing.version ?? 0) + 1 };
      const errors = validate(profile, EXPERT_PROFILE_SCHEMA);
      if (errors.length) return json({ error: "Profile does not validate, so it cannot be approved.", errors }, 409);
      await putJson(env, key, profile);
      return json({ profile });
    }
  }

  if (method === "POST" && path === "/api/review") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const body = await readBody(request);
    if (!body || !ID.test(body.expert_id ?? "")) return json({ error: "Send { expert_id, product } or { expert_id, product_id }." }, 400);
    const profile = await getJson(env, `profile:${body.expert_id}`);
    if (!profile) return json({ error: "No profile for this expert yet." }, 404);
    if (profile.approval_status !== "approved") {
      return json({ error: `The profile is ${profile.approval_status}. ${firstName(profile)} approves it before the agent can use it.` }, 409);
    }
    const { product, error } = await loadProduct(env, body);
    if (error) return error;
    const key = `review:${body.expert_id}:${product.id}`;
    const prior = await getJson(env, key);
    if (prior) return json({ ...prior, existing: true });

    let suggestions = [];
    let reviewMode = "rule-based";
    let note = null;
    if (mode(env) === "claude") {
      try {
        const reply = await askClaude(env, REVIEW_PROMPT, JSON.stringify({ expert_profile: profile, product }), "medium");
        suggestions = cleanSuggestions(reply.suggestions, profile);
        if (suggestions.length) reviewMode = "claude";
        else note = "Claude returned no valid suggestions, so this review is rule-based.";
      } catch (e) {
        note = `Claude call failed, so this review is rule-based. ${e.message}`;
      }
    }
    if (!suggestions.length) suggestions = ruleBasedSuggestions(profile, product);
    const review = {
      expert_id: body.expert_id,
      expert_name: profile.name,
      product_id: product.id,
      product_name: product.name,
      product_is_seed: product.is_seed === true,
      profile_version: profile.version,
      mode: reviewMode,
      created_at: now(),
      disclaimer: DISCLAIMER,
      suggestions,
    };
    if (note) review.note = note;
    await putJson(env, key, review);
    return json(review, 201);
  }

  if (method === "POST" && path === "/api/verdict") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const body = await readBody(request);
    if (!body || typeof body !== "object") return json({ error: "Send a verdict that matches agent/experts/validation.schema.json." }, 400);
    const verdict = { ...body, decided_at: body.decided_at ?? now() };
    const errors = validate(verdict, VALIDATION_SCHEMA);
    if (verdict.verdict === "modify" && !(typeof verdict.correction === "string" && verdict.correction.trim())) errors.push("$: correction is required when verdict is modify");
    if (!verdict.rationale?.trim?.()) errors.push("$: rationale is required");
    if (errors.length) return json({ error: "Verdict does not match agent/experts/validation.schema.json", errors }, 400);
    const review = await getJson(env, `review:${verdict.expert_id}:${verdict.product_id}`);
    if (!review) return json({ error: "No review for this expert and product." }, 404);
    const suggestion = review.suggestions.find((s) => s.id === verdict.suggestion_id);
    if (!suggestion) return json({ error: `No suggestion ${verdict.suggestion_id} in this review.` }, 404);
    // The verdict sits beside the suggestion. The review key is never written here.
    await putJson(env, `verdict:${verdict.expert_id}:${verdict.product_id}:${verdict.suggestion_id}`, { ...verdict, review_created_at: review.created_at });
    return json({ ok: true, verdict, suggestion }, 201);
  }

  // /api/comparison/:expert_id/:product_id
  if (method === "GET" && parts[1] === "comparison" && parts.length === 4) {
    const [, , expert_id, product_id] = parts;
    if (!ID.test(expert_id) || !ID.test(product_id)) return json({ error: "ids must be lowercase slugs." }, 400);
    const review = await getJson(env, `review:${expert_id}:${product_id}`);
    if (!review) return json({ error: "No review for this expert and product yet." }, 404);
    const who = String(review.expert_name ?? expert_id).split(" ")[0];
    const items = [];
    for (const s of review.suggestions) {
      let v = await getJson(env, `verdict:${expert_id}:${product_id}:${s.id}`);
      if (v && v.review_created_at !== review.created_at) v = null;
      const status = !v ? "pending" : { accept: "accepted", reject: "rejected", modify: "modified" }[v.verdict];
      items.push({
        suggestion: s,
        verdict: v?.verdict ?? null,
        correction: v?.verdict === "modify" ? v.correction : null,
        rationale: v?.rationale ?? null,
        decided_by: v?.decided_by ?? null,
        decided_at: v?.decided_at ?? null,
        reasoning_gap: reasoningGap(s, v, who),
        status,
      });
    }
    const count = (st) => items.filter((i) => i.status === st).length;
    return json({
      title: `Think Like ${who}: Human Expertise vs. AI`,
      expert_id,
      expert_name: review.expert_name,
      product_id,
      product_name: review.product_name,
      product_is_seed: review.product_is_seed,
      profile_version: review.profile_version,
      mode: review.mode,
      reviewed_at: review.created_at,
      disclaimer: DISCLAIMER,
      counts: { total: items.length, accepted: count("accepted"), rejected: count("rejected"), modified: count("modified"), pending: count("pending") },
      items,
    });
  }

  return json({ error: "not found", path }, 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (e) {
      return json({ error: "server error", detail: e.message }, 500);
    }
  },
};
