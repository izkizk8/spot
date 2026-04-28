---
status: accepted
date: 2026-04-26
deciders: project owner
---

# 0002. Toolchain: pnpm hoisted + OXC + ESLint Hooks + Jest Expo

## Context

Need a fast, modern toolchain for an Expo SDK 55 / RN 0.83 / React 19 / TypeScript 5.9 strict project, with rules-of-hooks coverage matching React Compiler-era checks, and a test runner compatible with Expo's preset.

## Decision

| Dimension | Choice |
|-----------|--------|
| Package manager | **pnpm** with `nodeLinker: hoisted` (Expo compatibility) |
| Format | **`oxfmt@0.46.0`** (OXC) |
| General lint | **`oxlint@1.61.0`** (OXC) |
| React Hooks lint | **`eslint-plugin-react-hooks@7.1.1`** with `eslint@10.2.1` + `typescript-eslint@8.59.0` (kept alongside OXC) |
| Typecheck | `tsc --noEmit` strict |
| Test runner | **Jest 29.7.0** + `jest-expo@55.0.16` + `@testing-library/react-native` |

Aggregated via `pnpm check` = format:check + lint + docs:check + typecheck + test.

Documentation automation and CRLF policy are covered by ADR [0005](0005-crlf-and-doc-automation.md).

## Alternatives Considered

- **OXC alone for hooks lint** — `oxlint@1.61.0` covers classic `rules-of-hooks` + `exhaustive-deps`, but **not** the React Compiler-era checks (`set-state-in-effect`, `static-components`, `immutability`, `refs`, `purity`, `use-memo`). React 19 + React Compiler enabled in this repo, so we need them.
- **Biome** — younger ecosystem, weaker Hooks coverage at evaluation time.
- **Expo lint (`npx expo lint`)** — prompts to install/configure ESLint and exits with `CommandError: ESLint is not configured for this project` when declined; superseded by direct ESLint config focused on hooks.
- **Jest 30** — `jest-expo@55.0.16` peer-depends on Jest 27–29; Jest 30 failed baseline runtime validation.
- **Vitest / Bun test** — incompatible with `jest-expo` preset and RN test infra at evaluation time.
- **Yarn / npm** — Expo needs hoisted node_modules; pnpm hoisted gives that without losing pnpm's perf.

## Consequences

- ✅ Fast format/lint via OXC (Rust)
- ✅ Authoritative React Hooks coverage including React Compiler checks
- ✅ Single `pnpm check` gate before commit
- ⚠️ Two lint engines (OXC + ESLint Hooks) — slightly more config to maintain; mitigated by `pnpm lint` aggregating both
- ⚠️ Pinned to Jest 29 until `jest-expo` accepts a newer peer range
- 🔁 Revisit OXC-only when its Hooks rules cover React Compiler-era checks; revisit Jest 30 when `jest-expo` peer range expands

## References

- `package.json` scripts + `oxlint.json`, `.oxfmtrc.json`, `eslint.config.js`, `jest.config.js` — current configuration source of truth
- [tooling_profile.md](../tooling_profile.md) — generated reference; refresh with `/speckit.repoindex.module "tooling"`
