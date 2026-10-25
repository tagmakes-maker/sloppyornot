// SloppyOrNot API. Cloudflare Worker, plain JS, no framework.
// Owner: Jacky. Spec: GitHub issues #7, #8, #9, #10.
// Storage: env.STORE (KV). Keys documented in wrangler.toml.

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...CORS } });

// the parsed body if it is a JSON object, otherwise null (bad JSON, null, an array, a number)
async function readObject(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

// ---- Issue #7: products ----

async function handleSubmitProduct(request, env) {
  const body = await readObject(request);
  if (!body) return json({ error: "body must be a JSON object" }, 400);

  if (!body.id || !body.name || !body.what_it_does || !body.target_user || !body.capabilities) {
    return json({ error: "missing required fields: id, name, what_it_does, target_user, capabilities" }, 400);
  }

  const existing = await env.STORE.get("product:" + body.id);
  if (existing) return json({ error: "product id already exists" }, 409);

  // the owner's email never goes in the profile, because GET /products is public
  const { email, contact_email, ...fields } = body;
  const ownerEmail = String(email || contact_email || "").trim();
  if (ownerEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail) || ownerEmail.length > 254)) {
    return json({ error: "email is not valid" }, 400);
  }

  const now = new Date().toISOString();
  const profile = {
    ...fields,
    status: "submitted",
    match_status: "unmatched",
    created_at: body.created_at || now,
    updated_at: now,
  };

  await env.STORE.put("product:" + profile.id, JSON.stringify(profile));
  if (ownerEmail) await env.STORE.put("contact:" + profile.id, JSON.stringify({ email: ownerEmail, at: now }));
  return json(profile, 201);
}

async function handleGetProducts(env) {
  const list = await env.STORE.list({ prefix: "product:" });
  const products = await Promise.all(
    list.keys.map((k) => env.STORE.get(k.name, "json"))
  );
  return json(products.filter(Boolean));
}

async function handleGetProduct(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);
  return json(profile);
}

// ---- Issue #8: reviews ----

const VERIFIED_THRESHOLD = 5;
const SWIPE_FIELDS = ["would_use", "understood_immediately", "feels_distinctive", "easy_to_use", "looks_like_slop"];

async function handleReview(id, request, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);

  const body = await readObject(request);
  if (!body) return json({ error: "body must be a JSON object" }, 400);

  // test swipes prove the route works but never touch real scores
  if (body.test === true) return json({ ignored: true, reason: "test swipe", id });

  // every swipe answers all five, as true/false or a number from 0 to 1,
  // because one count is shared by every average
  const bad = SWIPE_FIELDS.filter((f) => {
    const v = body[f];
    return typeof v !== "boolean" && !(typeof v === "number" && v >= 0 && v <= 1);
  });
  if (bad.length) {
    return json({ error: "each of these must be true/false or a number from 0 to 1: " + bad.join(", ") }, 400);
  }

  // save the raw swipe
  const rawKey = "reviews:" + id;
  const raw = (await env.STORE.get(rawKey, "json")) || [];
  raw.push({ ...body, at: new Date().toISOString() });
  await env.STORE.put(rawKey, JSON.stringify(raw));

  // update running averages on the profile
  const hr = profile.human_review || { swipe_count: 0 };
  const count = (hr.swipe_count || 0) + 1;

  for (const field of SWIPE_FIELDS) {
    const prev = hr[field] ?? 0;
    hr[field] = ((prev * (count - 1)) + Number(body[field])) / count;
  }

  hr.swipe_count = count;
  hr.verified = count >= VERIFIED_THRESHOLD;

  profile.human_review = hr;
  profile.updated_at = new Date().toISOString();

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json(profile);
}

// Issue #8 automated checks, a stub: does the url load, does it send security headers.
// Seed products are skipped because their urls are made up and their checks are seeded.
async function handleCheck(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);
  if (profile.is_seed) return json({ error: "seed products keep their seeded checks" }, 400);
  if (!profile.url) return json({ error: "product has no url" }, 400);
  if (!/^https?:\/\//i.test(profile.url)) return json({ error: "url must start with http:// or https://" }, 400);

  // TODO: known limits, left on purpose to keep the stub small.
  // The url and each redirect are checked to be http or https, but not where they point,
  // so a submitted url could aim at a private or internal address.
  // The 10 second timeout is per hop, so a redirect chain can take longer overall.
  // A fix for both was tried in f7ed195 and rolled back.
  // follow at most 3 redirects by hand so every hop is checked to be http or https
  let res = null;
  let target = profile.url;
  try {
    for (let hop = 0; hop <= 3; hop++) {
      const u = new URL(target);
      if (u.protocol !== "https:" && u.protocol !== "http:") break;
      const r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(10000) });
      const next = r.headers.get("location");
      if (r.status >= 300 && r.status < 400 && next) {
        target = new URL(next, u).href;
        continue;
      }
      res = r;
      break;
    }
  } catch {}

  const found = res ? ["content-security-policy", "strict-transport-security"].filter((h) => res.headers.has(h)) : [];

  // only the fields this stub measures; performance and the rest stay as they were
  profile.automated_checks = {
    ...profile.automated_checks,
    loads: !!res && res.ok,
    security_headers: found.length > 0,
    checked_at: new Date().toISOString(),
  };
  profile.updated_at = profile.automated_checks.checked_at;

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json({ ...profile, check_details: { status: res ? res.status : null, security_headers_found: found } });
}

// ---- Issue #9: agent runtime ----

