/**
 * HomeKit Lab — iOS screen — feature 044.
 *
 * Composes the six HomeKit cards on top of `useHomeKit`. The hook
 * owns native interactions; this component only orchestrates which
 * card is mounted and wires the hook callbacks to each card's
 * action handler.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AccessoriesList from './components/AccessoriesList';
import AuthorizationCard from './components/AuthorizationCard';
import CharacteristicEditor from './components/CharacteristicEditor';
import HomesList from './components/HomesList';
import LiveObserveCard from './components/LiveObserveCard';
import RoomsList from './components/RoomsList';
import { useHomeKit } from './hooks/useHomeKit';

export default function HomeKitLabScreen() {
  const hk = useHomeKit();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleRequest = useCallback(() => {
    void hk.init();
  }, [hk]);

  const handleSelectHome = useCallback(
    (id: string) => {
      hk.selectHome(id);
      setSelectedRoomId(null);
    },
    [hk],
  );

  const handleWrite = useCallback(
    (value: boolean | number | string) => {
      void hk.writeValue(value);
    },
    [hk],
  );

  const handleRead = useCallback(() => {
    void hk.readValue();
  }, [hk]);

  const handleToggleObserver = useCallback(() => {
    hk.toggleObserver();
  }, [hk]);

  const selectedHome = hk.homes.find((h) => h.id === hk.selectedHomeId) ?? null;
  const selectedAccessory = hk.accessories.find((a) => a.id === hk.selectedAccessoryId) ?? null;
  const selectedCharacteristic =
    selectedAccessory?.characteristics.find((c) => c.id === hk.selectedCharacteristicId) ?? null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthorizationCard
          style={styles.card}
          authStatus={hk.authStatus}
          initialised={hk.initialised}
          available={hk.available}
          onRequest={handleRequest}
        />
        <HomesList
          style={styles.card}
          homes={hk.homes}
          selectedHomeId={hk.selectedHomeId}
          onSelect={handleSelectHome}
        />
        <RoomsList
          style={styles.card}
          home={selectedHome}
          selectedRoomId={selectedRoomId}
          onSelect={setSelectedRoomId}
        />
        <AccessoriesList
          style={styles.card}
          accessories={hk.accessories}
          selectedRoomId={selectedRoomId}
          selectedAccessoryId={hk.selectedAccessoryId}
          selectedCharacteristicId={hk.selectedCharacteristicId}
          onSelectAccessory={hk.selectAccessory}
          onSelectCharacteristic={hk.selectCharacteristic}
        />
        <CharacteristicEditor
          style={styles.card}
          characteristic={selectedCharacteristic}
          currentValue={hk.lastReadValue}
          onWrite={handleWrite}
          onRead={handleRead}
        />
        <LiveObserveCard
          style={styles.card}
          observerActive={hk.observerActive}
          observerUpdateCount={hk.observerUpdateCount}
          canSubscribe={selectedCharacteristic !== null}
          onToggle={handleToggleObserver}
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
