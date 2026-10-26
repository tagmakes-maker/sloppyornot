# Where does this file go?

Answer the first question that applies. Stop there.

1. **Is it the contract shape, or a change to it?**
   `shared/contract.schema.json`. Do not edit alone. Say it in the group chat first.

2. **Does a browser load it directly (HTML, CSS, images, client-side JS)?**
   `site/`. {{DESIGN_OWNER}}'s lane.

3. **Is it a prompt, a tool definition, a rule the agent follows, or an eval scenario?**
   `agent/`. {{AI_LEAD}}'s lane.

4. **Does it run on the server, talk to the database, or store state?**
   `worker/`. {{BACKEND_OWNER}}'s lane.

5. **Is it fake data for the demo?**
   `seed/`. Must validate against the contract.

6. **Is it a record of something the agent did?**
   `agent-log/YYYY-MM-DD-HHMM-<what>.md`. Append only. Never edit a past entry.

7. **Is it words for humans (pitch, decision, handoff, question for a teammate)?**
   `docs/`.

8. **Is it a test of the core loop?**
   `tests/`.

9. **None of the above?**
   Ask in the group chat before committing. Do not create a new top-level folder.

## Rules

- Commit small and often. One branch prefix per person. Merge to `main` when it runs.
- No secrets in the repo. `.env` is gitignored.
- Every PR says which folder it touches and why (the template asks).
- The pre-commit hook blocks files outside their lane. Run `bash scripts/install-hooks.sh` once after cloning.
- No em dashes in any copy. Complete sentences.
