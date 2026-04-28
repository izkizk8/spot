import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useNotificationCenter } from './hooks/useNotificationCenter';
import { PermissionsCard } from './components/PermissionsCard';
import { ComposeForm } from './components/ComposeForm';
import { CategoriesCard } from './components/CategoriesCard';
import { PendingList } from './components/PendingList';
import { DeliveredList } from './components/DeliveredList';
import { EventLog } from './components/EventLog';

export default function NotificationsLabScreen() {
  const hook = useNotificationCenter();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.card}>
        <PermissionsCard permissions={hook.permissions} onRequest={hook.request} />
      </ThemedView>
      <ThemedView style={styles.card}>
        <ComposeForm
          permissionStatus={hook.permissions.status}
          locationAuthorized={true}
          onSubmit={hook.schedule}
        />
      </ThemedView>
      <ThemedView style={styles.card}>
        <CategoriesCard lastReceived={null} onInvokeAction={hook.invokeAction} />
      </ThemedView>
      <ThemedView style={styles.card}>
        <PendingList pending={hook.pending} onCancel={hook.cancel} onCancelAll={hook.cancelAll} />
      </ThemedView>
      <ThemedView style={styles.card}>
        <DeliveredList
          delivered={hook.delivered}
          onRemove={hook.remove}
          onClearAll={hook.clearAll}
        />
      </ThemedView>
      <ThemedView style={styles.card}>
        <EventLog events={hook.events} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16, borderRadius: 8, shadowOpacity: 0.1 },
});
