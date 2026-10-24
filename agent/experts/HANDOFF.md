# Think Like Olivia: handoff for Jacky and Olivia

OPTIONAL. Cut first if Sunday runs long. Nothing in worker/ or site/ has to change for the demo.

## What it is

A second, standalone Cloudflare Worker in experts-worker/ (Therese's lane). It has its own KV namespace and serves its own two pages. It never writes to worker/ storage, and crowd review scores and Verified Build scores are untouched. Expert review is a separate layer.

## Base URL

https://sloppyornot-experts.tagmakes.workers.dev. It deploys automatically from main through Workers Builds, root directory experts-worker.

- Interview: /experts/olivia/interview
- Review and verdicts: /experts/olivia/review
- Judging view, comparison only: /experts/olivia/review?product=floodwatch-chs

## Status

- Interview: done Oct 24.
- Profile: approved by Olivia Oct 24, 4:39 PM, version 1. Stored in the experts KV under profile:olivia.
- Next: one review and her verdicts on every suggestion.

## For Olivia

1. Open the link Therese texts you. It looks like /experts/olivia/interview?key=... and unlocks the page, so you never type the admin token. The interview takes 10 to 15 minutes and saves after every answer. Done on Oct 24.
2. Press "Draft my profile". Read every rule. Fix the wording until it sounds like you, then press Save.
3. Press Approve. Nothing uses your profile before this step. A profile that still says PLACEHOLDER cannot be approved.
4. Open /experts/olivia/review, load the demo product, and run the review. Accept, reject, or modify every suggestion and say why. Your verdict sits beside the AI suggestion and never replaces it.
5. If you want the comparison inside the judging view, either link to the judging URL above or call the endpoint below. The cards in review.html are plain HTML and CSS you can copy.

Branding is provisional: hot pink #E92A97, charcoal #25252B, blush #FFE5F2, white #FFFFFF, in experts-worker/public/styles.css. Swap in your real tokens there.

## The comparison endpoint (for the judging panel)

GET /api/comparison/olivia/:product_id. Public, CORS open, no token. Returns:

```json
{
  "title": "Think Like Olivia: Human Expertise vs. AI",
  "expert_id": "olivia",
  "expert_name": "Olivia Dennehy",
  "product_id": "floodwatch-chs",
  "product_name": "FloodWatch CHS",
  "product_is_seed": true,
  "profile_version": 1,
  "mode": "claude",
  "reviewed_at": "2026-10-25T14:00:00.000Z",
  "disclaimer": "This is a model of one expert's stated rules, not the expert. Humans decide.",
  "counts": { "total": 3, "accepted": 1, "rejected": 1, "modified": 1, "pending": 0 },
  "items": [
    {
      "suggestion": {
        "id": "s1",
        "principle_id": "first-look",
        "principle": "A new user should understand what the product does from the first screen without help.",
        "suggestion": "Explain the colored pins on the first screen. Only 30 percent of reviewers understood the product on first look.",
        "evidence": "human_review.understood_immediately",
        "confidence": 0.85
      },
      "verdict": "modify",
      "correction": "Add a three-item legend and a one-line headline above the map.",
      "rationale": "A legend alone is not enough. People need to know what the app is for first.",
      "decided_by": "Olivia",
      "decided_at": "2026-10-25T14:05:00.000Z",
      "reasoning_gap": "The AI said \"Explain the colored pins...\", and Olivia corrected it to \"Add a three-item legend...\" because a legend alone is not enough.",
      "status": "modified"
    }
  ]
}
```

status is pending, accepted, rejected, or modified. reasoning_gap is one sentence when the verdict is modify or reject, and null otherwise. The example values above are illustrative. Show the disclaimer wherever the panel appears. Never label the AI column as Olivia.

## For Jacky: the optional CORE_API_URL contract

Not needed for the demo. The review page accepts a pasted Product Profile, and the demo product is built in.

If you want POST /api/review to accept { expert_id, product_id } instead, set CORE_API_URL in experts-worker/wrangler.toml to your worker's base URL. This worker then calls GET {CORE_API_URL}/products/:id and expects a Product Profile that matches shared/profile.schema.json, either bare or wrapped as { "product": { ... } }. Your README lists GET /products/:id, so the base URL alone works. If you mount routes under /api, set CORE_API_URL to the base plus /api.

## Schemas

- agent/experts/expert-profile.schema.json: Expert Reasoning Profile.
- agent/experts/validation.schema.json: the verdict.

Both are proposed for shared/ once all three of us agree. Until then only experts-worker/ reads them.
