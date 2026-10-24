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
    // POST /products/:id/review

    // Issue #9: agent runtime
    // POST /agent/observe/:id, POST /agent/find-gap/:id, POST /agent/propose/:id, GET /agent/log

    // Issue #10: approvals
    // POST /matches/:id/approve, POST /matches/:id/reject

    return json({ error: "not found", path }, 404);
  },
};
