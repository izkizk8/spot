/**
 * Core Location Lab screen — Android variant (feature 025).
 *
 * Same as iOS variant but replaces RegionMonitoringCard with IOSOnlyBanner
 * since geofencing is iOS-only.
 */
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PermissionsCard } from './components/PermissionsCard';
import { LiveUpdatesCard } from './components/LiveUpdatesCard';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { HeadingCard } from './components/HeadingCard';
import { SignificantChangesCard } from './components/SignificantChangesCard';

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
        <ThemedText type='subtitle'>{title}</ThemedText>
        <ThemedText>{isExpanded ? '▲' : '▼'}</ThemedText>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

export default function CoreLocationLabScreenAndroid() {
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
        <ThemedText type='title' style={styles.title}>
          Core Location
        </ThemedText>

        <CollapsibleSection
          title='Permissions'
          isExpanded={expandedSections.permissions}
          onToggle={() => toggleSection('permissions')}
        >
          <PermissionsCard />
        </CollapsibleSection>

        <CollapsibleSection
          title='Live Updates'
          isExpanded={expandedSections.liveUpdates}
          onToggle={() => toggleSection('liveUpdates')}
        >
          <LiveUpdatesCard />
        </CollapsibleSection>

        <CollapsibleSection
          title='Region Monitoring'
          isExpanded={expandedSections.regionMonitoring}
          onToggle={() => toggleSection('regionMonitoring')}
        >
          <IOSOnlyBanner reason='region-monitoring' />
        </CollapsibleSection>

        <CollapsibleSection
          title='Heading'
          isExpanded={expandedSections.heading}
          onToggle={() => toggleSection('heading')}
        >
          <HeadingCard />
        </CollapsibleSection>

        <CollapsibleSection
          title='Significant Changes'
          isExpanded={expandedSections.significantChanges}
          onToggle={() => toggleSection('significantChanges')}
        >
          <SignificantChangesCard />
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
});
