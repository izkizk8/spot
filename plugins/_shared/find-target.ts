/**
 * Shared helper: locate a PBXNativeTarget by its display name.
 *
 * Why this exists:
 *   The xcode npm package's `pbxTargetByName(name)` matches against the value
 *   stored in PBXNativeTarget._comment, which itself is set from the target's
 *   `name` field. When a target is **parsed** from disk, `name` is unquoted
 *   (e.g. `MainApp`); when a target is **added programmatically** via
 *   `addTarget`, `name` is wrapped in literal quotes (e.g. `"MainApp"`).
 *   `pbxTargetByName` does an `==` check and so can't match across both forms,
 *   meaning a freshly-added target is invisible to subsequent plugins in the
 *   same prebuild run.
 *
 *   This helper walks the PBXNativeTarget section directly and trims surrounding
 *   double quotes before comparing, so both parsed and freshly-added targets are
 *   findable.
 */

export interface FoundTarget {
  uuid: string;
  target: { name?: string; productType?: string; [key: string]: unknown };
}

interface XcodeProjectLike {
  pbxNativeTargetSection?: () => Record<string, unknown>;
  hash?: { project?: { objects?: Record<string, unknown> } };
}

export function findTargetByName(
  project: XcodeProjectLike,
  targetName: string,
): FoundTarget | null {
  const section =
    (project.pbxNativeTargetSection?.() as Record<string, unknown> | undefined) ??
    (project.hash?.project?.objects?.['PBXNativeTarget'] as
      | Record<string, unknown>
      | undefined) ??
    {};

  for (const [key, value] of Object.entries(section)) {
    if (key.endsWith('_comment')) continue;
    if (!value || typeof value !== 'object') continue;
    const entry = value as { name?: string };
    const raw = entry.name ?? '';
    const trimmed = raw.replace(/^"(.*)"$/, '$1');
    if (trimmed === targetName) {
      return { uuid: key, target: entry as FoundTarget['target'] };
    }
  }

  // Fallback: ask the xcode npm package's built-in lookup. This catches
  // parsed-from-disk targets when the section walk above didn't find a match
  // (e.g. when `pbxNativeTargetSection` is patched in a unit test stub but
  // the underlying section is not exposed). The built-in lookup compares
  // commentKey values, which for parsed targets are unquoted, so it will
  // succeed there too.
  const fromBuiltin = (
    project as { pbxTargetByName?: (name: string) => { uuid?: string } | null | undefined }
  ).pbxTargetByName?.(targetName);
  if (fromBuiltin && typeof fromBuiltin === 'object') {
    return {
      uuid: (fromBuiltin as { uuid?: string }).uuid ?? '',
      target: fromBuiltin as FoundTarget['target'],
    };
  }
  return null;
}
