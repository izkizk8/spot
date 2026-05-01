/**
 * ItemRow — displays one keychain item with inline reveal and delete.
 *
 * Shows: label, accessibility class label, biometry badge, device-only badge.
 * Actions: Show/Hide (inline reveal), Delete.
 * Tolerates cancelled/auth-failed with inline message (no error throw).
 */

import React, { useState } from 'react';
import { StyleSheet, Pressable, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { KeychainItemMeta } from '../types';
import { ACCESSIBILITY_CLASSES } from '../accessibility-classes';

interface ItemRowProps {
  item: KeychainItemMeta;
  onReveal: (id: string) => Promise<string | null>;
  onDelete: (id: string) => void;
}

export default function ItemRow({ item, onReveal, onDelete }: ItemRowProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const descriptor = ACCESSIBILITY_CLASSES.find((ac) => ac.key === item.accessibilityClass);

  async function handleReveal() {
    if (revealed) {
      setRevealed(null);
      return;
    }

    setRevealing(true);
    const value = await onReveal(item.id);
    setRevealing(false);

    if (value === null) {
      setRevealed('(cancelled or authentication failed)');
    } else {
      setRevealed(value);
    }
  }

  function handleDelete() {
    onDelete(item.id);
  }

  return (
    <ThemedView style={styles.container} type='backgroundElement'>
      <ThemedView style={styles.row} type='backgroundElement'>
        <ThemedView style={styles.infoColumn} type='backgroundElement'>
          <ThemedText type='default' style={styles.label}>
            {item.label}
          </ThemedText>
          <ThemedView style={styles.metaRow} type='backgroundElement'>
            <ThemedText type='small' themeColor='textSecondary'>
              {descriptor?.label ?? item.accessibilityClass}
            </ThemedText>
            {item.biometryRequired && (
              <ThemedText type='small' style={styles.badge}>
                🔐
              </ThemedText>
            )}
            {descriptor?.deviceOnly && (
              <ThemedText type='small' style={styles.badge}>
                📱
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.actions} type='backgroundElement'>
          <Pressable
            style={[styles.button, { backgroundColor: theme.tintA }]}
            onPress={handleReveal}
            disabled={revealing}
          >
            {revealing ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <ThemedText type='small' style={styles.buttonText}>
                {revealed ? 'Hide' : 'Show'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, { backgroundColor: theme.textSecondary }]}
            onPress={handleDelete}
          >
            <ThemedText type='small' style={styles.buttonText}>
              Delete
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {revealed && (
        <ThemedView style={styles.revealedContainer} type='backgroundSelected'>
          <ThemedText type='code' style={styles.revealedText}>
            {revealed}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoColumn: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    marginLeft: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  revealedContainer: {
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  revealedText: {
    fontFamily: 'monospace',
  },
});
