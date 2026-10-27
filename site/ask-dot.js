// Ask Dot: a live voice Q&A with Dot, bottom right on every page. Same agent as the pitch page.
// Capped so nobody burns credits: QUESTION_CAP questions per call, CALLS_PER_DAY calls per browser, and
// ElevenLabs ends any call at the agent's max_duration_seconds. The agent's daily limit is the hard ceiling.
// The voice client (1 MB) loads only when someone presses Ask Dot.
// On the homepage on wide screens Dot stands full body instead of the round face. She walks in once per
// browser (muted, since browsers block sound until a click), and Replay plays the walk-in again with her voice.
(function () {
  if (window.top !== window || location.pathname.startsWith("/pitch/")) return; // the pitch page has its own Dot

  const QUESTION_CAP = 4;
  const CALLS_PER_DAY = 3;
  const CLIENT = "/pitch/dot/vendor/elevenlabs-client-1.27.0.js";
  const STAND = (location.pathname === "/" || location.pathname === "/index.html") && matchMedia("(min-width: 900px)").matches;
  // Safari plays WebM but drops the transparency, so it gets the still with a CSS rise instead of the video
  const ALPHA_VIDEO = !/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const CALM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = document.createElement("style");
  css.textContent = `
.ask-dot { position: fixed; right: 16px; bottom: 16px; z-index: 50; display: flex; align-items: center; gap: 10px;
  font: 700 13px/1 var(--mono, "Space Mono", ui-monospace, monospace); color: var(--text, #f5f2ed); }
.ask-dot img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; object-position: 50% 28%;
  background: #000; box-shadow: 0 0 0 2px var(--pink, #ff00ff); transition: box-shadow .2s ease; }
.ask-dot[data-state="listening"] img { animation: ask-dot-pulse 1.6s ease-in-out infinite; }
.ask-dot[data-state="speaking"] img { box-shadow: 0 0 0 2px var(--pink, #ff00ff), 0 0 calc(8px + var(--level, .5) * 26px) rgba(255, 0, 255, .75); }
@keyframes ask-dot-pulse { 50% { box-shadow: 0 0 0 2px var(--pink, #ff00ff), 0 0 18px rgba(255, 0, 255, .6); } }
.ask-dot-panel { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.ask-dot-row { display: flex; gap: 8px; }
.ask-dot button { font: inherit; letter-spacing: .04em; color: #0b0a0f; background: var(--pink, #ff00ff); border: 0;
  border-radius: 999px; padding: 11px 16px; cursor: pointer; white-space: nowrap; }
.ask-dot button.ask-dot-end { background: #2a2940; color: var(--text, #f5f2ed); }
.ask-dot button:disabled { opacity: .6; cursor: wait; }
.ask-dot button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.ask-dot-status { font-weight: 400; font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted, #a19fb4); background: rgba(11, 10, 15, .85); padding: 4px 8px; border-radius: 6px; }
.ask-dot-status:empty, .ask-dot [hidden] { display: none; }
.ask-dot img { cursor: pointer; }
@media (max-width: 600px) {
  body { padding-bottom: 80px; }
  .ask-dot[data-state="idle"] .ask-dot-go { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); padding: 0; }
  .ask-dot img { width: 48px; height: 48px; }
}
.ask-dot-stand { position: relative; width: min(30vh, 266px); aspect-ratio: 504 / 720; cursor: pointer; margin: 0 -16px -16px 0;
  transition: filter .2s ease; }
.ask-dot .ask-dot-stand img, .ask-dot .ask-dot-stand video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;
  border-radius: 0; box-shadow: none; background: none; animation: none; }
.ask-dot .ask-dot-stand img.rise { animation: ask-dot-rise 1.2s ease-out both; }
@keyframes ask-dot-rise { from { opacity: 0; transform: translateY(40px); } }
.ask-dot[data-state="listening"] .ask-dot-stand { animation: ask-dot-glow 1.6s ease-in-out infinite; }
.ask-dot[data-state="speaking"] .ask-dot-stand { filter: drop-shadow(0 0 calc(6px + var(--level, .5) * 22px) rgba(255, 0, 255, .8)); }
@keyframes ask-dot-glow { 50% { filter: drop-shadow(0 0 14px rgba(255, 0, 255, .65)); } }
.ask-dot-tip { position: absolute; right: 100%; top: 18%; margin-right: 4px; width: 190px; padding: 10px 12px; border-radius: 10px;
  font: 400 13px/1.4 var(--body, Inter, system-ui, sans-serif); color: var(--text, #f5f2ed); background: rgba(11, 10, 15, .92);
  box-shadow: 0 0 0 1px var(--pink, #ff00ff); opacity: 0; transform: translateX(6px); transition: opacity .2s ease, transform .2s ease;
  pointer-events: none; }
.ask-dot-stand:hover .ask-dot-tip, .ask-dot-stand:focus-visible .ask-dot-tip { opacity: 1; transform: none; }
.ask-dot[data-state="listening"] .ask-dot-tip, .ask-dot[data-state="speaking"] .ask-dot-tip { display: none; }
.ask-dot-stand:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
.ask-dot button.ask-dot-replay { background: none; color: var(--muted, #a19fb4); padding: 6px 4px; font-weight: 400; font-size: 11px;
  text-decoration: underline; text-underline-offset: 3px; }
.ask-dot button.ask-dot-replay:hover { color: var(--text, #f5f2ed); }
@media (prefers-reduced-motion: reduce) { .ask-dot img, .ask-dot-stand { animation: none !important; } }`;
  document.head.appendChild(css);

  const root = document.createElement("div");
  root.className = "ask-dot";
  root.dataset.state = "idle";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Ask Dot, a live voice Q&A");
  root.innerHTML = `
    <div class="ask-dot-panel">
      <p class="ask-dot-status" role="status" aria-live="polite"></p>
      <div class="ask-dot-row">
        <button type="button" class="ask-dot-end" hidden>End</button>
        <button type="button" class="ask-dot-go">Ask Dot</button>
      </div>
      ${STAND ? '<button type="button" class="ask-dot-replay">Replay her intro</button>' : ""}
    </div>
    ${STAND ? `<div class="ask-dot-stand" role="button" tabindex="0" aria-label="Ask Dot, a voice agent">
      <img src="/assets/dot-walkin/dot-standing.webp" alt="">
      <span class="ask-dot-tip">I am Dot, a voice agent. Click me and ask anything about Sloppy or Not.</span>
    </div>` : '<img src="/assets/dot.webp" alt="">'}`;
  document.body.appendChild(root);
  const go = root.querySelector(".ask-dot-go");
  const end = root.querySelector(".ask-dot-end");
  const status = root.querySelector(".ask-dot-status");

  let convo = null, starting = false, asked = 0, mode = "listening", done = false, deadline = 0, tick = 0, raf = 0;

  // calls per browser per day, kept in localStorage. A convenience, not security: the agent's daily limit is.
  const today = new Date().toISOString().slice(0, 10);
  function callsToday() {
    try { const v = JSON.parse(localStorage.getItem("ask-dot") || "{}"); return v.day === today ? v.calls : 0; } catch { return 0; }
  }
  function countCall() {
    try { localStorage.setItem("ask-dot", JSON.stringify({ day: today, calls: callsToday() + 1 })); } catch {}
  }

  const say = (text) => { status.textContent = text; };
  function show() {
    if (!convo) return;
    root.dataset.state = mode === "speaking" ? "speaking" : "listening";
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (done) say(mode === "speaking" ? "Dot is answering your last question" : "That was your last question");
    else say(`${mode === "speaking" ? "Dot is talking" : "Ask your question"} · ${Math.min(asked + 1, QUESTION_CAP)} of ${QUESTION_CAP} · ${clock}`);
  }
  function level() {
    if (!convo) return;
    if (mode === "speaking") root.style.setProperty("--level", Math.min(1, convo.getOutputVolume() * 2.5).toFixed(2));
    raf = requestAnimationFrame(level);
  }

  function loadClient() {
    if (window.ElevenLabsClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CLIENT; s.onload = resolve; s.onerror = () => reject(new Error("voice client did not load"));
      document.head.appendChild(s);
    });
  }

  async function start() {
    if (convo || starting) return;
    if (callsToday() >= CALLS_PER_DAY) { say("Dot is out of questions for today. Come back tomorrow."); return; }
    starting = true;
    go.disabled = true;
    say("Calling Dot");
    try {
      await loadClient();
      const res = await fetch("/pitch/dot/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.signed_url) throw new Error(data.error || `session ${res.status}`);
      asked = 0; done = false; mode = "listening";
      convo = await window.ElevenLabsClient.Conversation.startSession({
        signedUrl: data.signed_url,
        connectionType: "websocket",
        onModeChange: (m) => {
          mode = m.mode;
          // the last answer is over: hang up for them
          if (done && mode === "listening") { stop(); say("That was your last question. Thanks for asking!"); return; }
          show();
        },
        onMessage: (m) => {
          if (m.role !== "user" && m.source !== "user") return;
          asked++;
          if (asked >= QUESTION_CAP) { done = true; convo?.setMicMuted(true); }
          show();
        },
        onDisconnect: () => stop(),
        onError: (msg) => console.warn("Ask Dot:", msg),
      });
      countCall();
      deadline = Date.now() + (data.max_seconds || 150) * 1000;
      go.hidden = true;
      end.hidden = false;
      tick = setInterval(() => { show(); if (Date.now() >= deadline) stop(); }, 500);
      level();
      show();
    } catch (err) {
      console.warn("Ask Dot failed:", err);
      say("Dot could not pick up. Try again in a minute.");
    } finally {
      starting = false;
      go.disabled = false;
    }
  }

  function stop() {
    const c = convo;
    if (!c) return;
    convo = null;
    clearInterval(tick);
    cancelAnimationFrame(raf);
    root.dataset.state = "idle";
    root.style.removeProperty("--level");
    end.hidden = true;
    go.hidden = false;
    say("");
    c.endSession().catch(() => {});
  }

  go.addEventListener("click", start);
  const face = root.querySelector(STAND ? ".ask-dot-stand" : "img");
  face.addEventListener("click", () => { if (!convo) start(); });
  face.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !convo) { e.preventDefault(); start(); } });
  if (STAND) walkIn();

  // The walk-in sits over the standing still and ends on the same frame, then gets out of the way.
  function walkIn() {
    const still = face.querySelector("img");
    const replay = root.querySelector(".ask-dot-replay");
    let seen = false;
    try { seen = localStorage.getItem("dot-walkin") === "1"; localStorage.setItem("dot-walkin", "1"); } catch {}
    function play(withSound) {
      if (convo || starting) return;
      face.querySelector("video")?.remove();
      if (!ALPHA_VIDEO) { still.classList.remove("rise"); void still.offsetWidth; still.classList.add("rise"); return; }
      const v = document.createElement("video");
      v.src = "/assets/dot-walkin/dot-walkin.webm";
      v.muted = !withSound; v.playsInline = true; v.preload = "auto";
      v.setAttribute("aria-hidden", "true");
      still.style.visibility = "hidden";
      const done = () => { still.style.visibility = ""; v.remove(); };
      v.addEventListener("ended", done);
      v.addEventListener("error", done);
      face.prepend(v);
      v.play().catch(done);
    }
    replay.addEventListener("click", () => play(true));
    if (!seen && !CALM) play(false);
  }
  end.addEventListener("click", stop);
})();