async function runAgent(step, input, env) {
  // fetch the prompt Therese wrote
  const promptUrl = env.PROMPTS_BASE + step + ".md";
  const promptRes = await fetch(promptUrl);
  if (!promptRes.ok) throw new Error("could not fetch prompt: " + step);
  const systemPrompt = await promptRes.text();

  // call Claude
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      // thinking counts against this, so leave room for the JSON after it
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: JSON.stringify(input) }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Anthropic error: " + err);
  }

  const data = await res.json();
  if (!data.content || data.content.length === 0) {
    throw new Error("Anthropic returned no content: " + JSON.stringify(data));
  }
  // the reply can start with a thinking block, so read the text blocks wherever they are
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  if (!text) {
    throw new Error("Anthropic reply has no text block, stop_reason: " + data.stop_reason);
  }

  // parse the first JSON object out of the reply
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) throw new Error("no JSON in agent reply: " + text.slice(0, 200));
  const result = JSON.parse(match[0]);

  // append to agentlog
  const log = (await env.STORE.get("agentlog", "json")) || [];
  log.push({ step, at: new Date().toISOString(), input_summary: input.profile?.id || input.product_a?.id || "unknown", result });
  await env.STORE.put("agentlog", JSON.stringify(log));

  return result;
}

async function handleObserve(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);

  const result = await runAgent("observe", {
    profile,
    new_data: { source: "human_review", human_review: profile.human_review }
  }, env);

  // save what the agent learned back to the profile
  profile.strengths = result.strengths || profile.strengths;
  profile.weaknesses = result.weaknesses || profile.weaknesses;
  profile.agent_observations = profile.agent_observations || [];
  profile.agent_observations.push(result.agent_observation);
  profile.updated_at = new Date().toISOString();

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json(profile);
}

async function handleFindGap(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);

  const result = await runAgent("find-gap", { profile }, env);
  return json(result);
}

async function handlePropose(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);

  // get the gap first
  const gap = await runAgent("find-gap", { profile }, env);
  if (!gap.gap) return json({ proposal: null, reason: gap.why });

  // get all other products as candidates
  const list = await env.STORE.list({ prefix: "product:" });
  const all = await Promise.all(list.keys.map(k => env.STORE.get(k.name, "json")));
  const candidates = all.filter(p => p && p.id !== id);

  // get rejection history so the agent remembers what humans said no to
  const rejections = (await env.STORE.get("rejections", "json")) || [];

  const result = await runAgent("propose-match", {
    product_a: profile,
    gap,
    candidates,
    rejections,
  }, env);

  if (result.proposal) {
    profile.potential_matches = profile.potential_matches || [];
    profile.potential_matches.push(result.proposal);
    profile.match_status = "proposed";
    profile.updated_at = new Date().toISOString();
    await env.STORE.put("product:" + id, JSON.stringify(profile));
  }

  return json(result);
}

// Sloppy or Not scores never go public (docs/build-judge-routes.md), so the public log drops them.
// The stored log keeps them for the agent's memory.
const PRIVATE_SCORES = { judge: "ai_answers", "score-answers": "human_answers" };

function hideScores(entry) {
  const field = PRIVATE_SCORES[entry.step];
  const list = field && entry.result?.[field];
  if (!Array.isArray(list)) return entry;
  return { ...entry, result: { ...entry.result, [field]: list.map(({ score, ...rest }) => rest) } };
}

async function handleAgentLog(env) {
  const log = (await env.STORE.get("agentlog", "json")) || [];
  return json(log.map(hideScores));
}

// ---- Issue #10: approvals ----

async function handleApprove(id, request, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);
  if (profile.match_status !== "proposed") return json({ error: "no proposal to approve" }, 400);

  const proposal = profile.potential_matches?.[profile.potential_matches.length - 1];
  if (!proposal) return json({ error: "no proposal found" }, 400);

  const partner = await env.STORE.get("product:" + proposal.product_id, "json");
  if (!partner) return json({ error: "partner product not found" }, 404);

  const body = (await readObject(request)) || {};

  const now = new Date().toISOString();
  const match = { ...proposal, approved_by: body.approved_by || "human", approved_at: now };

  const blueprint = await runAgent("blueprint", { product_a: profile, product_b: partner, match }, env);

  profile.blueprint = blueprint;
  profile.match_status = "blueprint_ready";
  profile.updated_at = now;

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json(profile);
}

async function handleReject(id, request, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);
  if (profile.match_status !== "proposed") return json({ error: "no proposal to reject" }, 400);

  const body = await readObject(request);
  if (!body) return json({ error: "body must be a JSON object" }, 400);

  if (!body.reason) return json({ error: "reason required" }, 400);

  const proposal = profile.potential_matches?.[profile.potential_matches.length - 1];
  if (!proposal) return json({ error: "no proposal found" }, 400);

  const now = new Date().toISOString();

  // save rejection so the agent remembers it next time
  const rejections = (await env.STORE.get("rejections", "json")) || [];
  rejections.push({ a_id: id, b_id: proposal.product_id, reason: body.reason, at: now });
  await env.STORE.put("rejections", JSON.stringify(rejections));

  profile.match_status = "unmatched";
  profile.updated_at = now;

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json(profile);
}

// the partner's email, only once a human has approved the match
async function handleContact(id, env) {
  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);
  if (profile.match_status !== "blueprint_ready") return json({ error: "match not approved" }, 403);

  const proposal = profile.potential_matches?.[profile.potential_matches.length - 1];
  if (!proposal) return json({ error: "no match found" }, 400);

  const contact = await env.STORE.get("contact:" + proposal.product_id, "json");
  if (!contact) return json({ error: "partner did not share an email" }, 404);
  return json({ product_id: proposal.product_id, email: contact.email });
}

