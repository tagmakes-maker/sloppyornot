// Pitch demo only. Not part of the product.
// Plays Dot's intro, cuts to TV static, dissolves into the live site, and seats Dot in the corner.
// URL options: ?skip=1 goes straight to the live site. ?page=/judge opens a different page in the frame.
// ?practice=1 is the rehearsal copy: G makes a fresh Gigs Tonight copy every run, so the stage pair stays untouched.
// Keys: S skips the intro. G opens the Gituationship match page. C plays the close. Escape leaves the close.
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

  // Practice: copy the Gigs Tonight profile under a new id, with matching consent off so
  // the copy is never offered as someone else's match. Then open its match page.
  let opening = false;
  async function openMatch() {
    if (opening) return;
    opening = true;
    gate.hidden = true;
    if (!wentLive) { body.classList.add("skipped"); goLive(); }
    let id = STAGE_MATCH_ID;
    try {
      if (practice) {
        const seed = await (await fetch("/pitch/dot/practice/gigs-tonight.json")).json();
        const stamp = new Date().toISOString().replace(/\D/g, "").slice(4, 14);
        id = `gigs-tonight-practice-${stamp}`;
        const now = new Date().toISOString();
        const res = await fetch(API + "/products", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...seed, id, created_at: now, updated_at: now }),
        });
        if (!res.ok) throw new Error(`practice copy failed: ${res.status} ${await res.text()}`);
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

  function onKey(e) {
    const k = e.key.toLowerCase();
    if (k === "s" && !wentLive) { gate.hidden = true; goLive(); }
    else if (k === "g") openMatch();
    else if (k === "c" && !closing) playClose();
    else if (k === "escape" && closing) endClose();
  }
  document.addEventListener("keydown", (e) => {
    if (e.target !== document.body && e.target !== start && e.target !== site) return;
    onKey(e);
  });
  // Once someone clicks the site, keys go to the frame. Listen there too, but never while typing in a form.
  site.addEventListener("load", () => {
    try {
      site.contentDocument.addEventListener("keydown", (e) => {
        if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
        onKey(e);
      });
    } catch (err) { /* another origin: keys only work outside the frame */ }
  });

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
  window.DotOverlay = { setState, setLevel, goLive, playClose, endClose, openMatch };

  if (params.get("skip") === "1") { gate.hidden = true; body.classList.add("skipped"); goLive(); }
})();
