/**
 * Default Quick Actions — single source of truth for the 4 static
 * shortcuts shipped via Info.plist by `plugins/with-quick-actions/` and
 * rendered by `StaticActionsList`.
 *
 * Feature: 039-quick-actions
 * @see specs/039-quick-actions/data-model.md §1
 */

export interface QuickActionDefinition {
  /**
   * Stable identifier. Lowercase kebab-case; non-empty.
   */
  type: string;

  /** User-visible row title (≤ 32 chars recommended). */
  title: string;

  /** Optional second line in the menu. */
  subtitle?: string;

  /** SF Symbol system name (e.g. 'drop.fill', 'gauge'). */
  iconName: string;

  /**
   * Carried through to invocation. `route` is required; the routing
   * layer dispatches to it via expo-router.
   */
  userInfo: {
    route: string;
    [key: string]: unknown;
  };
}

export const DEFAULT_QUICK_ACTIONS: readonly QuickActionDefinition[] = [
  {
    type: 'open-liquid-glass',
    title: 'Open Liquid Glass',
    subtitle: 'Material playground',
    iconName: 'drop.fill',
    userInfo: { route: '/modules/liquid-glass-playground' },
  },
  {
    type: 'open-sensors',
    title: 'Open Sensors',
    subtitle: 'Motion & device data',
    iconName: 'gauge',
    userInfo: { route: '/modules/sensors-playground' },
  },
  {
    type: 'open-audio-lab',
    title: 'Open Audio Lab',
    subtitle: 'Recording demo',
    iconName: 'mic.fill',
    userInfo: { route: '/modules/audio-lab' },
  },
  {
    type: 'add-mood-happy',
    title: 'Add Mood: Happy',
    subtitle: 'Quick journal entry',
    iconName: 'face.smiling',
    userInfo: { route: '/modules/app-intents-lab', mood: 'happy' },
  },
] as const;
