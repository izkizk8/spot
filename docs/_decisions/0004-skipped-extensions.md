---
status: accepted
date: 2026-04-26
deciders: project owner
---

# 0004. Skipped Spec Kit extensions: ci-guard, speckit-utils

## Context

The user requested installing 19 Spec Kit community extensions in one batch (see chat 2026-04-26). Two failed and we chose not to work around them.

## Decision

| Extension | Why skipped |
|-----------|-------------|
| `ci-guard` | The extension's own validator rejects install: `Command 'speckit.ci.check' must use extension namespace 'ci-guard'`. Upstream bug — its command names don't follow Spec Kit's namespace rule. |
| `speckit-utils` | Provides `speckit.doctor`, which collides with the already-installed `doctor` extension (KhawarHabibKhan/spec-kit-doctor). Spec Kit refuses to install two extensions registering the same command. |

For `speckit-utils` we explicitly **kept `doctor`** because the standalone `doctor` extension is more focused (single command: `/speckit.doctor.check`) and matches the request that introduced it.

## Alternatives Considered

- **Patch `ci-guard` locally** — too much maintenance burden for an extension we don't urgently need; will revisit if upstream fixes the namespace bug.
- **Remove `doctor` and install `speckit-utils`** — `speckit-utils` bundles several commands but we want à-la-carte selection; loses the focused diagnostic.
- **Vendor both with renamed commands** — couples us to a fork.

## Consequences

- ✅ Clean installed catalog; the current source of truth is [sdd-extensions.md](../sdd-extensions.md)
- ⚠️ No CI guard for spec drift / spec-existence checks until upstream fix or a different extension fills the gap
- ⚠️ No `speckit-utils` resume / traceability commands; if needed, remove `doctor` first
- 🔁 Revisit `ci-guard` when upstream fixes [the namespace validation issue](https://github.com/Quratulain-bilal/spec-kit-ci-guard); revisit `speckit-utils` if its capabilities become essential

## References

- [docs/sdd-extensions.md](../sdd-extensions.md) — current installed catalog
- Install logs: 2026-04-26 batch install of 19 extensions (`specify extension add ... --from <zip>`)
