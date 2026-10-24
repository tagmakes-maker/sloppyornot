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

// ---- Issue #7: products ----

async function handleSubmitProduct(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  if (!body.id || !body.name || !body.what_it_does || !body.target_user || !body.capabilities) {
    return json({ error: "missing required fields: id, name, what_it_does, target_user, capabilities" }, 400);
  }

  const existing = await env.STORE.get("product:" + body.id);
  if (existing) return json({ error: "product id already exists" }, 409);

  const now = new Date().toISOString();
  const profile = {
    ...body,
    status: "submitted",
    match_status: "unmatched",
    created_at: body.created_at || now,
    updated_at: now,
  };

  await env.STORE.put("product:" + profile.id, JSON.stringify(profile));
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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
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
    if (body[field] !== undefined) {
      const prev = hr[field] ?? 0;
      hr[field] = ((prev * (count - 1)) + Number(body[field])) / count;
    }
  }

  hr.swipe_count = count;
  hr.verified = count >= VERIFIED_THRESHOLD;

  profile.human_review = hr;
  profile.updated_at = new Date().toISOString();

  await env.STORE.put("product:" + id, JSON.stringify(profile));
  return json(profile);
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

      max_tokens: 2048,
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
  if (!data.content[0].text) {
    throw new Error("Anthropic content[0] has no text: " + JSON.stringify(data.content[0]));
  }
  const text = data.content[0].text;

  // parse the first JSON object out of the reply
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) throw new Error("no JSON in agent reply: " + text.slice(0, 200));
  const result = JSON.parse(match[0]);

  // append to agentlog
  const log = (await env.STORE.get("agentlog", "json")) || [];
  log.push({ step, at: new Date().toISOString(), input_summary: input.product_id || input.product_a?.id || "unknown", result });
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

async function handleAgentLog(env) {
  const log = (await env.STORE.get("agentlog", "json")) || [];
  return json(log);
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

  let body = {};
  try { body = await request.json(); } catch {}

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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

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

    const rejectMatch = path.match(/^\/matches\/([^\/]+)\/reject$/);
    if (rejectMatch && method === "POST") {
      try { return await handleReject(rejectMatch[1], request, env); }
      catch (e) { return json({ error: e.message }, 500); }
    }

    return json({ error: "not found", path }, 404);
  },
};
