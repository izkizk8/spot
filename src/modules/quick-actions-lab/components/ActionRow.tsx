/**
 * ActionRow — a single quick-action row used by both the static and
 * dynamic action lists.
 * Feature: 039-quick-actions
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ActionRowProps {
  title: string;
  subtitle?: string;
  iconName: string;
  route: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export function ActionRow({
  title,
  subtitle,
  iconName,
  route,
  onPress,
  disabled,
  testID,
}: ActionRowProps) {
  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [styles.pressable, pressed && !disabled && styles.pressed]}
      testID={testID ?? 'action-row'}
    >
      <ThemedView style={styles.row} type='backgroundElement'>
        <ThemedView style={styles.iconBox} type='background'>
          <ThemedText type='small' testID='action-row-icon'>
            {iconName}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.body} type='backgroundElement'>
          <ThemedText type='default'>{title}</ThemedText>
          {subtitle ? (
            <ThemedText type='small' themeColor='textSecondary'>
              {subtitle}
            </ThemedText>
          ) : null}
          <ThemedText type='small' themeColor='textSecondary'>
            {route}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
});
