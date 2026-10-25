// Pitch demo only. Cloudflare Pages Function at /pitch/dot/session (Therese's lane, serves site/pitch/).
// Hands the pitch page a one-time signed URL for Dot's live voice agent, so the agent can keep auth on
// and the ElevenLabs key never reaches the browser.
// Secret: ELEVENLABS_API_KEY on the sloppyornot-site Pages project (production and preview).
// The time limit is enforced by ElevenLabs on the agent (max_duration_seconds). MAX_SECONDS must match it.
const AGENT_ID = "agent_7901m5rd7f3pejesmpnwjb0dsehp";
const MAX_SECONDS = 300;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function onRequestGet({ request, env }) {
  // Only the pitch page asks for this. A speed bump, not a lock: the agent's daily limit is the real cap.
  if (request.headers.get("sec-fetch-site") !== "same-origin") return json({ error: "pitch page only" }, 403);
  if (!env.ELEVENLABS_API_KEY) return json({ error: "ELEVENLABS_API_KEY is not set" }, 503);

  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`, {
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
  });
  if (!res.ok) return json({ error: `ElevenLabs said ${res.status}` }, 502);
  const { signed_url } = await res.json();
  return json({ signed_url, max_seconds: MAX_SECONDS });
}