// ---- Issue #40: Sloppy or Not judge ----
// Spec: docs/build-judge-routes.md. Math: docs/scoring.md, "Sloppy or Not verdict".
// Scores live in judge:<id> and never leave the worker. The only verdicts made public are on /ridicule.

// from agent/judging-questions.md
const AI_QUESTIONS = [
  "Can a stranger tell what this does and who it is for from the first screen?",
  "Does it actually do the thing, or only promise it?",
  "Would you recognize it a week later, or does it look like a template?",
  "Was the copy written by someone who cares?",
  "Can you reach the core action without hitting a dead end?",
  "Do the claims match what is on the page?",
].map((question, i) => ({ id: "A" + (i + 1), question }));

const HUMAN_QUESTIONS = [
  "Who is this for, and what problem are they facing?",
  "If this works perfectly, what changes for them?",
  "Who could this hurt or leave out, and what did you do about it?",
  "Does the way it looks and sounds fit the people it's for?",
  "What already exists in this space, and why isn't it enough?",
  "What's the one thing here you haven't seen done before?",
  "Who did you test it with, what did they say, and what did you change?",
  "Where did you use AI, and where did you step in and overrule it?",
  "What did you learn and take away from building this?",
].map((question, i) => ({ id: i + 1, question }));

// every new judgment is a paid Claude call, so cap them.
// The demo room shares one wifi address, so the per-network cap is generous.
const JUDGE_LIMIT_PER_IP_HOUR = 30;
const JUDGE_LIMIT_PER_DAY = 200;

async function overJudgeLimit(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const now = new Date().toISOString();
  const hourKey = "limit:ip:" + ip + ":" + now.slice(0, 13);
  const dayKey = "limit:day:" + now.slice(0, 10);
  const [ipCount, dayCount] = await Promise.all([hourKey, dayKey].map(async (k) => Number(await env.STORE.get(k)) || 0));
  if (ipCount >= JUDGE_LIMIT_PER_IP_HOUR || dayCount >= JUDGE_LIMIT_PER_DAY) return true;
  // a failed count never blocks a judgment
  try {
    await Promise.all([
      env.STORE.put(hourKey, String(ipCount + 1), { expirationTtl: 7200 }),
      env.STORE.put(dayKey, String(dayCount + 1), { expirationTtl: 172800 }),
    ]);
  } catch {}
  return false;
}

// lowercase host, no trailing slash, query, or hash. null if it is not an http or https link.
function normalizeJudgeUrl(raw) {
  let u;
  try { u = new URL(String(raw || "").trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!u.hostname.includes(".")) return null;
  return u.protocol + "//" + u.host.toLowerCase() + u.pathname.replace(/\/+$/, "");
}

// follow at most 3 redirects by hand so every hop is checked to be http or https.
// TODO: same known limit as handleCheck. Where the url points is not checked.
async function fetchPage(url) {
  let target = url;
  for (let hop = 0; hop <= 3; hop++) {
    const u = new URL(target);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const r = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    const next = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && next) {
      target = new URL(next, u).href;
      continue;
    }
    return { res: r, finalUrl: u.href };
  }
  return null;
}

function tagAttrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
  }
  return out;
}

function decodeEntities(s) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " ";
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[e.toLowerCase()] ?? m;
  });
}

const stripTags = (s) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// the page in the shape agent/prompts/judge.md expects, plus the viewport tag and og:image
function parsePage(html, baseUrl) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => tagAttrs(m[0]));
  const meta = (key) => metas.find((a) => (a.name || a.property || "").toLowerCase() === key)?.content;

  const links = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    if (links.length >= 40) break;
    const href = tagAttrs(m[1]).href;
    if (!href || /^(javascript|mailto|tel):/i.test(href)) continue;
    try { links.push({ text: stripTags(m[2]).slice(0, 80), href: new URL(decodeEntities(href), baseUrl).href }); } catch {}
  }

  const body = html
    .replace(/<head\b[\s\S]*?<\/head>/i, " ")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ");
  const words = stripTags(body).split(" ").filter(Boolean);

  let image = meta("og:image") || meta("twitter:image") || null;
  try { image = image ? new URL(decodeEntities(image), baseUrl).href : null; } catch { image = null; }

  return {
    page: {
      title: stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
      meta_description: decodeEntities(meta("description") || meta("og:description") || "").trim(),
      text: words.slice(0, 6000).join(" "),
      links,
      rendered: false,
    },
    viewport: !!meta("viewport"),
    image,
  };
}

// performance and accessibility from PageSpeed Insights, 50 for both if it fails
async function pageSpeed(url, env) {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.append("category", "performance");
  api.searchParams.append("category", "accessibility");
  api.searchParams.set("strategy", "mobile");
  if (env.PAGESPEED_API_KEY) api.searchParams.set("key", env.PAGESPEED_API_KEY);
  try {
    const r = await fetch(api, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error("status " + r.status);
    const c = (await r.json()).lighthouseResult?.categories || {};
    const perf = c.performance?.score;
    const acc = c.accessibility?.score;
    if (typeof perf !== "number" || typeof acc !== "number") throw new Error("no scores in the reply");
    return { performance: Math.round(perf * 100), accessibility: Math.round(acc * 100), note: null };
  } catch (e) {
    return { performance: 50, accessibility: 50, note: "PageSpeed failed, used 50 for both: " + e.message };
  }
}

// the og:image as thumbnail bytes, PNG or JPEG only
// TODO: same known limit as fetchPage. Where the image url points is not checked.
const THUMB_TYPES = ["image/jpeg", "image/png"];

async function fetchThumb(imageUrl) {
  if (!imageUrl) return null;
  try {
    const u = new URL(imageUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const r = await fetch(u, { signal: AbortSignal.timeout(10000) });
    const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!r.ok || !THUMB_TYPES.includes(type)) return null;
    const bytes = await r.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > 5000000) return null;
    return { bytes, contentType: type };
  } catch {
    return null;
  }
}

