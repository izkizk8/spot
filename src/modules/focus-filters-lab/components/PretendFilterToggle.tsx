import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DRAFT_DEFAULTS } from '@/modules/focus-filters-lab/filter-modes';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

interface PretendFilterToggleProps {
  draft: { mode: string; accentColor: string };
  persistedPayload?: ShowcaseFilterPersistedPayload | null;
  onActivate: (values: { mode: string; accentColor: string }) => void;
}

const ACCENT_COLORS: Record<string, string> = {
  blue: '#007AFF',
  orange: '#FF9500',
  green: '#34C759',
  purple: '#AF52DE',
};

export default function PretendFilterToggle({
  draft,
  persistedPayload,
  onActivate,
}: PretendFilterToggleProps) {
  const [isActive, setIsActive] = useState(false);
  const prevDraftRef = useRef(draft);

  // When toggle is ON and draft changes, fire onActivate
  useEffect(() => {
    if (isActive) {
      const draftChanged =
        prevDraftRef.current.mode !== draft.mode ||
        prevDraftRef.current.accentColor !== draft.accentColor;
      if (draftChanged) {
        onActivate(draft);
      }
    }
    prevDraftRef.current = draft;
  }, [draft, isActive, onActivate]);

  const handleToggle = (value: boolean) => {
    setIsActive(value);
    if (value) {
      onActivate(draft);
    }
  };

  // Determine active values for demo body
  const activeValues = isActive
    ? draft
    : persistedPayload
      ? { mode: persistedPayload.mode, accentColor: persistedPayload.accentColor }
      : DRAFT_DEFAULTS;

  const accentHex = ACCENT_COLORS[activeValues.accentColor] || '#999';

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>In-App Demo</ThemedText>

      <View style={styles.toggleRow}>
        <ThemedText style={styles.toggleLabel}>Pretend filter is active</ThemedText>
        <Switch value={isActive} onValueChange={handleToggle} />
      </View>

      <View style={styles.statusRow}>
        <ThemedText style={styles.statusLabel}>Status:</ThemedText>
        <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
          <ThemedText style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</ThemedText>
        </View>
      </View>

      <View
        style={[styles.demoBody, { borderColor: accentHex }]}
        accessibilityLabel={`Demo body showing mode ${activeValues.mode} with accent ${activeValues.accentColor}`}
      >
        <ThemedText style={styles.demoLabel}>Demo Body</ThemedText>
        <ThemedText style={styles.demoValue}>
          Mode: {activeValues.mode} | Accent: {activeValues.accentColor}
        </ThemedText>
        <View style={[styles.accentBar, { backgroundColor: accentHex }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.three,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  toggleLabel: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.two,
  },
  statusPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  demoBody: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 3,
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  demoValue: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: Spacing.two,
  },
  accentBar: {
    height: 4,
    borderRadius: 2,
  },
});
