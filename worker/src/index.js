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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { headers: CORS });
    if (path === "/" || path === "/health") return json({ ok: true, service: "sloppyornot-api" });

    // Issue #7: products
    // POST /products, GET /products, GET /products/:id

    // Issue #8: reviews and automated checks
    // POST /products/:id/review

    // Issue #9: agent runtime
    // POST /agent/observe/:id, POST /agent/find-gap/:id, POST /agent/propose/:id, GET /agent/log

    // Issue #10: approvals
    // POST /matches/:id/approve, POST /matches/:id/reject

    return json({ error: "not found", path }, 404);
  },
};
