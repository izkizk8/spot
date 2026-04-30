/**
 * LiDAR / RoomPlan Lab — iOS screen (feature 048).
 *
 * Composes the showcase sections: CapabilityCard, ScanLauncher,
 * LiveStatusCard, RoomsList, RoomDetailView (with an
 * ExportButton injected via the `exportSlot` prop). The native
 * bridge is exercised through the `useRoomCapture` hook.
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { bridge as shareSheetBridge } from '@/native/share-sheet';

import CapabilityCard from './components/CapabilityCard';
import ExportButton from './components/ExportButton';
import LiveStatusCard from './components/LiveStatusCard';
import RoomDetailView from './components/RoomDetailView';
import RoomsList from './components/RoomsList';
import ScanLauncher from './components/ScanLauncher';
import { useRoomCapture } from './hooks/useRoomCapture';

export default function LidarRoomplanLabScreen() {
  const r = useRoomCapture();

  const onStart = useCallback(() => {
    void r.startScan();
  }, [r]);
  const onStop = useCallback(() => {
    void r.stopScan();
  }, [r]);
  const onExport = useCallback(async () => {
    return r.exportSelectedUSDZ();
  }, [r]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard style={styles.card} supported={r.supported} phase={r.phase} />
        <ScanLauncher
          style={styles.card}
          supported={r.supported}
          isScanning={r.isScanning}
          onStart={onStart}
          onStop={onStop}
        />
        <LiveStatusCard style={styles.card} phase={r.phase} errorMessage={r.lastError} />
        <RoomsList
          style={styles.card}
          rooms={r.rooms}
          selectedRoomId={r.selectedRoomId}
          onSelect={r.selectRoom}
          onDelete={r.deleteRoom}
        />
        <RoomDetailView
          style={styles.card}
          room={r.selectedRoom}
          exportSlot={
            r.selectedRoom ? (
              <ExportButton onExport={onExport} shareBridge={shareSheetBridge} />
            ) : null
          }
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
