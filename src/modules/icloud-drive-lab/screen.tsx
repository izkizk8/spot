/**
 * iCloud Drive Lab — iOS screen (feature 070).
 *
 * Composes the showcase sections: entitlement banner, availability
 * card, file list, file actions, and setup instructions. The native
 * bridge is exercised through the `useICloudDrive` hook.
 */

import React, { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import EntitlementBanner from './components/EntitlementBanner';
import FileList from './components/FileList';
import IOSOnlyBanner from './components/IOSOnlyBanner';
import SetupInstructions from './components/SetupInstructions';
import { useICloudDrive } from './hooks/useICloudDrive';

const DEMO_FILE_NAME = 'icloud-drive-demo.txt';
const DEMO_CONTENT = 'Hello from iCloud Drive Lab!\nWritten via NSFileCoordinator.';

export default function ICloudDriveLabScreen() {
  const store = useICloudDrive();
  const { checkAvailability } = store;

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.container}>
        <IOSOnlyBanner />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <EntitlementBanner style={styles.card} />
        <ThemedView style={[styles.card, styles.availCard]}>
          <ThemedText style={styles.cardTitle}>Availability</ThemedText>
          {store.available === null ? (
            <ThemedText style={styles.help}>Not checked yet.</ThemedText>
          ) : store.available ? (
            <ThemedText style={styles.value}>iCloud Drive is available</ThemedText>
          ) : (
            <ThemedText style={styles.help}>
              iCloud Drive is unavailable. Check the entitlement and iCloud sign-in.
            </ThemedText>
          )}
        </ThemedView>
        <FileList style={styles.card} files={store.files} loading={store.loading} />
        <ThemedView style={[styles.card, styles.actions]}>
          <Pressable
            style={styles.button}
            onPress={() => {
              void store.refresh();
            }}
          >
            <ThemedText style={styles.buttonLabel}>Refresh Files</ThemedText>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              void store.writeFile(DEMO_FILE_NAME, DEMO_CONTENT);
            }}
          >
            <ThemedText style={styles.buttonLabel}>Write Demo File</ThemedText>
          </Pressable>
          {store.lastError !== null && (
            <ThemedText style={styles.error}>{store.lastError.message}</ThemedText>
          )}
        </ThemedView>
        <SetupInstructions style={styles.card} />
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
  availCard: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
  actions: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
    color: '#E53935',
    opacity: 0.9,
  },
});
