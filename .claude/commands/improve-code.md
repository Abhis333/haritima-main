---
description: Run the code-improver agent to fix findings from the review reports
argument-hint: "[optional: finding IDs like SEC-1 CQ-3, or a severity like High]"
---

First check that `docs/reviews/code-quality.md` and `docs/reviews/security.md` exist. If both are missing, tell me to run `/review-quality` and `/security-check` first, and stop.

Otherwise, use the Agent tool with `subagent_type: "code-improver"`.

Findings to handle: $ARGUMENTS
(If this is empty, handle all findings in the agent's default priority order.)

When the agent finishes, give me:
- the IDs that were fixed, with the files changed
- the IDs that were not fixed, and why
- the "Needs approval" items
- the typecheck and lint results
