---
status: accepted
date: 2026-04-26
deciders: project owner
---

# 0001. Agent-first stack: Spec Kit core + extensions + plugin accelerators

## Context

We need an AI-assisted development workflow that's structured (not vibe-coding), enforces engineering discipline (TDD, root-cause debugging), and scales to multi-file changes. Several alternatives exist (APM, raw Copilot, Cursor rules, custom agents).

## Decision

Adopt a layered agent stack with Spec Kit as the traceability core:

| Layer | Tool | Role |
|-------|------|------|
| Lifecycle core | **GitHub Spec Kit** | Specify -> clarify -> plan -> tasks -> analyze -> implement -> verify/archive |
| Capability layer | **Spec Kit extensions** | Repo indexing, validation, review, cleanup, bugfix, orchestration, checkpointing, status |
| Engineering discipline | **obra/superpowers** | 14 auto-invoked skills (TDD, debugging, code review, brainstorming, verification) |
| Multi-file planning | **`@context-architect`** (awesome-copilot) | Maps file impact + dependency graph before edits |
| Multi-agent orchestration | **`@rug` → `@SWE` + `@QA`** (awesome-copilot) | Decompose, delegate, validate |

Spec Kit owns the durable artifact spine: specs, plans, tasks, memory, generated docs, and lifecycle phase order. Spec Kit extensions add capabilities around that spine. Superpowers enforces engineering discipline inside a phase. Context-architect prepares the surface area for multi-file changes. RUG orchestrates large work through implementation and QA agents.

## Alternatives Considered

- **APM (Agentic Project Management)** — evaluated and removed: couldn't fully deploy Superpowers for Copilot CLI.
- **Raw Copilot CLI without Spec Kit** — no spec/plan/tasks artifacts; loses traceability and constitution gating.
- **Cursor rules / single-file prompts** — doesn't scale beyond simple edits; no lifecycle hooks.
- **One unified custom agent** — too brittle; loses the community-maintained skill library.

## Consequences

- ✅ Each lifecycle phase has a dedicated command + auto-fired hooks (git, memory, TDD gate, verify gate)
- ✅ Extensions can be added/removed without redefining the lifecycle core
- ✅ Skills are community-maintained — we benefit from upstream improvements
- ✅ Multi-feature parallel work is supported (orchestrator extension)
- ⚠️ Onboarding cost: contributors must learn `/speckit.*` commands and the SDD philosophy
- ⚠️ Stack depth: 4 layers means more moving parts — diagnose with `/speckit.doctor.check` and `/speckit.superb.check`
- 🔁 Revisit if: Spec Kit is abandoned upstream, Superpowers fragments, or a single unified tool emerges

## References

- [docs/speckit_profile.md](../speckit_profile.md) — full command + hook reference
- [docs/sdd-extensions.md](../sdd-extensions.md) — installed extensions catalog
- Spec Kit: <https://github.com/github/spec-kit>
- Superpowers: <https://github.com/obra/superpowers>
