// Pitch demo only. Not part of the product.
// Plays Dot's intro, cuts to TV static, dissolves into the live site, and seats Dot in the corner.
// URL options: ?skip=1 goes straight to the live site. ?page=/judge opens a different page in the frame.
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
  document.addEventListener("keydown", (e) => {
    if (e.target !== document.body && e.target !== start) return;
    if ((e.key === "s" || e.key === "S") && !wentLive) { gate.hidden = true; goLive(); }
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
  window.DotOverlay = { setState, setLevel, goLive };

  if (params.get("skip") === "1") { gate.hidden = true; body.classList.add("skipped"); goLive(); }
})();
