# Spot — Agent-First Development Guide

## Overview

Spot is an iOS creative app built with Expo SDK 55, developed using an agent-first workflow. This document explains the tooling, development process, and how everything fits together.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Install AI agent plugins (one-time per machine)
copilot plugin install obra/superpowers

# 3. Start developing
npx expo start --ios
```

## Tool Stack

### Copilot CLI Plugins (user-level, `~/.copilot/installed-plugins/`)

| Plugin | Purpose | Install |
|--------|---------|---------|
| **superpowers** | 14 engineering methodology skills (TDD, debugging, code review, brainstorming) | `copilot plugin install obra/superpowers` |
| **context-engineering** | Multi-file change context planning | pre-installed with awesome-copilot |
| **rug-agentic-workflow** | Three-agent orchestrated delivery | pre-installed with awesome-copilot |

### Spec Kit Extensions (project-level, `.specify/extensions/`)

| Extension | Purpose |
|-----------|---------|
| **git** | Auto feature branches + commits at each SDD phase |
| **memory-loader** | Auto-loads `.specify/memory/` files before every speckit command |
| **memory-md** | Structured read/write/search of project memory |
| **repoindex** | Generates architecture overview + module index from codebase |
| **archive** | Archives completed features into project memory |
| **retrospective** | Post-implementation spec adherence analysis |
| **status** | Shows current SDD workflow progress |

### Skills (project-level, `.agents/skills/`)

| Skill | Source | Purpose |
|-------|--------|---------|
| **doc-coauthoring** | anthropics/skills | Structured documentation co-authoring workflow |

## Development Workflow

### Spec-Driven Development (SDD)

Every feature follows this flow:

```
/speckit.constitution  →  Project principles (one-time)
        ↓
/speckit.specify       →  Feature specification (what & why)
        ↓
/speckit.clarify       →  [optional] Clarify ambiguities
        ↓
/speckit.plan          →  Technical implementation plan
        ↓
/speckit.analyze       →  [optional] Cross-artifact consistency check
        ↓
/speckit.tasks         →  Actionable task list
        ↓
/speckit.implement     →  Execute tasks (superpowers enforces TDD here)
```

#### How it works under the hood

1. You type `/speckit.specify Build iOS Spotlight search`
2. Copilot CLI finds `.github/prompts/speckit.specify.prompt.md` → points to `.github/agents/speckit.specify.agent.md`
3. The agent file (200+ lines of instructions) tells AI to:
   - Create `specs/NNN-feature-name/` directory
   - Use `.specify/templates/spec-template.md` as scaffold
   - Fill in user stories, requirements, success criteria
4. Before/after hooks in `.specify/extensions.yml` fire (e.g., create git branch, auto-commit)

#### SDD file outputs

```
specs/
└── 001-spotlight-search/
    ├── spec.md          ← Feature specification
    ├── plan.md          ← Technical plan
    ├── tasks.md         ← Task breakdown
    └── checklists/      ← Quality validation
```

### Superpowers (Engineering Methodology)

Superpowers is a Copilot CLI plugin that enforces engineering best practices. It's **not invoked manually** — the agent automatically triggers relevant skills.

#### How it works

1. On session start, the plugin's `session-start` hook injects `using-superpowers` into agent context
2. This skill teaches the agent the "1% Rule": if there's even a 1% chance a skill applies, invoke it
3. During `/speckit.implement`, the agent automatically:
   - Uses **TDD**: write test → see it fail → write code → see it pass
   - Uses **systematic-debugging**: no guessing, systematic root cause analysis
   - Uses **verification-before-completion**: check all requirements before claiming done

#### The 14 skills

| Category | Skills |
|----------|--------|
| **Process** | brainstorming, writing-plans, executing-plans, test-driven-development, systematic-debugging, verification-before-completion, finishing-a-development-branch |
| **Collaboration** | dispatching-parallel-agents, subagent-driven-development, requesting-code-review, receiving-code-review, using-git-worktrees |
| **Meta** | using-superpowers, writing-skills |

### How Spec Kit + Superpowers Work Together

```
Spec Kit = WHAT to build (documents)      Superpowers = HOW to build (discipline)

Steps 1-4 (specify → tasks): Spec Kit produces markdown artifacts
Step 5 (implement): Spec Kit provides task list, Superpowers enforces TDD + verification
```

## Project Memory

| Layer | Location | Loaded when | Purpose |
|-------|----------|-------------|---------|
| **Copilot instructions** | `.github/copilot-instructions.md` | Every session | Architecture, conventions |
| **Spec Kit memory** | `.specify/memory/*.md` | Every `/speckit.*` command | Constitution, decisions, learnings |
| **Session store** | `~/.copilot/session-store.db` | On query | Full history of all past sessions |

## Architecture

- **Expo SDK 55** + expo-router (file-based routing, typed routes)
- **React Compiler** enabled
- **Platform variants**: `.web.tsx` suffix for web-specific code
- **Dual tab navigation**: NativeTabs (iOS/Android) + custom TabBar (web) — update both when adding tabs
- **Theming**: `ThemedText`/`ThemedView` wrappers + `useTheme()` hook + `Spacing` scale
- **Styling**: `StyleSheet.create()` only — no CSS-in-JS
- **Path aliases**: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`

## CLI Cheat Sheet

```bash
# SDD workflow
/speckit.constitution    # Set project principles (one-time)
/speckit.specify <desc>  # Create feature spec
/speckit.plan            # Technical plan
/speckit.tasks           # Task breakdown
/speckit.implement       # Build it

# Spec Kit extensions
/speckit.status          # Show SDD progress
/speckit.repoindex       # Generate architecture docs
/speckit.memory-md       # Read/write project memory
/speckit.archive         # Archive completed feature
/speckit.retrospective   # Post-implementation review

# Extension management
specify extension list   # List installed extensions
specify extension search # Browse 79+ available

# Plugin management
copilot plugin list                                    # List installed
copilot plugin marketplace browse awesome-copilot      # Browse
copilot plugin install <name>@<marketplace>            # Install

# Skills management
npx skills add <owner/repo> --skill <name>  # Install skill to project
npx skills find <query>                     # Search skills.sh
```

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| AI config management | Copilot native plugins + Spec Kit extensions | APM evaluated → removed (couldn't fully deploy superpowers for Copilot CLI) |
| SDD framework | GitHub Spec Kit (★90K) | GitHub official, 30+ agent integrations, 70+ extensions |
| Engineering methodology | obra/superpowers (★160K) | Cross-platform, TDD-driven, most mature |
| Package manager | pnpm | `nodeLinker: hoisted` for Expo compatibility |
