// Sloppy or Not site. Plain JS, no build step.
// API contract: docs/build-judge-routes.md. Until those routes are live, the pages fall back to preview data and say so.

const API = "https://api.sloppyornot.com";

// ---- Layout: logo, header, footer ----

function logoHTML() {
  return `<span class="logo-inner" aria-hidden="true">
    <img class="logo-slop" src="/assets/logo-slop.svg" alt="">
    <p class="logo-or">or</p>
    <p class="logo-not">Not</p>
    <span class="logo-dot"></span>
  </span>`;
}

function renderLayout() {
  document.querySelectorAll("[data-logo]").forEach((el) => {
    el.classList.add("logo");
    el.innerHTML = logoHTML();
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", "Sloppy or Not");
  });

  const header = document.querySelector("[data-header]");
  if (header) {
    header.className = "site-header";
    const size = header.dataset.header === "small" ? 0.5 : 1;
    header.innerHTML = `
      <a href="/" class="logo" style="--s:${size}" aria-label="Sloppy or Not home">${logoHTML()}</a>
      <a href="/about" class="pill pill-white"><img src="/assets/icon-info.svg" alt="">About the project</a>`;
  }

  const footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="legal">
        <p>&copy; 2026 Sloppy or Not. All rights reserved.</p>
        <p>Submitted projects remain the property of their creators. Sloppy or Not is a free educational project. Scores reflect research-based criteria and a mix of human and AI review, and are not a final judgment of you or your work.</p>
        <p>Privacy: We collect only what you submit (your project link, your answers, and your email if you give one) to generate your score. We don't sell your data.</p>
      </div>
      <a href="/" class="logo" style="--s:0.52" aria-label="Sloppy or Not home">${logoHTML()}</a>`;
  }
}

// ---- API with a labeled preview fallback ----

let previewMode = false;

function markPreview() {
  if (previewMode) return;
  previewMode = true;
  const flag = document.createElement("p");
  flag.className = "preview-flag";
  flag.textContent = "Preview data. The live judge is not connected yet.";
  const main = document.querySelector("main");
  if (main) main.prepend(flag);
}

// Returns the JSON body, or null when the route is not live yet (404, network error).
async function api(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      method: options.method || "GET",
      headers: options.body ? { "content-type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
    return data;
  } catch (e) {
    if (e instanceof TypeError) return null;
    throw e;
  }
}

// Preview data mirrors the sample responses in issue #41 and the seed products.
const SAMPLE_PROJECTS = [
  { id: "firstrun", name: "FirstRun", url: "https://firstrun.pages.dev", by: "Two Bridges Labs", thumb_url: null,
    likes_and_goals: "Wants to be the first friend every new user makes. Long walks through your settings page.",
    brings: ["One-script-tag install", "Auto-generated three-step tour", "Contextual first-time tooltips"] },
  { id: "floodwatch-chs", name: "FloodWatch CHS", url: "https://floodwatch-chs.pages.dev", by: "Lowtide", thumb_url: null,
    likes_and_goals: "Wants every Charleston driver home dry. Loves a king tide forecast.",
    brings: ["Live street flooding map", "Driver reports in two taps", "Alerts before you leave"] },
  { id: "shiftswap-chs", name: "ShiftSwap CHS", url: "https://shiftswap-chs.pages.dev", by: "Back of House", thumb_url: null,
    likes_and_goals: "Wants servers and front desk staff to trade shifts without the group text chaos.",
    brings: ["Post a shift in one text", "Manager approval built in", "Works for restaurants and hotels"] },
  { id: "porchlight", name: "Porchlight", url: "https://porchlight-lowcountry.pages.dev", by: "Porchlight Team", thumb_url: null,
    likes_and_goals: "Wants Lowcountry nonprofits to stop begging for volunteers.",
    brings: ["Match by cause and free hours", "One-tap sign up", "Reminders that actually work"] },
];

const HUMAN_QUESTIONS = [
  "Who did you talk to or learn from about this problem, and what surprised you?",
  "If this works, what changes for one specific person?",
  "What could go wrong, and who would be hurt first?",
  "What already exists, and why wasn't it enough? Why this approach over a simpler one?",
  "What's the first thing that would break if 1,000 people used this?",
  "What did you cut or simplify, and why?",
  "What did you learn and take away from building this?",
  "What would you tell the next team attempting this?",
].map((question, i) => ({ id: i + 1, question }));

const AI_QUESTIONS = [
  "Can a stranger tell what this does and who it is for from the first screen?",
  "Does it actually do the thing, or only promise it?",
  "Would you recognize it a week later, or does it look like a template?",
  "Was the copy written by someone who cares?",
  "Can you reach the core action without hitting a dead end?",
  "Do the claims match what is on the page?",
];

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Storage can throw in private windows. Never let it break a page.
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};

renderLayout();
