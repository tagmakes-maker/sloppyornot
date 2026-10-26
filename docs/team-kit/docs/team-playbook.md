# Team playbook (reusable)

This is the setup that ran SloppyOrNot at HarborHack (Oct 2026). The files in this repo are its parts. Swap the names and folders. Keep the rules.

## Why it worked

1. Every person owns a lane (a folder). Nobody edits another lane without asking.
2. One shared contract file. Changing it needs everyone's yes.
3. Every ask comes with a recommendation, so people can answer with one word.
4. Claude sessions read the same rules as humans, so they stay in lane too.
5. A hook enforces the lanes. Rules nobody enforces get broken by Saturday night.

## Step 1: the folders

```
project/
├── site/          front end (designer's lane; code comes from whoever codes it)
├── worker/        backend, storage, deploys (backend dev's lane)
├── agent/         prompts, tools, evals (AI lead's lane)
├── docs/          words for humans: pitch, decisions, handoffs, team questions
├── seed/          demo data, must validate against the contract
├── shared/
│   └── contract.schema.json   the one file everyone builds against
├── agent-log/     append-only evidence of what the agent did
├── scripts/       hooks and demo scripts
├── tests/         a few tests of the core loop, not a big suite
└── .github/       PR template
```

## Step 2: the files in this repo

| File | What it does | What to change |
|---|---|---|
| `CLAUDE.md` | Rules every Claude session reads first: lanes, pronouns, the contract, what we are not building, the one thing we are proving | Names, lanes, the "one thing" line |
| `CONTRIBUTING.md` | "Where does this file go?" A numbered list. Answer the first question that applies and stop | Folder names and owners |
| `scripts/check-lanes.sh` + `scripts/install-hooks.sh` | Pre-commit hook that blocks files outside a lane, edits to agent-log, and secrets | The `LANES` line at the top |
| `.github/pull_request_template.md` | Every PR says which folder, why, whether it touches the contract, and whether the core loop still runs | The core loop steps |
| `docs/team-questions.md` | The asks board (format below) | Start empty |
| `docs/morning-handoff.md` | State of the world plus a paste-ready prompt for the next session | Rewrite every morning |
| `agent-log/README.md` | Defines the five entry types and the file naming | Nothing |

## Step 3: the asks board (docs/team-questions.md)

This is the part that made everyone talk. Copy this shape:

```
# Team questions (<date>)

Each question has a recommendation. Answer yes, or say what you want instead.

## <Person A>

1. **<Short problem name>.** <One or two sentences on what is wrong.> Recommendation: <the exact fix>.

## <Person B>

2. ...

## All of us

3. **<Anything touching the contract or the plan>.** ... Recommendation: ...

## Decided

<date>: <who> said yes to items 1 to N. Items X and Y are done. The rest are on GitHub issues for the owners.
```

Rules for it:
- Number every question across the whole file, so "yes to 4, no to 7" is a full answer.
- Bold the problem name. Keep the problem to two sentences.
- Never ask without a recommendation.
- Once a question is decided, move it to a GitHub issue assigned to its owner. The board holds open questions. Issues track the work.
- Start a new dated section each day instead of editing old answers.

## Step 4: the rhythm

- **Start of day:** write the morning handoff. Paste its prompt into a fresh Claude session.
- **When you need something from someone:** add it to the asks board, not just the chat.
- **When something touches the contract:** say it in the group chat and in the PR.
- **When the agent does something real:** add an agent-log entry. Never edit an old one.
- **Branches:** one per person (`name/`). Merge to main when it runs.

## Step 5: kickoff checklist (30 minutes)

- [ ] Name the lanes and owners. Write them into CLAUDE.md and CONTRIBUTING.md.
- [ ] Write the contract schema, even a rough one. Everyone builds against it.
- [ ] Copy the hook, update its folder list, and have everyone run `bash scripts/install-hooks.sh`.
- [ ] Copy the PR template and change the core loop line.
- [ ] Write the "one thing we are proving" line and the "not building" list.
- [ ] Open `docs/team-questions.md` with the first round of asks.
