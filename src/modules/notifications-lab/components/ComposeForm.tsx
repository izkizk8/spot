import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IOSOnlyBanner } from './IOSOnlyBanner';
import { AttachmentPicker } from './AttachmentPicker';
import { TriggerPicker } from './TriggerPicker';
import type { ComposeDraft } from '../types';

interface Props {
  permissionStatus: 'notDetermined' | 'provisional' | 'authorized' | 'denied' | 'ephemeral';
  locationAuthorized: boolean;
  onSubmit: (draft: ComposeDraft) => void;
}

export function ComposeForm({ permissionStatus, locationAuthorized, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const [interruptionLevel, setInterruptionLevel] = useState<
    'active' | 'time-sensitive' | 'critical'
  >('active');
  const [error, setError] = useState<string | null>(null);

  const disabled = permissionStatus === 'denied' || permissionStatus === 'notDetermined';

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title required');
      return;
    }

    onSubmit({
      title,
      subtitle,
      body,
      attachmentId,
      threadId: '',
      soundId: 'none',
      interruptionLevel,
      badge: 0,
      categoryId: null,
      trigger: { kind: 'immediate' },
    });
  };

  return (
    <ThemedView style={styles.container}>
      {Platform.OS === 'android' && <IOSOnlyBanner reason="compose-fields" />}

      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput
        placeholder="Subtitle"
        value={subtitle}
        onChangeText={setSubtitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Body"
        value={body}
        onChangeText={setBody}
        style={styles.input}
        multiline
      />

      <AttachmentPicker selected={attachmentId} onSelect={setAttachmentId} />

      <View style={styles.interruptionLevel}>
        <TouchableOpacity onPress={() => setInterruptionLevel('active')}>
          <ThemedText>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setInterruptionLevel('time-sensitive')}>
          <ThemedText>Time-Sensitive</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setInterruptionLevel('critical')}>
          <ThemedText>Critical</ThemedText>
        </TouchableOpacity>
      </View>

      {interruptionLevel === 'time-sensitive' && (
        <ThemedText style={styles.notice}>
          Requires entitlement to use time-sensitive level
        </ThemedText>
      )}

      {interruptionLevel === 'critical' && (
        <ThemedText style={styles.notice}>Requires entitlement to use critical level</ThemedText>
      )}

      <TriggerPicker
        value={{ kind: 'immediate' }}
        onChange={() => {}}
        locationAuthorized={locationAuthorized}
      />

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.button, disabled && styles.buttonDisabled]}
        disabled={disabled}
        accessibilityState={{ disabled }}
      >
        <ThemedText>Schedule</ThemedText>
      </TouchableOpacity>

      {disabled && <ThemedText style={styles.hint}>Permission required</ThemedText>}
      {permissionStatus === 'provisional' && (
        <ThemedText style={styles.hint}>Notifications will be delivered quietly</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  interruptionLevel: { flexDirection: 'row', gap: 12 },
  notice: { fontSize: 12, color: '#FF9500', fontStyle: 'italic' },
  error: { color: '#FF3B30' },
  button: { padding: 16, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  hint: { fontSize: 12, color: '#666', textAlign: 'center' },
});
