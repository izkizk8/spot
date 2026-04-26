# Architecture Decision Records (ADRs)

Persistent record of "why we chose X over Y". Anything that's a judgement call belongs here, not in generated profiles.

## When to add an ADR

Open a new ADR whenever the PR involves:

- Picking a tool / library / framework over alternatives
- Diverging from a default convention
- Accepting a tradeoff (perf vs simplicity, cost vs convenience, etc.)
- Reversing or superseding an earlier decision

## How

1. Copy `_template.md` to `NNNN-short-slug.md` (next sequential number, zero-padded to 4)
2. Fill it in (keep it short — 1 page)
3. Set `status: accepted` (or `proposed` if seeking review)
4. To retire: set old ADR's `status: superseded by NNNN`, write the new one

## Index

<!-- Sorted by number. Update on add. -->

| # | Title | Status |
|---|-------|--------|
| [0001](0001-agent-first-stack.md) | Agent-first stack: Spec Kit + Superpowers + Context Engineering + RUG | accepted |
| [0002](0002-toolchain.md) | Toolchain: pnpm hoisted + OXC + ESLint Hooks + Jest Expo | accepted |
| [0003](0003-unsigned-ipa-custom-build.md) | Use a custom EAS build YAML for unsigned iOS IPA (free sideload) | accepted |
| [0004](0004-skipped-extensions.md) | Skipped Spec Kit extensions: ci-guard, speckit-utils | accepted |
