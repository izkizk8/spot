import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useNotificationCenter } from './hooks/useNotificationCenter';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { ComposeForm } from './components/ComposeForm';
import { EventLog } from './components/EventLog';

export default function NotificationsLabScreenAndroid() {
  const hook = useNotificationCenter();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.card}>
        <IOSOnlyBanner reason="permissions" />
      </ThemedView>
      <ThemedView style={styles.card}>
        <ComposeForm
          permissionStatus={hook.permissions.status}
          locationAuthorized={true}
          onSubmit={hook.schedule}
        />
      </ThemedView>
      <ThemedView style={styles.card}>
        <IOSOnlyBanner reason="categories" />
      </ThemedView>
      <ThemedView style={styles.card}>
        <IOSOnlyBanner reason="pending" />
      </ThemedView>
      <ThemedView style={styles.card}>
        <IOSOnlyBanner reason="delivered" />
      </ThemedView>
      <ThemedView style={styles.card}>
        <EventLog events={hook.events} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16, borderRadius: 8 },
});
