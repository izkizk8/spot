/**
 * ActionRow — Clear + Copy buttons with inline copy confirmation (US1, T037).
 *
 * - Clear always enabled, invokes onClear (FR-014)
 * - Copy disabled when !canCopy (FR-016)
 * - On Copy tap, awaits onCopy() and shows "Copied" / "Copy failed"
 *   inline confirmation for ~2s; never throws (FR-015, NFR-006)
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ActionRowProps {
  canCopy: boolean;
  onClear: () => void;
  onCopy: () => Promise<void> | void;
}

type Confirmation = 'idle' | 'copied' | 'failed';

const CONFIRMATION_MS = 2000;

export default function ActionRow({ canCopy, onClear, onCopy }: ActionRowProps) {
  const [confirmation, setConfirmation] = React.useState<Confirmation>('idle');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleReset = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) setConfirmation('idle');
    }, CONFIRMATION_MS);
  }, []);

  const handleCopy = React.useCallback(async () => {
    if (!canCopy) return;
    try {
      await Promise.resolve(onCopy());
      if (!mountedRef.current) return;
      setConfirmation('copied');
      scheduleReset();
    } catch {
      if (!mountedRef.current) return;
      setConfirmation('failed');
      scheduleReset();
    }
  }, [canCopy, onCopy, scheduleReset]);

  return (
    <ThemedView type='background' style={styles.row}>
      <Pressable
        onPress={onClear}
        accessibilityRole='button'
        accessibilityLabel='Clear transcript'
        style={styles.button}
      >
        <ThemedText type='smallBold' themeColor='tintA'>
          Clear
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={handleCopy}
        disabled={!canCopy}
        accessibilityRole='button'
        accessibilityLabel='Copy transcript'
        accessibilityState={{ disabled: !canCopy }}
        style={[styles.button, !canCopy && styles.buttonDisabled]}
      >
        <ThemedText type='smallBold' themeColor={canCopy ? 'tintA' : 'textSecondary'}>
          Copy
        </ThemedText>
      </Pressable>

      {confirmation !== 'idle' ? (
        <View style={styles.confirmation} accessibilityLiveRegion='polite'>
          <ThemedText
            type='small'
            themeColor={confirmation === 'failed' ? 'tintB' : 'textSecondary'}
          >
            {confirmation === 'copied' ? 'Copied' : 'Copy failed'}
          </ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmation: {
    paddingHorizontal: Spacing.two,
  },
});