// Cloudflare Browser Rendering REST endpoints. null when the token is not set or the call fails,
// so every caller falls back to the plain fetch and og:image.
async function browserRendering(path, payload, env) {
  if (!env.CF_BROWSER_TOKEN || !env.CF_ACCOUNT_ID) return null;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/accounts/" + env.CF_ACCOUNT_ID + "/browser-rendering/" + path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + env.CF_BROWSER_TOKEN },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    return r.ok ? r : null;
  } catch {
    return null;
  }
}

// the page's HTML after a real browser ran it
async function renderPage(url, env) {
  const r = await browserRendering("content", { url }, env);
  const d = r ? await r.json().catch(() => null) : null;
  return d?.success && typeof d.result === "string" ? d.result.slice(0, 2000000) : null;
}

// a 1200 x 630 JPEG for the card
async function screenshot(url, env) {
  const r = await browserRendering("screenshot", { url, viewport: { width: 1200, height: 630 }, screenshotOptions: { type: "jpeg" } }, env);
  if (!r || !(r.headers.get("content-type") || "").startsWith("image/")) return null;
  const bytes = await r.arrayBuffer();
  return bytes.byteLength ? { bytes, contentType: "image/jpeg" } : null;
}

const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// the measured 40 points of the AI score
function measuredPoints(c) {
  return (c.loads ? 10 : 0)
    + Math.min(8, (c.performance || 0) * 0.08)
    + Math.min(8, (c.accessibility || 0) * 0.08)
    + (c.mobile_ok ? 6 : 0)
    + (c.security_headers ? 4 : 0)
    + (c.console_errors === 0 ? 4 : 0);
}

function verdictFor(j) {
  if (j.automated_checks?.loads === false) return "Sloppy";
  if (j.lane === 2) {
    if (j.ai_score / 2 < 30) return "Sloppy";
    return j.total >= 70 ? "Not" : "Sloppy";
  }
  return j.ai_score >= 70 ? "Not" : "Sloppy";
}

// the five review metrics from the AI answers, on the swipe scale, so these projects can be matched
function agentReview(aiAnswers) {
  const s = (id) => aiAnswers.find((a) => a.id === id).score;
  return {
    understood_immediately: s("A1") / 10,
    would_use: s("A2") / 10,
    feels_distinctive: s("A3") / 10,
    easy_to_use: s("A5") / 10,
    looks_like_slop: 1 - (s("A3") + s("A4")) / 20,
  };
}

// the weakness rules at the top of docs/scoring.md
function weaknessTags(r, c) {
  const tags = [];
  if (r.understood_immediately < 0.5) tags.push("onboarding");
  if (r.easy_to_use < 0.5) tags.push("ux");
  if (r.would_use < 0.5) tags.push("value-prop");
  if (r.feels_distinctive < 0.5) tags.push("differentiation");
  if (r.looks_like_slop >= 0.5) tags.push("polish");
  if (c.loads === false || c.console_errors > 0) tags.push("reliability");
  if (c.performance < 50) tags.push("performance");
  if (c.accessibility < 50) tags.push("accessibility");
  if (c.mobile_ok === false) tags.push("mobile");
  if (c.security_headers === false) tags.push("security");
  return tags;
}

// a slug from the host, for example floodwatch-chs-pages-dev, with a short suffix if taken
async function newJudgeId(url, env) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const base = host.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
  if (!(await env.STORE.get("product:" + base)) && !(await env.STORE.get("judge:" + base))) return base;
  for (let i = 0; i < 5; i++) {
    const id = base + "-" + Math.random().toString(36).slice(2, 6);
    if (!(await env.STORE.get("product:" + id)) && !(await env.STORE.get("judge:" + id))) return id;
  }
  throw new Error("could not make a unique id for " + host);
}

const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

// State of Slop signup. Signing up is not consent to share the email with a match partner,
// so contact:<id> is saved only when the owner checks share_with_match.
async function saveEmail(id, email, shareWithMatch, env) {
  const now = new Date().toISOString();
  const key = "subscriber:" + email.toLowerCase();
  let subscriber = await env.STORE.get(key, "json");
  if (!subscriber) {
    subscriber = { email, product_id: id, subscribed_at: now, unsubscribe_token: crypto.randomUUID() };
    await env.STORE.put(key, JSON.stringify(subscriber));
  }
  if (shareWithMatch === true) await env.STORE.put("contact:" + id, JSON.stringify({ email, at: now }));
  return subscriber;
}

