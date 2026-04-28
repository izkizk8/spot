/**
 * Core Location Lab screen — Web variant (feature 025).
 *
 * Same as Android variant with additional "Coarse on web" note for
 * significant changes toggle (which is inert on web).
 */
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Switch, Text } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PermissionsCard } from './components/PermissionsCard';
import { LiveUpdatesCard } from './components/LiveUpdatesCard';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { HeadingCard } from './components/HeadingCard';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  testID?: string;
}

function CollapsibleSection({
  title,
  children,
  isExpanded,
  onToggle,
  testID,
}: CollapsibleSectionProps) {
  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.sectionHeader}
        testID={testID || `section-header-${title.toLowerCase().replace(/\s/g, '-')}`}
      >
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText>{isExpanded ? '▲' : '▼'}</ThemedText>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

/**
 * Inert SignificantChangesCard for web — toggle does nothing but displays a note.
 */
function SignificantChangesCardWeb() {
  const [enabled, setEnabled] = useState(false);

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">Significant Location Changes</ThemedText>

      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>
          Significant location changes use coarse location monitoring. On web, this feature has
          limited support.
        </Text>
      </View>

      <View style={styles.webNote}>
        <Text style={styles.webNoteText}>
          ⚠️ Coarse on web — This feature requires native APIs not available in browsers.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>
          {enabled ? 'Enabled (inert)' : 'Subscribe to changes'}
        </Text>
        <Switch value={enabled} onValueChange={setEnabled} accessibilityRole="switch" />
      </View>

      {enabled && (
        <View style={styles.inertNote}>
          <Text style={styles.inertNoteText}>
            Toggle is visual only on web — no actual subscription is made.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function CoreLocationLabScreenWeb() {
  // Per-card collapse state (not persisted across navigations — FR-014)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    permissions: true,
    liveUpdates: false,
    regionMonitoring: false,
    heading: false,
    significantChanges: false,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title" style={styles.title}>
          Core Location
        </ThemedText>

        <CollapsibleSection
          title="Permissions"
          isExpanded={expandedSections.permissions}
          onToggle={() => toggleSection('permissions')}
        >
          <PermissionsCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Live Updates"
          isExpanded={expandedSections.liveUpdates}
          onToggle={() => toggleSection('liveUpdates')}
        >
          <LiveUpdatesCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Region Monitoring"
          isExpanded={expandedSections.regionMonitoring}
          onToggle={() => toggleSection('regionMonitoring')}
        >
          <IOSOnlyBanner reason="region-monitoring" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Heading"
          isExpanded={expandedSections.heading}
          onToggle={() => toggleSection('heading')}
        >
          <HeadingCard />
        </CollapsibleSection>

        <CollapsibleSection
          title="Significant Changes"
          isExpanded={expandedSections.significantChanges}
          onToggle={() => toggleSection('significantChanges')}
        >
          <SignificantChangesCardWeb />
        </CollapsibleSection>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  section: {
    marginHorizontal: Spacing.three,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: '#f8f9fa',
  },
  sectionContent: {
    padding: Spacing.three,
    paddingTop: 0,
  },
  card: {
    padding: 16,
  },
  explanationContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  webNote: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  webNoteText: {
    color: '#856404',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  inertNote: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  inertNoteText: {
    color: '#1565C0',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
