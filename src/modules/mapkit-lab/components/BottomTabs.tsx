/**
 * BottomTabs — owns local active-tab state and renders one of four panels
 * (Annotations / Polyline / Search / LookAround). Receives the full
 * `useMapState` hook output plus the two native bridges so each panel can
 * be wired without prop-drilling through the screen.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AnnotationsPanel } from '@/modules/mapkit-lab/components/AnnotationsPanel';
import {
  LookAroundPanel,
  type LookAroundBridge,
} from '@/modules/mapkit-lab/components/LookAroundPanel';
import { PolylinePanel } from '@/modules/mapkit-lab/components/PolylinePanel';
import {
  SearchPanel,
  type MapKitSearchBridge,
  type SearchResult,
} from '@/modules/mapkit-lab/components/SearchPanel';
import type { UseMapState } from '@/modules/mapkit-lab/hooks/useMapState';

export type BottomTabKey = 'annotations' | 'polyline' | 'search' | 'lookaround';

interface BottomTabsProps {
  state: UseMapState;
  searchBridge: MapKitSearchBridge;
  lookAroundBridge: LookAroundBridge;
  iosVersionAtLeast16: boolean;
}

const TABS: ReadonlyArray<{ key: BottomTabKey; label: string; testID: string }> = [
  { key: 'annotations', label: 'Annotations', testID: 'annotations-tab' },
  { key: 'polyline', label: 'Polyline', testID: 'polyline-tab' },
  { key: 'search', label: 'Search', testID: 'search-tab' },
  { key: 'lookaround', label: 'LookAround', testID: 'lookaround-tab' },
];

export function BottomTabs({
  state,
  searchBridge,
  lookAroundBridge,
  iosVersionAtLeast16,
}: BottomTabsProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<BottomTabKey>('annotations');

  const handleResultPress = (r: SearchResult) => {
    state.setRegion({
      lat: r.lat,
      lng: r.lng,
      latDelta: state.region.latDelta,
      lngDelta: state.region.lngDelta,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.tabStrip}>
        {TABS.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              testID={tab.testID}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type='smallBold'>{tab.label}</ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      {activeTab === 'annotations' ? (
        <ThemedView testID='annotations-panel'>
          <AnnotationsPanel
            visibleAnnotationIds={state.visibleAnnotationIds}
            customAnnotations={state.customAnnotations}
            onToggleAnnotation={state.toggleAnnotation}
            onAddAtCenter={state.addAnnotationAtCenter}
          />
        </ThemedView>
      ) : null}

      {activeTab === 'polyline' ? (
        <ThemedView testID='polyline-panel'>
          <PolylinePanel
            hasPolyline={state.polylinePoints.length > 0}
            onDraw={state.drawSampleLoop}
            onClear={state.clearPolyline}
          />
        </ThemedView>
      ) : null}

      {activeTab === 'search' ? (
        <ThemedView testID='search-panel'>
          <SearchPanel
            region={state.region}
            onResultPress={handleResultPress}
            bridge={searchBridge}
          />
        </ThemedView>
      ) : null}

      {activeTab === 'lookaround' ? (
        <ThemedView testID='lookaround-panel'>
          <LookAroundPanel
            region={state.region}
            bridge={lookAroundBridge}
            iosVersionAtLeast16={iosVersionAtLeast16}
          />
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  tabStrip: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