// ---- Results email (Resend, sent from aitechgirlfriends.com) ----

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// The verdict word, the card, and an unsubscribe link. No numbers, same as the site.
function resultsEmail(profile, judge, card, unsubscribeUrl) {
  const verdict = judge.verdict === "Not" ? "Not" : "Sloppy";
  const name = profile?.name || "Your project";
  const url = profile?.url || "";
  const brings = card?.brings || [];
  const line = verdict === "Not"
    ? "The agent and the humans agree. This one is not slop."
    : "The agent says it reads as slop right now. That is fixable, and the Judge screen will tell you how others see it.";
  const color = verdict === "Not" ? "#1f9d55" : "#e0287d";

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#faf7f2;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
<p style="margin:0 0 8px;font-size:14px;color:#666">Sloppy or Not verdict for</p>
<h1 style="margin:0 0 4px;font-size:24px">${escapeHtml(name)}</h1>
${url ? `<p style="margin:0 0 24px;font-size:14px"><a href="${escapeHtml(url)}" style="color:#666">${escapeHtml(url)}</a></p>` : ""}
<p style="margin:0 0 16px;font-size:56px;font-weight:800;color:${color}">${verdict}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">${line}</p>
${card?.likes_and_goals ? `<h2 style="margin:0 0 8px;font-size:16px">Likes and goals</h2><p style="margin:0 0 20px;font-size:15px;line-height:1.5">${escapeHtml(card.likes_and_goals)}</p>` : ""}
${brings.length ? `<h2 style="margin:0 0 8px;font-size:16px">What it brings to the table</h2><ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.6">${brings.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
<p style="margin:0 0 24px"><a href="https://sloppyornot.com" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">Judge other projects</a></p>
<p style="margin:0;font-size:12px;color:#888">You are getting this because you asked for your verdict and the weekly State of Slop email. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Unsubscribe</a>.</p>
</div></body></html>`;

  const text = [
    `Sloppy or Not verdict for ${name}${url ? " (" + url + ")" : ""}`,
    "",
    verdict,
    line,
    card?.likes_and_goals ? "\nLikes and goals: " + card.likes_and_goals : "",
    brings.length ? "\nWhat it brings to the table:\n" + brings.map((b) => "- " + b).join("\n") : "",
    "",
    "Judge other projects: https://sloppyornot.com",
    "Unsubscribe: " + unsubscribeUrl,
  ].filter((l) => l !== "").join("\n");

  return { subject: `Your Sloppy or Not verdict: ${verdict}`, html, text };
}

// Sends through Resend. Never throws, so a mail problem never blocks a signup.
async function sendResultsEmail(id, subscriber, request, env) {
  if (!env.RESEND_KEY) return { sent: false, reason: "RESEND_KEY is not set" };

  // one results email per address per project per day, so the route cannot be used to spam someone
  const onceKey = "emailed:" + subscriber.email.toLowerCase() + ":" + id;
  if (await env.STORE.get(onceKey)) return { sent: false, reason: "already sent today" };

  const [profile, judge, card] = await Promise.all([
    env.STORE.get("product:" + id, "json"),
    env.STORE.get("judge:" + id, "json"),
    env.STORE.get("card:" + id, "json"),
  ]);
  const origin = new URL(request.url).origin;
  const unsubscribeUrl = `${origin}/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(subscriber.unsubscribe_token)}`;
  const { subject, html, text } = resultsEmail(profile, judge, card, unsubscribeUrl);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + env.RESEND_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Sloppy or Not <results@aitechgirlfriends.com>",
        to: [subscriber.email],
        subject,
        html,
        text,
        headers: { "List-Unsubscribe": "<" + unsubscribeUrl + ">" },
      }),
    });
    if (!res.ok) {
      const reason = "resend " + res.status + ": " + (await res.text()).slice(0, 300);
      console.log("results email failed", reason);
      return { sent: false, reason };
    }
    await env.STORE.put(onceKey, "1", { expirationTtl: 86400 });
    return { sent: true };
  } catch (e) {
    console.log("results email failed", e.message);
    return { sent: false, reason: e.message };
  }
}

// GET /unsubscribe?email=&token= from the link in every email
async function handleUnsubscribe(url, env) {
  const page = (msg, status = 200) =>
    new Response(`<!doctype html><meta name="viewport" content="width=device-width"><title>Sloppy or Not</title><body style="font-family:Helvetica,Arial,sans-serif;padding:40px;text-align:center"><p>${msg}</p><p><a href="https://sloppyornot.com">sloppyornot.com</a></p></body>`,
      { status, headers: { "content-type": "text/html; charset=utf-8" } });
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const token = String(url.searchParams.get("token") || "");
  const subscriber = email ? await env.STORE.get("subscriber:" + email, "json") : null;
  if (!subscriber) return page("You are not on the list. Nothing else will be sent.");
  if (!token || subscriber.unsubscribe_token !== token) return page("That unsubscribe link is not valid.", 400);
  await env.STORE.delete("subscriber:" + email);
  return page("You are unsubscribed. Nothing else will be sent.");
}

// what POST /judge returns. ai_answers keep their evidence and lose their scores.
function judgeResult(id, judge, card) {
  return {
    id,
    verdict: judge.verdict,
    card: card || null,
    ai_answers: (judge.ai_answers || []).map(({ id, question, evidence }) => ({ id, question, evidence })),
    human_questions: HUMAN_QUESTIONS,
  };
}

const REDO_AFTER_DAYS = 30;

