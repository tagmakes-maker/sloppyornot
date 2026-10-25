# Judging questions

There are two sets. The AI set is answered only by the agent, from the submitted URL. The human set is answered only by the submitter, and only in lane two (see docs/scoring.md). The agent never drafts answers to the human set.

## AI set (agent only)

Scored 0 to 10 each in agent/prompts/judge.md.

| # | Question | Slop sounds like |
|---|---|---|
| A1 | Can a stranger tell what this does and who it is for from the first screen? | A hero line that could sit on any site. |
| A2 | Does it actually do the thing, or only promise it? | A landing page with a waitlist and no product. |
| A3 | Would you recognize it a week later, or does it look like a template? | Default gradients, stock icons, three identical feature cards. |
| A4 | Was the copy written by someone who cares? | Filler like "unlock the power of" and "seamless". |
| A5 | Can you reach the core action without hitting a dead end? | Broken links, lorem ipsum, buttons that go nowhere. |
| A6 | Do the claims match what is on the page? | "Trusted by thousands" on a project that is two days old. |

## Human set (submitter only)

Source: Olivia's team_question_set.xlsx, Oct 24. The "Get judged" flow asks these in lane two.

## Question set

| # | Question | Feeds criterion | What to listen for |
|---|---|---|---|
| 1 | Who did you talk to or learn from about this problem, and what surprised you? | Theory of change | Named people, partners, or data. A surprise that changed the plan. |
| 2 | If this works, what changes for one specific person? | Theory of change | A concrete person and outcome, not "an app for X". |
| 3 | What could go wrong, and who would be hurt first? | Harm awareness | Named risks (privacy, misuse, over-reliance) and some mitigation. |
| 4 | What already exists, and why wasn't it enough? Why this approach over a simpler one? | Necessity and novelty | Landscape awareness. A specific gap. Tech that earns its place. |
| 5 | What's the first thing that would break if 1,000 people used this? | Soundness | Honest limits. Architecture and backend thought through. |
| 6 | What did you cut or simplify, and why? | Soundness, Usability and craft | Deliberate tradeoffs rather than accidents. |
| 7 | What did you learn and take away from building this? | Growth (evidence of care) | See Growth answer cues below. |
| 8 | What would you tell the next team attempting this? | Growth (follow-up probe) | Harder to answer generically. Shows whether the lesson was absorbed. |

## Growth answer cues

| Signal | Strong answer sounds like | Thin answer sounds like |
|---|---|---|
| Specific over general | "We assumed users would upload a photo, then learned most interviewees only had shared phones." | "We learned a lot about APIs." |
| Something changed | A moment where the plan was wrong and they adjusted. | No failed assumptions. Nothing appears to have been tested. |
| Honest about gaps | Names what they would do differently or still don't understand. | Pure triumph with no friction (mild warning sign). |
| Learned about the problem, not just the tools | Insight about the people they are building for. Feeds the impact claim. | Only framework or tool learning (growth for the builder, weaker signal for impact). |

## Rule for the human set

The agent never drafts answers to the human set. Only the submitter answers it. The agent scores the answers with agent/prompts/score-answers.md, and the submitter never sees a number, only the final Sloppy or Not.
