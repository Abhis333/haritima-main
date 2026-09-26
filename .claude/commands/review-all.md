---
description: Full pipeline — quality review + security audit in parallel, then ask before running the code-improver
argument-hint: "[optional scope]"
---

Scope: $ARGUMENTS (if empty, the whole project)

1. In a single message, launch both agents in parallel with the Agent tool:
   - `subagent_type: "code-quality-reviewer"` with the scope above
   - `subagent_type: "security-auditor"` with the scope above
2. When both have finished, show me a combined summary: findings per severity from each report, and all Critical and High items.
3. Ask me whether to run the `code-improver` agent on all findings or only on selected IDs. Don't start it until I answer.
