/**
 * Bluetooth Lab Screen — iOS variant.
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useBleCentral } from './hooks/useBleCentral';
import StateCard from './components/StateCard';
import PermissionsCard from './components/PermissionsCard';
import ScanControls from './components/ScanControls';
import DiscoveredList from './components/DiscoveredList';
import PeripheralPanel from './components/PeripheralPanel';

export default function BluetoothLabScreen() {
  const ble = useBleCentral();
  const isConnecting = ble.connected != null && ble.connected.connectionState === 'connecting';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <StateCard state={ble.central} onRefresh={ble.refreshState} />
      <PermissionsCard status={ble.permission} onRequest={ble.requestPermission} />
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
        connectInFlight={isConnecting}
        onConnect={(row) => {
          ble.connect(row.id);
        }}
      />
      {ble.connected ? (
        <PeripheralPanel
          peripheralName={ble.connected.peripheral.name}
          peripheralId={ble.connected.peripheral.id}
          connectionState={ble.connected.connectionState}
          services={ble.connected.services}
          eventsByCharId={ble.connected.events}
          onDisconnect={ble.disconnect}
          onRead={ble.read}
          onWrite={ble.write}
          onSubscribe={ble.subscribe}
          onUnsubscribe={ble.unsubscribe}
          onClearEvents={() => undefined}
        />
      ) : (
        <View />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
});
