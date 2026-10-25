// Pitch demo only. Not part of the product.
// Add <script src="/pitch/roast-overlay.js" defer></script> to any page.
// It does nothing unless the URL has ?demo=1. Roasts are cached here, so no API call on stage.
// Which roasts: ?product=<seed id> in the URL, or data-product-id on <body>. Otherwise the generic set.
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("demo") !== "1") return;

  // Grounded in each seed product's real numbers, so the jokes match what the checks found.
  const ROASTS = {
    helpdock: [
      "Performance score 44. My microwave loads faster, and it is from 2004.",
      "Two console errors. The help widget needs a help widget.",
      "No security headers. The front door is open and the FAQ bot is the doorman.",
      "Only a third of reviewers called it distinctive. The other two thirds called it 'a chat bubble.'",
    ],
    porchlight: [
      "Four console errors. That is not a website, that is a cry for help.",
      "No security headers. Volunteers, please also volunteer to guard the database.",
      "People love it. The browser console does not.",
    ],
    "shiftswap-chs": [
      "A shift swap app that fails on mobile. Where do you think servers check their shifts? A desk?",
      "This hero image loaded slower than my dial-up in 1998.",
      "Pinch, zoom, scroll sideways, cry. The full mobile experience.",
    ],
    "floodwatch-chs": [
      "...wait. Nobody say anything. This one's actually good.",
    ],
    generic: [
      "Is that Comic Sans or a cry for help?",
      "Four fonts. Four. Pick a lane.",
      "The contact form just leads to another contact form.",
      "This hero image loaded slower than my dial-up in 1998.",
    ],
  };

  const id = params.get("product") || document.body.dataset.productId || "generic";
  const lines = ROASTS[id] || ROASTS.generic;
  let next = 0;

  const style = document.createElement("style");
  style.textContent = `
    .roast-ui { position: fixed; top: 16px; right: 16px; z-index: 99999; width: min(340px, calc(100vw - 32px));
      font: 15px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: #25252B; }
    .roast-ui .roast-banner { background: #25252B; color: #FFFFFF; font-size: 12px; padding: 6px 10px;
      border-radius: 8px 8px 0 0; text-align: center; }
    .roast-ui .roast-body { background: #FFFFFF; border: 2px solid #25252B; border-top: 0;
      border-radius: 0 0 12px 12px; padding: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }
    .roast-ui button { font: inherit; font-weight: 700; background: #E92A97; color: #FFFFFF; border: 0;
      border-radius: 999px; padding: 10px 20px; cursor: pointer; }
    .roast-ui .roast-line { margin: 10px 0 0; font-size: 17px; font-weight: 600; min-height: 1.4em; }
    .roast-ui .roast-line:empty { display: none; }
  `;
  document.head.appendChild(style);

  const ui = document.createElement("div");
  ui.className = "roast-ui";
  ui.innerHTML = `
    <div class="roast-banner">Pitch demo. The roasts are ours, not the product's.</div>
    <div class="roast-body">
      <button type="button">Roast me</button>
      <p class="roast-line" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(ui);

  const line = ui.querySelector(".roast-line");
  ui.querySelector("button").addEventListener("click", () => {
    line.textContent = lines[next % lines.length];
    next += 1;
  });
})();
