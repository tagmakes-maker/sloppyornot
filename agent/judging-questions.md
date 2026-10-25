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

Source: Olivia's Figma (the 9 Questions section and the Agent screen), Oct 25. It replaces her Oct 24 team_question_set.xlsx. The "Get judged" flow asks these in lane two.

## Question set

| # | Question | Feeds criterion | What to listen for |
|---|---|---|---|
| 1 | Who is this for, and what problem are they facing? | Theory of change | A specific person and a real problem, not "everyone". |
| 2 | If this works perfectly, what changes for them? | Theory of change | A concrete outcome for that person, not "an app for X". |
| 3 | Who could this hurt or leave out, and what did you do about it? | Harm awareness | Named risks and people left out, and what was done about them. |
| 4 | Does the way it looks and sounds fit the people it's for? | Merit (usability and craft) | Design and tone chosen for the audience, not a default template. |
| 5 | What already exists in this space, and why isn't it enough? | Necessity and novelty | Knowing the landscape. A specific gap. |
| 6 | What's the one thing here you haven't seen done before? | Necessity and novelty | A fresh angle, even a small one, named plainly. |
| 7 | Who did you test it with, what did they say, and what did you change? | Merit, Growth | Real people, real feedback, and a change it caused. |
| 8 | Where did you use AI, and where did you step in and overrule it? | Merit (judicious use of AI) | AI used with judgment, and a moment the builder overruled it. |
| 9 | What did you learn and take away from building this? | Growth (evidence of care) | See Growth answer cues below. |

## Growth answer cues

| Signal | Strong answer sounds like | Thin answer sounds like |
|---|---|---|
| Specific over general | "We assumed users would upload a photo, then learned most interviewees only had shared phones." | "We learned a lot about APIs." |
| Something changed | A moment where the plan was wrong and they adjusted. | No failed assumptions. Nothing appears to have been tested. |
| Honest about gaps | Names what they would do differently or still don't understand. | Pure triumph with no friction (mild warning sign). |
| Learned about the problem, not just the tools | Insight about the people they are building for. Feeds the impact claim. | Only framework or tool learning (growth for the builder, weaker signal for impact). |

## Rule for the human set

The agent never drafts answers to the human set. Only the submitter answers it. The agent scores the answers with agent/prompts/score-answers.md, and the submitter never sees a number, only the final Sloppy or Not.
