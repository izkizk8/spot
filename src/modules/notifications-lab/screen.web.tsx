import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IOSOnlyBanner } from './components/IOSOnlyBanner';
import { EventLog } from './components/EventLog';
import type { NotificationEvent } from './types';

export default function NotificationsLabScreenWeb() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [events, setEvents] = useState<NotificationEvent[]>([]);

  const fireNotification = () => {
    if (!title.trim()) return;

    if (typeof globalThis.Notification === 'undefined') return;

    if (globalThis.Notification.permission === 'default') {
      globalThis.Notification.requestPermission();
    }

    if (globalThis.Notification.permission === 'granted') {
      new globalThis.Notification(title, { body });
      setEvents([{ kind: 'received', identifier: Date.now().toString(), at: new Date() }, ...events].slice(0, 20));
    }
  };

  const disabled = typeof globalThis.Notification === 'undefined' || globalThis.Notification.permission === 'denied';

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.card}>
        <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder="Body" value={body} onChangeText={setBody} style={styles.input} />
        <TouchableOpacity onPress={fireNotification} disabled={disabled} style={[styles.button, disabled && styles.disabled]}>
          <ThemedText>Schedule</ThemedText>
        </TouchableOpacity>
        {disabled && <ThemedText>Reset notification permission in your browser settings</ThemedText>}
      </ThemedView>
      <ThemedView style={styles.card}>
        <EventLog events={events} />
      </ThemedView>
      <ThemedView style={styles.card}>
        <IOSOnlyBanner reason="web-fallback" />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: 16, padding: 16 },
  input: { padding: 12, borderWidth: 1, marginBottom: 12 },
  button: { padding: 16, backgroundColor: '#007AFF', alignItems: 'center' },
  disabled: { backgroundColor: '#ccc' },
});