async function handleJudge(request, env) {
  const body = await readObject(request);
  if (!body) return json({ error: "body must be a JSON object" }, 400);

  const url = normalizeJudgeUrl(body.url);
  if (!url) return json({ error: "url must be a full link that starts with http:// or https://" }, 400);

  // a verdict holds for REDO_AFTER_DAYS, so nobody can re-roll it. After that the url can be judged again.
  // The new verdict gets its own id and the url points to it; the old judgment stays as history.
  let previous = null;
  const known = await env.STORE.get("url:" + url);
  if (known) {
    const [judge, card] = await Promise.all([env.STORE.get("judge:" + known, "json"), env.STORE.get("card:" + known, "json")]);
    if (judge) {
      const redoAt = Date.parse(judge.judged_at) + REDO_AFTER_DAYS * 86400000;
      if (!(Date.now() >= redoAt)) return json({ ...judgeResult(known, judge, card), redo_after: new Date(redoAt).toISOString() });
      previous = { id: known, verdict: judge.verdict, judged_at: judge.judged_at };
    }
  }

  if (await overJudgeLimit(request, env)) {
    return json({ error: "Too many new projects were judged from your network. Try again in an hour." }, 429);
  }

  // the card shows "@" + by, and GET /projects must never contain "@"
  const by = String(body.by || "").replace(/@/g, "").trim().slice(0, 40) || "anonymous";
  const now = new Date().toISOString();

  // Browser Rendering first for the page text. The plain fetch always runs too,
  // because only it reports the site's status and headers for the checks.
  const rendered = await renderPage(url, env);

  let fetched = null;
  try { fetched = await fetchPage(url); } catch {}
  const res = fetched?.res;
  const loads = !!res && res.ok;
  const isHtml = /html/i.test(res?.headers.get("content-type") || "");
  const html = loads && isHtml ? (await res.text()).slice(0, 2000000) : "";
  const baseUrl = fetched?.finalUrl || url;

  const withDescription = (p) => {
    if (typeof body.description === "string" && body.description.trim()) {
      p.text = (p.text + " " + body.description.trim().slice(0, 500)).trim();
    }
    return p;
  };
  const fromRendered = (h) => withDescription({ ...parsePage(h, baseUrl).page, rendered: true });

  const plain = parsePage(html, baseUrl);
  const viewport = plain.viewport || (!!rendered && parsePage(rendered, baseUrl).viewport);
  const image = plain.image || (rendered ? parsePage(rendered, baseUrl).image : null);
  let page = rendered ? fromRendered(rendered) : withDescription(plain.page);

  const ps = await pageSpeed(url, env);
  const checks = {
    loads,
    performance: ps.performance,
    accessibility: ps.accessibility,
    mobile_ok: viewport,
    security_headers: !!res && (res.headers.has("content-security-policy") || res.headers.has("strict-transport-security")),
    console_errors: 0,
    checked_at: now,
  };

  // a page that does not load is Sloppy with no agent call. The schema needs fields only the agent writes,
  // so it gets no profile or card and never shows on the Judge screen.
  if (!loads) {
    const id = await newJudgeId(url, env);
    const judge = {
      url, lane: 1, ai_answers: [], agent_review: null, automated_checks: checks, ai_score: round1(measuredPoints(checks)),
      human_answers: null, human_score: null, total: null, verdict: "Sloppy", judged_at: now,
      pagespeed_note: ps.note, fetch_status: res ? res.status : null, previous,
    };
    judge.total = judge.ai_score;
    await env.STORE.put("judge:" + id, JSON.stringify(judge));
    await env.STORE.put("url:" + url, id);
    return json(judgeResult(id, judge, null));
  }

  let reply = await runAgent("judge", { url, page, automated_checks: checks }, env);
  // not enough to judge from a plain fetch: retry once with Browser Rendering before asking for a description
  if (reply.enough_content === false && !page.rendered) {
    const retry = await renderPage(url, env);
    if (retry) {
      page = fromRendered(retry);
      reply = await runAgent("judge", { url, page, automated_checks: checks }, env);
    }
  }
  if (reply.enough_content === false) return json({ needs_description: true });

  // a reply without all six scores is an error, not a zero, so a site is never Sloppy by accident
  const aiAnswers = AI_QUESTIONS.map(({ id, question }) => {
    const a = (Array.isArray(reply.ai_answers) ? reply.ai_answers : []).find((x) => x && x.id === id);
    const score = Number(a?.score);
    if (!a || !Number.isFinite(score)) throw new Error("the judge reply has no score for " + id + ". Try again.");
    return { id, question, score: clamp(score, 0, 10), evidence: String(a.evidence || "") };
  });

  const id = await newJudgeId(url, env);
  const review = agentReview(aiAnswers);
  const aiScore = round1(measuredPoints(checks) + aiAnswers.reduce((sum, a) => sum + a.score, 0));
  const judge = {
    url, lane: 1, ai_answers: aiAnswers, agent_review: review, automated_checks: checks, ai_score: aiScore,
    human_answers: null, human_score: null, total: aiScore, verdict: null, judged_at: now,
    pagespeed_note: ps.note, previous,
  };
  judge.verdict = verdictFor(judge);

  // the Product Profile, with only schema fields, fallbacks, and length caps so it always validates
  const p = reply.profile || {};
  const capabilities = (Array.isArray(p.capabilities) ? p.capabilities : [])
    .map((c) => String(c).trim().toLowerCase()).filter(Boolean).slice(0, 12);
  const profile = {
    id,
    name: String(p.name || page.title || new URL(url).hostname).trim().slice(0, 80),
    url,
    builder: by,
    what_it_does: String(p.what_it_does || page.meta_description || "Not stated on the page.").trim().slice(0, 400),
    target_user: String(p.target_user || "Not stated on the page.").trim().slice(0, 200),
    capabilities: capabilities.length ? capabilities : ["website"],
    automated_checks: checks,
    weaknesses: weaknessTags(review, checks),
    agent_observations: [{ at: now, note: String(reply.observation || "Judged from the submitted page."), source: "submission" }],
    match_status: "unmatched",
    consent: { roast_me: body.roast_me === true },
    status: "submitted",
    created_at: now,
    updated_at: now,
  };

  // the card shows exactly three features
  const card = {
    likes_and_goals: String(reply.card?.likes_and_goals || "").trim(),
    brings: (Array.isArray(reply.card?.brings) ? reply.card.brings : []).map((b) => String(b).trim()).filter(Boolean).slice(0, 3),
  };

  await Promise.all([
    env.STORE.put("product:" + id, JSON.stringify(profile)),
    env.STORE.put("judge:" + id, JSON.stringify(judge)),
    env.STORE.put("card:" + id, JSON.stringify(card)),
  ]);

  // a screenshot first, the page's og:image when Browser Rendering is not available
  const thumb = (await screenshot(url, env)) || (await fetchThumb(image));
  if (thumb) await env.STORE.put("thumb:" + id, thumb.bytes, { metadata: { contentType: thumb.contentType } });
  // the url key goes last, so a half-saved judgment is never reused
  await env.STORE.put("url:" + url, id);

  // a bad email is skipped, so it never blocks a verdict
  const email = String(body.email || "").trim();
  if (validEmail(email)) await saveEmail(id, email, body.share_with_match, env);

  return json(judgeResult(id, judge, card));
}

