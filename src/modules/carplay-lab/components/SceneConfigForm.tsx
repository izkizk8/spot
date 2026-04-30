/**
 * SceneConfigForm — CarPlay Lab (feature 045).
 *
 * Read-only form that displays the UISceneConfiguration entry a
 * developer would author for the CarPlay scene role. The values are
 * derived from props so a parent screen can wire them to the
 * picked category / template; the form itself never mutates.
 *
 * Why "form" if read-only? The intent is that a future iteration —
 * once Apple has issued the entitlement — flips the rows to
 * editable. The shape stays stable.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CARPLAY_SCENE_ROLE, type CarPlaySceneConfiguration } from '@/native/carplay.types';

export const DEFAULT_CARPLAY_SCENE_CONFIG: CarPlaySceneConfiguration = {
  role: CARPLAY_SCENE_ROLE,
  delegateClassName: 'CarPlaySceneDelegate',
  sceneClassName: 'CPTemplateApplicationScene',
  configurationName: 'Default Configuration',
};

interface SceneConfigFormProps {
  readonly style?: ViewStyle;
  readonly config?: CarPlaySceneConfiguration;
}

export default function SceneConfigForm({
  style,
  config = DEFAULT_CARPLAY_SCENE_CONFIG,
}: SceneConfigFormProps) {
  const rows: { readonly label: string; readonly value: string; readonly id: string }[] = [
    { id: 'role', label: 'UISceneSessionRole', value: config.role },
    { id: 'delegate', label: 'UISceneDelegateClassName', value: config.delegateClassName },
    { id: 'scene', label: 'UISceneClassName', value: config.sceneClassName },
    { id: 'name', label: 'UISceneConfigurationName', value: config.configurationName },
  ];

  return (
    <ThemedView style={[styles.container, style]} testID="carplay-scene-config-form">
      <ThemedText style={styles.heading}>UISceneConfiguration</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        These four keys belong under `UIApplicationSceneManifest.UISceneConfigurations` in your
        Info.plist. The lab populates them with sensible defaults; you may override the
        configuration name and class names once your entitlement is active.
      </ThemedText>
      <View style={styles.rows}>
        {rows.map((r) => (
          <View key={r.id} style={styles.row} testID={`carplay-scene-row-${r.id}`}>
            <ThemedText type="smallBold" style={styles.rowLabel}>
              {r.label}
            </ThemedText>
            <ThemedText type="code" style={styles.rowValue}>
              {r.value}
            </ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  rows: {
    gap: Spacing.two,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
  },
  rowValue: {
    fontSize: 12,
  },
});
