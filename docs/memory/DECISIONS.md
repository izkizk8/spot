# Decisions

### 2026-04-25 - Specification-Driven Development with Spec Kit
**Status**
Active

**Why this is durable**
Every future feature uses the SDD lifecycle (specify → plan → tasks → implement). The choice of Spec Kit as the workflow engine, the constitution as a governance gate, and layered memory as institutional knowledge affects how all development work is structured.

**Decision**
Adopt Spec Kit 0.8.1 with the full SDD workflow. Features MUST follow the lifecycle: constitution check → specify → clarify → plan → tasks → implement. A constitution (v1.0.0) defines 5 non-negotiable principles. Durable memory in docs/memory/ captures cross-feature knowledge. Feature memory in specs/<feature>/ captures per-feature context.

**Tradeoffs**
Gained: structured, auditable feature development with AI agent assistance; institutional knowledge persists across features; constitution prevents principle drift. Made harder: rapid prototyping (must go through specify/plan/tasks before implementation); overhead for small fixes. Reconsider if: the team grows beyond solo development and needs a different review workflow, or if Spec Kit is abandoned upstream.

**Future mistake prevented**
Starting implementation without a spec, plan, or constitution check. Ad-hoc feature development that loses context between sessions.

**Evidence**
Feature 001-fix-speckit-concerns was the first feature delivered using the full SDD lifecycle (specify → clarify → plan → tasks → analyze → implement). All 5 original concerns were resolved through this workflow.

**Where to look next**
`.specify/memory/constitution.md` for active principles. `.specify/extensions.yml` for hook configuration. `docs/memory/` for durable project knowledge. `specs/` for active and archived feature specs.
