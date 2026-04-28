/**
 * ConfigPanel — re-export of 014's ConfigPanel (default path per research §5).
 *
 * 027 reuses 014's three-control panel (showcase, counter, tint) verbatim.
 * The panel accepts `LockConfig` which has the same shape as `WidgetConfig`.
 *
 * FALLBACK (R-C): if circular type dep surfaces, replace with local copy;
 * see research §5 / R-C.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T026, T031
 * @see specs/027-lock-screen-widgets/research.md §5
 */

export { ConfigPanel, type ConfigPanelProps } from '@/modules/widgets-lab/components/ConfigPanel';
export { ConfigPanel as default } from '@/modules/widgets-lab/components/ConfigPanel';
