---
description: Run the security-auditor agent (writes docs/reviews/security.md)
argument-hint: "[optional scope: feature, folder or files]"
---

Use the Agent tool with `subagent_type: "security-auditor"` to run a defensive security audit.

Scope: $ARGUMENTS
(If the scope is empty, audit every entry point: all `app/api/**/route.ts` files, the server actions, `middleware.ts` and the auth configuration.)

When the agent finishes, give me:
- the number of findings per severity
- every Critical or High finding, one line each
- the path to the report, `docs/reviews/security.md`
