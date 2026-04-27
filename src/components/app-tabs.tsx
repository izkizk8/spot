import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Logical tab ids in display order. Mirrored exactly in `app-tabs.web.tsx`
 * — equality is mechanically enforced by `test/unit/shell/tab-parity.test.ts`
 * (FR-026). When you change this list, change it in the web file too.
 */
export const TAB_IDS = ['index', 'explore', 'modules', 'settings'] as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || scheme == null ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="modules">
        <NativeTabs.Trigger.Label>Modules</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
