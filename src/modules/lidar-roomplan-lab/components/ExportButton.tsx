/**
 * ExportButton — LiDAR / RoomPlan Lab (feature 048).
 *
 * Triggers a USDZ export through the parent (which calls
 * `bridge.exportUSDZ`) and then routes the resulting on-disk URI
 * through the share-sheet bridge from feature 033. The bridge is
 * passed in as a prop (`shareBridge`) so the component is fully
 * testable without touching native code.
 */

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import type { ShareSheetBridge } from '@/native/share-sheet.types';
import { Spacing } from '@/constants/theme';

interface ExportButtonProps {
  readonly style?: ViewStyle;
  readonly disabled?: boolean;
  readonly onExport: () => Promise<string | null>;
  readonly shareBridge: ShareSheetBridge;
}

export default function ExportButton({
  style,
  disabled = false,
  onExport,
  shareBridge,
}: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  const handle = useCallback(async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const path = await onExport();
      if (!path) return;
      await shareBridge.present({
        content: {
          kind: 'file',
          uri: path,
          name: 'room.usdz',
          mimeType: 'model/vnd.usdz+zip',
          size: 0,
        },
        excludedActivityTypes: [],
        includeCustomActivity: false,
        anchor: null,
      });
    } catch {
      // The hook owns error reporting; swallow here so a failed
      // share does not crash the screen.
    } finally {
      setBusy(false);
    }
  }, [busy, disabled, onExport, shareBridge]);

  const isDisabled = disabled || busy;

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ disabled: isDisabled }}
      onPress={handle}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
      testID='roomplan-export-button'
    >
      <ThemedText type='smallBold'>{busy ? 'Exporting…' : 'Export USDZ'}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(120,120,255,0.18)',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
