import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { BUNDLED_ATTACHMENTS } from '../bundled-attachments';

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function AttachmentPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onSelect(null)}
        style={[styles.item, selected === null && styles.selected]}
        accessibilityState={{ selected: selected === null }}
      >
        <ThemedText>None</ThemedText>
      </TouchableOpacity>

      {BUNDLED_ATTACHMENTS.map((attachment) => (
        <TouchableOpacity
          key={attachment.id}
          testID={`attachment-${attachment.id}`}
          onPress={() => onSelect(attachment.id)}
          style={[styles.item, selected === attachment.id && styles.selected]}
          accessibilityState={{ selected: selected === attachment.id }}
        >
          <ThemedText>{attachment.id}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, padding: 16 },
  item: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  selected: { borderColor: '#007AFF', borderWidth: 2 },
});
