// Pitch demo only. Not part of the product.
// Plays Dot's intro, cuts to TV static, dissolves into the live site, and seats Dot in the corner.
// URL options: ?skip=1 goes straight to the live site. ?page=/judge opens a different page in the frame.
// ?practice=1 is the rehearsal mode: G makes a fresh Gigs Tonight copy every run, so the stage pair stays untouched.
// Keys: S skips the intro. G opens the Gituationship match page. C plays the close. Escape leaves the close.
// L starts the live mic (and mutes or unmutes it once live). X ends the live conversation.
// A Not verdict on /submit jumps to the Gituationship match by itself after a few seconds. Escape cancels it.
(function () {
  const params = new URLSearchParams(location.search);
  const page = params.get("page") || "/";
  // Scene 3's TV screen fills the frame at about 19.4s. Static takes over there.
  // The video keeps playing underneath, so Dot's "Let's go" finishes over the static.
  const STATIC_AT = 19.4;
  const STATIC_HOLD_MS = 700;
  const DISSOLVE_MS = 1400;

  const body = document.body;
  const site = document.getElementById("site");
  const video = document.getElementById("intro");
  const canvas = document.getElementById("static");
  const gate = document.getElementById("gate");
  const start = document.getElementById("start");
  const dot = document.getElementById("dot");
  const status = dot.querySelector(".dot-status");
  const head = dot.querySelector(".dot-head");

  const practice = params.get("practice") === "1";
  // The demo couple on stage. Matching is one-shot, so rehearsals use a fresh copy instead.
  const STAGE_MATCH_ID = "gigs-tonight-chs";
  const API = "https://api.sloppyornot.com";
  if (practice) body.classList.add("practice");

  let staticRunning = false;
  let wentLive = false;

  // Load the real site behind the video right away, so it is ready when the static clears.
  site.src = page;

  // TV static drawn in code, so it can run as long as needed and never needs a file.
  const ctx = canvas.getContext("2d");
  function drawStatic() {
    if (!staticRunning) return;
    const w = (canvas.width = 320), h = (canvas.height = 180);
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const band = (performance.now() / 6) % h;
    for (let y = 0; y < h; y++) {
      const roll = Math.abs(y - band) < 6 ? 60 : 0;
      for (let x = 0; x < w; x++) {
        const v = Math.min(255, ((Math.random() * 230) | 0) + roll);
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(drawStatic);
  }

  function fade(el, to, ms) {
    return el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: to }], { duration: ms, fill: "forwards", easing: "ease-in-out" }).finished;
  }

  async function goLive() {
    if (wentLive) return;
    wentLive = true;
    staticRunning = true;
    drawStatic();
    await fade(canvas, 1, 250);
    body.classList.add("live");
    await new Promise((r) => setTimeout(r, STATIC_HOLD_MS));
    await fade(canvas, 0, DISSOLVE_MS);
    staticRunning = false;
    site.removeAttribute("tabindex");
    site.focus();
    setState("idle");
  }

  async function play() {
    gate.hidden = true;
    try {
      await video.play();
    } catch (err) {
      // Playback refused or the file is missing. Go straight to the live site, never a blank screen.
      console.warn("Intro could not play:", err);
      body.classList.add("skipped");
      goLive();
    }
  }

  video.addEventListener("timeupdate", () => {
    if (video.currentTime >= STATIC_AT) goLive();
  });
  video.addEventListener("ended", () => { goLive(); video.hidden = true; });
  video.addEventListener("error", () => { body.classList.add("skipped"); goLive(); });
  // A stalled network should not strand the room on a frozen frame.
  video.addEventListener("stalled", () => setTimeout(() => { if (!wentLive && video.paused) goLive(); }, 4000));

  start.addEventListener("click", play);

  // The close. Dot speaks each line from her corner while its card is up.
  const closeEl = document.getElementById("close");
  const cards = closeEl.querySelectorAll(".close-card");
  const lines = [document.getElementById("close-1"), document.getElementById("close-2")];
  let closing = false;
  let meter = null;

  // Drive her speaking state from the audio itself, so the glow and head move with the words.
  function speak(audio) {
    return new Promise((resolve) => {
      try {
        if (!meter) {
          const ac = new AudioContext();
          const an = ac.createAnalyser(); an.fftSize = 256; an.connect(ac.destination);
          meter = { ac, an, buf: new Uint8Array(an.frequencyBinCount), wired: new Set() };
        }
        if (!meter.wired.has(audio)) { meter.ac.createMediaElementSource(audio).connect(meter.an); meter.wired.add(audio); }
        meter.ac.resume();
      } catch (err) { console.warn("No level meter:", err); }
      setState("speaking");
      let raf;
      const tick = () => {
        if (meter) {
          meter.an.getByteTimeDomainData(meter.buf);
          let peak = 0;
          for (const v of meter.buf) peak = Math.max(peak, Math.abs(v - 128));
          setLevel(peak / 64);
        }
        raf = requestAnimationFrame(tick);
      };
      const done = () => { cancelAnimationFrame(raf); setState("idle"); resolve(); };
      audio.currentTime = 0;
      audio.onended = done;
      audio.onerror = done;
      audio.play().then(tick).catch(done);
    });
  }

  async function playClose() {
    if (closing) return;
    closing = true;
    gate.hidden = true;
    if (!wentLive) { body.classList.add("skipped"); goLive(); }
    closeEl.hidden = false;
    for (let i = 0; i < cards.length && closing; i++) {
      cards.forEach((c, j) => { c.hidden = j !== i; });
      const clip = cards[i].querySelector("video");
      if (clip) { clip.currentTime = 0; clip.play().catch(() => {}); }
      await speak(lines[i]);
      if (i < cards.length - 1) await new Promise((r) => setTimeout(r, 500));
    }
  }
  function endClose() {
    closing = false;
    lines.forEach((a) => a.pause());
    closeEl.hidden = true;
    setState("idle");
  }

  // Practice: copy the Gigs Tonight profile under a new id and have the agent propose its match right away,
  // in the background while the intro plays, so the match page opens with ClearPath already picked.
  // The stage pair is pre-proposed the same way before the pitch (docs/dot-handoff.md), so only Approve runs live.
  // Matching consent stays on: the agent reads it as product A opting out. The copies only offer
  // event listings, which no product in the pool is missing, so they are never anyone's pick.
  let practiceReady = null;
  function preparePractice() {
    if (practiceReady) return practiceReady;
    practiceReady = (async () => {
      const seed = await (await fetch("/pitch/dot/practice/gigs-tonight.json")).json();
      const stamp = new Date().toISOString().replace(/\D/g, "").slice(4, 14);
      const id = `gigs-tonight-practice-${stamp}`;
      const now = new Date().toISOString();
      const res = await fetch(API + "/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...seed, id, created_at: now, updated_at: now }),
      });
      if (!res.ok) throw new Error(`practice copy failed: ${res.status} ${await res.text()}`);
      const pick = await fetch(API + `/agent/propose/${encodeURIComponent(id)}`, { method: "POST" });
      if (!pick.ok) console.warn("practice propose failed, the page will offer Find my match:", pick.status);
      return id;
    })();
    practiceReady.catch(() => { practiceReady = null; });
    return practiceReady;
  }
  if (practice) preparePractice();

  let opening = false;
  async function openMatch() {
    if (opening) return;
    opening = true;
    gate.hidden = true;
    if (!wentLive) { body.classList.add("skipped"); goLive(); }
    let id = STAGE_MATCH_ID;
    try {
      if (practice) {
        if (!convo) { dot.dataset.state = "listening"; status.textContent = "Dot is picking a match"; }
        id = await preparePractice();
        practiceReady = null;
        if (!convo) setState("idle");
      }
      site.src = `/gituationship/matches?id=${encodeURIComponent(id)}`;
    } catch (err) {
      console.warn(err);
      status.textContent = "Practice copy failed. Press G to try again.";
      dot.dataset.state = "muted";
    } finally {
      opening = false;
    }
  }

  // Live Q&A. The page asks /pitch/dot/session for a signed URL (functions/pitch/dot/session.js), so the
  // agent keeps auth on. ElevenLabs ends the call at max_seconds on its side; the timer here just shows it.
  const micBtn = document.getElementById("live-mic");
  const endBtn = document.getElementById("live-end");
  const timerEl = document.getElementById("live-timer");
  let convo = null;
  let starting = false;
  let muted = false;
  let mode = "listening";
  let deadline = 0;
  let timerId = 0;
  let levelRaf = 0;

  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function showLiveState() {
    if (!convo) return;
    setState(mode === "speaking" ? "speaking" : muted ? "muted" : "listening");
  }
  function tickTimer() {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    timerEl.textContent = clock(left);
    timerEl.classList.toggle("ending", left <= 30);
    if (left === 0) endLive();
  }
  function tickLevel() {
    if (!convo) return;
    if (mode === "speaking") setLevel(Math.min(1, convo.getOutputVolume() * 2.5));
    levelRaf = requestAnimationFrame(tickLevel);
  }

  async function startLive() {
    if (convo) { muted = !muted; convo.setMicMuted(muted); micBtn.textContent = muted ? "Unmute mic" : "Mute mic"; showLiveState(); return; }
    if (starting) return;
    starting = true;
    gate.hidden = true;
    if (!wentLive) { body.classList.add("skipped"); goLive(); }
    micBtn.disabled = true;
    micBtn.textContent = "Calling Dot";
    status.textContent = "Calling Dot";
    try {
      if (!window.ElevenLabsClient) throw new Error("voice client did not load");
      const res = await fetch("/pitch/dot/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.signed_url) throw new Error(data.error || `session ${res.status}`);
      const session = await window.ElevenLabsClient.Conversation.startSession({
        signedUrl: data.signed_url,
        connectionType: "websocket",
        onModeChange: (m) => { mode = m.mode; showLiveState(); },
        onDisconnect: () => stopLive(),
        onError: (msg) => console.warn("Dot live:", msg),
      });
      convo = session;
      muted = false;
      mode = "listening";
      deadline = Date.now() + (data.max_seconds || 300) * 1000;
      timerEl.hidden = false;
      endBtn.hidden = false;
      micBtn.textContent = "Mute mic";
      tickTimer();
      timerId = setInterval(tickTimer, 250);
      tickLevel();
      showLiveState();
    } catch (err) {
      console.warn("Live mic failed:", err);
      micBtn.textContent = "Ask Dot";
      status.textContent = "Mic did not connect. Press L to try again.";
      dot.dataset.state = "muted";
    } finally {
      starting = false;
      micBtn.disabled = false;
    }
  }
  // Tidy the page once the call is over, whoever ended it.
  function stopLive() {
    if (!convo) return;
    convo = null;
    clearInterval(timerId);
    cancelAnimationFrame(levelRaf);
    timerEl.hidden = true;
    timerEl.classList.remove("ending");
    endBtn.hidden = true;
    micBtn.textContent = "Ask Dot";
    setState("idle");
  }
  function endLive() {
    const c = convo;
    stopLive();
    if (c) c.endSession().catch(() => {});
  }
  micBtn.addEventListener("click", startLive);
  endBtn.addEventListener("click", endLive);

  function onKey(e) {
    const k = e.key.toLowerCase();
    if (k === "s" && !wentLive) { gate.hidden = true; goLive(); }
    else if (k === "g") openMatch();
    else if (k === "c" && !closing) playClose();
    else if (k === "escape" && jumpTimer) { clearTimeout(jumpTimer); jumpTimer = 0; setState(convo ? "listening" : "idle"); }
    else if (k === "escape" && closing) endClose();
    else if (k === "l") startLive();
    else if (k === "x") endLive();
  }
  document.addEventListener("keydown", (e) => {
    if (e.target !== document.body && e.target !== start && e.target !== site && !e.target.closest(".dot-live")) return;
    onKey(e);
  });
  // Once someone clicks the site, keys go to the frame. Listen there too, but never while typing in a form.
  site.addEventListener("load", () => {
    try {
      site.contentDocument.addEventListener("keydown", (e) => {
        if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
        onKey(e);
      });
      watchVerdict(site.contentDocument);
    } catch (err) { /* another origin: keys only work outside the frame */ }
  });

  // Stage flow: paste a URL on /submit, and once the verdict says Not, hold it on screen for the room,
  // then jump to the Gituationship match by itself. A Sloppy verdict stays put. Escape cancels the jump.
  const VERDICT_HOLD_MS = 4000;
  let jumpTimer = 0;
  function watchVerdict(doc) {
    const step = doc.getElementById("step-verdict");
    if (!step) return;
    const seen = new MutationObserver(() => {
      if (step.hidden) return;
      const word = doc.getElementById("verdict-word")?.textContent;
      if (word !== "Not") return;
      seen.disconnect();
      if (!convo) { dot.dataset.state = "listening"; status.textContent = "Not sloppy. Let's find its match."; }
      jumpTimer = setTimeout(() => { jumpTimer = 0; if (!convo) setState("idle"); openMatch(); }, VERDICT_HOLD_MS);
    });
    seen.observe(step, { attributes: true, attributeFilter: ["hidden"] });
  }

  // Dot's overlay states: idle, listening, speaking, muted. The live voice sets these.
  const LABELS = { idle: "Dot is watching", listening: "Dot is listening", speaking: "Dot is talking", muted: "Mic off" };
  function setState(state) {
    dot.dataset.state = state;
    status.textContent = LABELS[state] || "";
    if (state !== "speaking") { head.style.transform = ""; dot.style.removeProperty("--level"); }
  }
  // level is 0 to 1 from the voice output. Small head motion and a brighter glow, nothing more.
  function setLevel(level) {
    if (dot.dataset.state !== "speaking") return;
    const l = Math.max(0, Math.min(1, level));
    head.style.transform = `rotate(${(l * 3 - 1).toFixed(2)}deg) translateY(${(-l * 1.5).toFixed(2)}%)`;
    dot.style.setProperty("--level", (0.35 + l * 0.65).toFixed(2));
  }
  window.DotOverlay = { setState, setLevel, goLive, playClose, endClose, openMatch, startLive, endLive };

  if (params.get("skip") === "1") { gate.hidden = true; body.classList.add("skipped"); goLive(); }
})();
