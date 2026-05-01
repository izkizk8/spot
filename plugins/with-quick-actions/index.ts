/**
 * Config plugin: with-quick-actions
 *
 * Adds `UIApplicationShortcutItems` to Info.plist from the project-owned
 * `DEFAULT_QUICK_ACTIONS` array. Idempotent — keys on
 * `UIApplicationShortcutItemType` so a second pass adds nothing new.
 *
 * Feature: 039-quick-actions
 * @see specs/039-quick-actions/research.md §Decision 2
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
import { DEFAULT_QUICK_ACTIONS } from '../../src/modules/quick-actions-lab/default-actions.ts';

interface ShortcutItem {
  UIApplicationShortcutItemType: string;
  UIApplicationShortcutItemTitle: string;
  UIApplicationShortcutItemSubtitle?: string;
  UIApplicationShortcutItemIconType: 'systemImageName';
  UIApplicationShortcutItemIconFile?: string;
  UIApplicationShortcutItemUserInfo: Record<string, unknown>;
  [key: string]: unknown;
}

function toShortcutItem(def: (typeof DEFAULT_QUICK_ACTIONS)[number]): ShortcutItem {
  const item: ShortcutItem = {
    UIApplicationShortcutItemType: def.type,
    UIApplicationShortcutItemTitle: def.title,
    UIApplicationShortcutItemIconType: 'systemImageName',
    UIApplicationShortcutItemIconFile: def.iconName,
    UIApplicationShortcutItemUserInfo: { ...def.userInfo },
  };
  if (def.subtitle) {
    item.UIApplicationShortcutItemSubtitle = def.subtitle;
  }
  return item;
}

const withQuickActions: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    const existing =
      (cfg.modResults.UIApplicationShortcutItems as ShortcutItem[] | undefined) ?? [];
    const have = new Set(existing.map((i) => i.UIApplicationShortcutItemType));
    const additions = DEFAULT_QUICK_ACTIONS.filter((d) => !have.has(d.type)).map(toShortcutItem);
    cfg.modResults.UIApplicationShortcutItems = [...existing, ...additions] as unknown as never;
    return cfg;
  });
};

export default withQuickActions;
