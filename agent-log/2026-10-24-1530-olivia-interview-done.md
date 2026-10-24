# 2026-10-24 15:30: Olivia finished the interview, profile drafted

- type: observation
- actor: agent, directed by Therese
- files: experts-worker/public/interview.html, experts-worker/public/review.html, experts-worker/src/index.js

## What happened

Olivia answered all eight interview questions and their follow-ups, 22 answers in total, between 12:30 and 2:32 PM. The worker drafted her Expert Reasoning Profile 38 seconds after her last answer. The draft has 15 decision rules, 10 red flags, 3 limitations, and 6 domains. None of it says PLACEHOLDER, so it can be approved.

Her answers name signals the crowd review also uses: robotic copy, em dashes, no human touch, and AI features that make a simple flow more complex.

## What went wrong

The page kept asking Olivia for the admin token, so her edits to the draft did not save. The token was typed on a phone, where autocapitalize and stray spaces break an exact match.

## What changed

A texted link with ?key= now stores the token and removes it from the address bar, so Olivia never types it. The token survives new tabs, and spaces are trimmed on the page and in the worker. A wrong token still gets a 401. The experts worker now deploys from main through Workers Builds.

## The activation step

Olivia opens the link, edits the draft until it sounds like her, and presses Approve. The profile stays inactive until then.
