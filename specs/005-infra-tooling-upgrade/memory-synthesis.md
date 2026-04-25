# Feature Memory Synthesis: Infrastructure Tooling Upgrade

## Current Synthesis

- This feature is an infrastructure/configuration upgrade, so validation evidence and documentation are part of the deliverable.
- OXC adoption should be measured by actual coverage: use it for primary format/general lint, and retain official React Hooks ESLint rules as complementary source-of-truth Hooks validation.
- Unit test examples must be executable and copyable, covering TypeScript logic, React Native rendering, alias imports, and shared mocks/setup.
- The validated local gate is `pnpm check`: OXC format, OXC lint, official React Hooks ESLint rules, strict TypeScript, and Jest Expo unit examples.

## Reusable Lessons Candidate List

- Do not include remote EAS builds in local aggregate quality gates.
- Treat React Hooks lint failure fixtures as temporary validation artifacts unless a permanent fixture is intentionally documented.
- Prefer focused complementary checks when the user needs official tool coverage even though the primary tool has overlapping rules.
