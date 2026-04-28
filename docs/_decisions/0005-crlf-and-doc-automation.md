---
status: accepted
date: 2026-04-28
deciders: project owner
---

# 0005. CRLF line endings and automated documentation gate

## Context

This workspace is developed primarily on Windows. Git repeatedly warned that tracked files would be normalized from LF to CRLF when touched. The documentation system also had strong rules, but some checks were manual: generated profile boundaries, registry-derived reference consistency, local Markdown links, stale path references, JSON index validity, and line-ending consistency.

## Decision

Use CRLF as the repository working-tree line-ending policy and add an automated documentation gate.

- `.gitattributes` sets text files to `eol=crlf` while preserving binary assets.
- `.editorconfig` sets `end_of_line = crlf` for editor behavior.
- `.oxfmtrc.json` sets `endOfLine` to `crlf` for formatted source files.
- `scripts/check-docs.ps1` validates CRLF for tracked/new text files, generated profile boundaries, registry-derived references, JSON indexes, local Markdown links, and stale documentation references.
- `package.json` exposes `pnpm docs:check` and includes it in `pnpm check`.

## Alternatives Considered

- **Leave Git warnings alone** — rejected because every touched file kept surfacing noisy line-ending churn.
- **Use LF everywhere** — common for cross-platform repositories, but it conflicts with the owner's requested Windows-first working-tree policy.
- **Only rely on PR checklist reminders** — useful but insufficient; the project wants automation to catch drift before review.

## Consequences

- ✅ The local quality gate now verifies doc-system health instead of relying only on memory rules and checklist text.
- ✅ The line-ending policy is explicit across Git, editors, and formatter settings.
- ✅ Generated docs and registry-derived references remain bounded to explicit lists in `docs/README.md`.
- ⚠️ Shell scripts checked out with CRLF can be less portable in Unix-only environments. Revisit if Linux/macOS shell execution becomes a first-class workflow.
- 🔁 Revisit if the team moves to a non-Windows primary development environment or CI requires LF-only scripts.

## References

- [docs/README.md](../README.md) — documentation map and automation gate
- [tooling_profile.md](../tooling_profile.md) — generated tooling reference
- [scripts/check-docs.ps1](../../scripts/check-docs.ps1) — local doc-system checker