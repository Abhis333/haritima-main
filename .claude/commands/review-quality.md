---
description: Run the code-quality-reviewer agent (writes docs/reviews/code-quality.md)
argument-hint: "[optional scope: feature, folder or files]"
---

Use the Agent tool with `subagent_type: "code-quality-reviewer"` to review code quality.

Scope: $ARGUMENTS
(If the scope is empty, review the whole project feature by feature, following the Feature map in CLAUDE.md.)

When the agent finishes, give me:
- the number of findings per severity
- the top 3 findings, one line each
- the path to the report, `docs/reviews/code-quality.md`
