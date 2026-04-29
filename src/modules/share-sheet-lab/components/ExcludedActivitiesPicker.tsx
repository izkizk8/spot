/**
 * ExcludedActivitiesPicker — feature 033 / T028.
 *
 * Checklist of iOS activity types with "Hide all" master toggle.
 * Disabled on non-iOS platforms.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ACTIVITY_TYPES_CATALOG, type ExcludedActivitySelection } from '../activity-types';

interface ExcludedActivitiesPickerProps {
  readonly selection: ExcludedActivitySelection;
  readonly onChange: (next: ExcludedActivitySelection) => void;
  readonly style?: ViewStyle;
}

export default function ExcludedActivitiesPicker({
  selection,
  onChange,
  style,
}: ExcludedActivitiesPickerProps) {
  const isIOS = Platform.OS === 'ios';
  const disabled = !isIOS;

  // Filter out synthetic entries
  const builtIns = ACTIVITY_TYPES_CATALOG.filter((e) => !e.synthetic);

  const handleToggle = (id: string) => {
    if (disabled) return;

    const checked = new Set(selection.checked);
    if (checked.has(id)) {
      checked.delete(id);
    } else {
      checked.add(id);
    }
    onChange({ ...selection, checked });
  };

  const handleHideAllToggle = () => {
    if (disabled) return;
    onChange({ ...selection, hideAll: !selection.hideAll });
  };

  return (
    <ThemedView style={[styles.container, style]} accessibilityState={{ disabled }}>
      <Pressable
        onPress={handleHideAllToggle}
        style={styles.masterRow}
        accessibilityRole="switch"
        accessibilityState={{ checked: selection.hideAll, disabled }}
      >
        <ThemedText style={styles.label}>Hide all built-in activities</ThemedText>
        <Switch value={selection.hideAll} onValueChange={handleHideAllToggle} disabled={disabled} />
      </Pressable>

      {!disabled && (
        <ThemedView style={styles.list}>
          {builtIns.map((entry) => {
            const checked = selection.hideAll || selection.checked.has(entry.id);
            return (
              <Pressable
                key={entry.id}
                onPress={() => handleToggle(entry.id)}
                style={styles.row}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: selection.hideAll }}
              >
                <ThemedView style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </ThemedView>
                <ThemedText style={styles.rowLabel}>{entry.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      )}

      {disabled && (
        <ThemedText style={styles.disabledCaption}>
          Activity exclusions are iOS only. On other platforms, all built-in activities are
          available.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rowLabel: {
    fontSize: 14,
  },
  disabledCaption: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