async function handleJudgeAnswers(id, request, env) {
  const judge = await env.STORE.get("judge:" + id, "json");
  if (!judge) return json({ error: "not found" }, 404);

  // answers count once
  if (judge.lane === 2) return json({ id, verdict: judge.verdict });
  if (judge.automated_checks?.loads === false) return json({ id, verdict: "Sloppy" });

  const body = await readObject(request);
  if (!body || !Array.isArray(body.answers)) return json({ error: "answers must be a list" }, 400);

  const profile = await env.STORE.get("product:" + id, "json");
  if (!profile) return json({ error: "not found" }, 404);

  const answers = HUMAN_QUESTIONS.map(({ id: qid, question }) => {
    const a = body.answers.find((x) => x && Number(x.id) === qid);
    return { id: qid, question, answer: String(a?.answer || "").trim().slice(0, 2000) };
  });

  const reply = await runAgent("score-answers", { profile, answers }, env);

  // a blank answer scores 0 whatever the agent says
  const humanAnswers = answers.map(({ id: qid, answer }) => {
    const h = (Array.isArray(reply.human_answers) ? reply.human_answers : []).find((x) => x && Number(x.id) === qid);
    const score = Number(h?.score);
    return { id: qid, answer, score: answer && Number.isFinite(score) ? clamp(score, 0, 5) : 0, why: String(h?.why || "") };
  });

  const now = new Date().toISOString();
  judge.lane = 2;
  judge.human_answers = humanAnswers;
  // nine answers, 0 to 5 each, scaled to 50 (docs/scoring.md)
  judge.human_score = round1(humanAnswers.reduce((sum, a) => sum + a.score, 0) * 50 / (HUMAN_QUESTIONS.length * 5));
  judge.total = round1(judge.ai_score / 2 + judge.human_score);
  judge.verdict = verdictFor(judge);
  judge.answered_at = now;

  if (reply.observation) {
    profile.agent_observations = profile.agent_observations || [];
    profile.agent_observations.push({ at: now, note: String(reply.observation), source: "submission" });
  }
  profile.updated_at = now;

  await Promise.all([
    env.STORE.put("judge:" + id, JSON.stringify(judge)),
    env.STORE.put("product:" + id, JSON.stringify(profile)),
  ]);
  return json({ id, verdict: judge.verdict });
}

// replies only { ok: true }, so it never reveals who else is subscribed
async function handleJudgeEmail(id, request, env) {
  if (!(await env.STORE.get("judge:" + id))) return json({ error: "not found" }, 404);

  const body = await readObject(request);
  if (!body) return json({ error: "body must be a JSON object" }, 400);

  const email = String(body.email || "").trim();
  if (!validEmail(email)) return json({ error: "email is not valid" }, 400);

  const subscriber = await saveEmail(id, email, body.share_with_match, env);
  await sendResultsEmail(id, subscriber, request, env);
  return json({ ok: true });
}

// one public card. No verdict, no scores, no email.
function projectCard(id, profile, card, hasThumb) {
  return {
    id,
    name: profile.name,
    url: profile.url || null,
    by: profile.builder || "anonymous",
    thumb_url: hasThumb ? "/projects/" + encodeURIComponent(id) + "/thumb" : null,
    likes_and_goals: card.likes_and_goals,
    brings: card.brings,
  };
}

async function loadCard(id, hasThumb, env) {
  const [profile, card] = await Promise.all([env.STORE.get("product:" + id, "json"), env.STORE.get("card:" + id, "json")]);
  return profile && card ? projectCard(id, profile, card, hasThumb) : null;
}

async function cardIdsAndThumbs(env) {
  const [cards, thumbs] = await Promise.all([env.STORE.list({ prefix: "card:" }), env.STORE.list({ prefix: "thumb:" })]);
  return {
    ids: cards.keys.map((k) => k.name.slice("card:".length)),
    thumbs: new Set(thumbs.keys.map((k) => k.name.slice("thumb:".length))),
  };
}

async function handleGetProjects(env) {
  const { ids, thumbs } = await cardIdsAndThumbs(env);
  const cards = await Promise.all(ids.map((id) => loadCard(id, thumbs.has(id), env)));
  return json(cards.filter(Boolean));
}

// the first card the judge has not seen. Never a 404, because the site reads 404 as "not live yet".
async function handleNextProject(url, env) {
  const seen = new Set((url.searchParams.get("seen") || "").split(",").map((s) => s.trim()).filter(Boolean));
  const { ids, thumbs } = await cardIdsAndThumbs(env);
  for (const id of ids.filter((id) => !seen.has(id))) {
    const card = await loadCard(id, thumbs.has(id), env);
    if (card) return json(card);
  }
  return json({ done: true });
}

