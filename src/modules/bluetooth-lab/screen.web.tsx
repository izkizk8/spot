/**
 * Bluetooth Lab Screen — Web variant.
 * Feature: 035-core-bluetooth
 *
 * MUST NOT import `@/native/ble-central` (the iOS bridge) at module
 * evaluation time. Platform resolution selects `@/native/ble-central.web`
 * automatically; the hook is the single import boundary that touches the
 * bridge and the platform suffix takes care of selecting the right file.
 *
 * When `navigator.bluetooth` is undefined the bridge reports
 * `central === 'unsupported'` and every async method rejects with
 * `BleNotSupported`, which the hook surfaces via `lastError`.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useBleCentral } from './hooks/useBleCentral';
import StateCard from './components/StateCard';
import PermissionsCard from './components/PermissionsCard';
import ScanControls from './components/ScanControls';
import DiscoveredList from './components/DiscoveredList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function NotSupportedNotice() {
  return (
    <ThemedView style={styles.notice}>
      <ThemedText style={styles.noticeText}>
        Web Bluetooth is not available in this browser. Try Chrome/Edge on a supported device — the
        page must be served over HTTPS.
      </ThemedText>
    </ThemedView>
  );
}

export default function BluetoothLabScreen() {
  const ble = useBleCentral();
  const supported = ble.central !== 'unsupported';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StateCard state={ble.central} onRefresh={ble.refreshState} />
      <PermissionsCard status={ble.permission} onRequest={ble.requestPermission} />
      {supported ? (
        <>
          <ScanControls
            central={ble.central}
            scan={ble.scan}
            allowDuplicates={ble.allowDuplicates}
            onScanToggle={ble.setScan}
            onFilterChange={ble.setFilter}
            onAllowDuplicatesChange={ble.setAllowDuplicates}
          />
          <DiscoveredList
            rows={ble.discovered}
            connectInFlight={false}
            onConnect={(row) => {
              ble.connect(row.id);
            }}
          />
        </>
      ) : (
        <NotSupportedNotice />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  noticeText: { color: '#856404', fontSize: 14 },
});
