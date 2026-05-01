/**
 * StaticActionsList — read-only preview of the 4 default static actions.
 * Feature: 039-quick-actions
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { DEFAULT_QUICK_ACTIONS } from '../default-actions';
import { ActionRow } from './ActionRow';

export function StaticActionsList() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='static-actions-list'>
      <ThemedText type='subtitle'>Static actions (Info.plist)</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        These 4 ship in the binary and appear before any dynamic items.
      </ThemedText>
      {DEFAULT_QUICK_ACTIONS.map((action) => (
        <ActionRow
          key={action.type}
          title={action.title}
          subtitle={action.subtitle}
          iconName={action.iconName}
          route={action.userInfo.route}
          disabled
          testID={`static-action-${action.type}`}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
});