// the public board: only projects whose owner checked Roast Me, with the verdict and still no numbers
async function handleRidicule(env) {
  const { ids, thumbs } = await cardIdsAndThumbs(env);
  const rows = await Promise.all(ids.map(async (id) => {
    const [profile, card, judge] = await Promise.all([
      env.STORE.get("product:" + id, "json"),
      env.STORE.get("card:" + id, "json"),
      env.STORE.get("judge:" + id, "json"),
    ]);
    if (!profile || !card || profile.consent?.roast_me !== true || !judge?.verdict) return null;
    return { ...projectCard(id, profile, card, thumbs.has(id)), verdict: judge.verdict };
  }));
  return json(rows.filter(Boolean));
}

async function handleThumb(id, env) {
  const { value, metadata } = await env.STORE.getWithMetadata("thumb:" + id, "arrayBuffer");
  if (!value) return json({ error: "not found" }, 404);
  return new Response(value, {
    headers: {
      "content-type": metadata?.contentType || "image/jpeg",
      "cache-control": "public, max-age=86400",
      ...CORS,
    },
  });
}

// binary Judge screen votes. Counts are never returned; they feed the State of Slop email, not the verdict.
async function handleVote(id, request, env) {
  if (!(await env.STORE.get("card:" + id))) return json({ error: "not found" }, 404);

  const body = await readObject(request);
  if (!body || (body.vote !== "slop" && body.vote !== "not")) return json({ error: 'vote must be "slop" or "not"' }, 400);

  // one key per swipe, so a room swiping the same card at once never loses a vote
  const at = new Date().toISOString();
  await env.STORE.put("vote:" + id + ":" + at + ":" + crypto.randomUUID().slice(0, 8), JSON.stringify({ vote: body.vote, at }));

  // running tally, best effort: KV is last write wins, so count from the vote: keys when it matters
  const key = "votes:" + id;
  const votes = (await env.STORE.get(key, "json")) || { slop: 0, not: 0, list: [] };
  votes[body.vote] += 1;
  votes.list.push({ vote: body.vote, at });
  try { await env.STORE.put(key, JSON.stringify(votes)); } catch {}
  return json({ ok: true });
}

// ---- Worker entry ----

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { headers: CORS });
    if (path === "/" || path === "/health") return json({ ok: true, service: "sloppyornot-api" });

    // Issue #7: products
    if (path === "/products" && method === "POST") return handleSubmitProduct(request, env);
    if (path === "/products" && method === "GET")  return handleGetProducts(env);

    const productMatch = path.match(/^\/products\/([^\/]+)$/);
    if (productMatch && method === "GET") return handleGetProduct(productMatch[1], env);

    // Issue #8: reviews and automated checks
    const reviewMatch = path.match(/^\/products\/([^\/]+)\/review$/);
    if (reviewMatch && method === "POST") return handleReview(reviewMatch[1], request, env);

    const checkMatch = path.match(/^\/products\/([^\/]+)\/check$/);
    if (checkMatch && method === "POST") return handleCheck(checkMatch[1], env);

    // Issue #9: agent runtime
    const observeMatch = path.match(/^\/agent\/observe\/([^\/]+)$/);
    if (observeMatch && method === "POST") {
      try { return await handleObserve(observeMatch[1], env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    const findGapMatch = path.match(/^\/agent\/find-gap\/([^\/]+)$/);
    if (findGapMatch && method === "POST") {
      try { return await handleFindGap(findGapMatch[1], env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    const proposeMatch = path.match(/^\/agent\/propose\/([^\/]+)$/);
    if (proposeMatch && method === "POST") {
      try { return await handlePropose(proposeMatch[1], env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    if (path === "/agent/log" && method === "GET") return handleAgentLog(env);

    // Issue #10: approvals
    const approveMatch = path.match(/^\/matches\/([^\/]+)\/approve$/);
    if (approveMatch && method === "POST") {
      try { return await handleApprove(approveMatch[1], request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    const contactMatch = path.match(/^\/matches\/([^\/]+)\/contact$/);
    if (contactMatch && method === "GET") return handleContact(contactMatch[1], env);

    const rejectMatch = path.match(/^\/matches\/([^\/]+)\/reject$/);
    if (rejectMatch && method === "POST") {
      try { return await handleReject(rejectMatch[1], request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    // Issue #40: Sloppy or Not judge
    if (path === "/judge" && method === "POST") {
      try { return await handleJudge(request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    const answersMatch = path.match(/^\/judge\/([^\/]+)\/answers$/);
    if (answersMatch && method === "POST") {
      try { return await handleJudgeAnswers(answersMatch[1], request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    const emailMatch = path.match(/^\/judge\/([^\/]+)\/email$/);
    if (emailMatch && method === "POST") {
      try { return await handleJudgeEmail(emailMatch[1], request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    if (path === "/unsubscribe" && method === "GET") return handleUnsubscribe(url, env);

    if (path === "/projects" && method === "GET") return handleGetProjects(env);
    if (path === "/projects/next" && method === "GET") return handleNextProject(url, env);
    if (path === "/ridicule" && method === "GET") return handleRidicule(env);

    const thumbMatch = path.match(/^\/projects\/([^\/]+)\/thumb$/);
    if (thumbMatch && method === "GET") return handleThumb(thumbMatch[1], env);

    const voteMatch = path.match(/^\/projects\/([^\/]+)\/vote$/);
    if (voteMatch && method === "POST") return handleVote(voteMatch[1], request, env);

    return json({ error: "not found", path }, 404);
  },
};
