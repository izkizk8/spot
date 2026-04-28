import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CATEGORIES } from '../categories';

interface Props {
  lastReceived: { identifier: string; categoryId: string } | null;
  onInvokeAction: (actionId: string, textInput?: string) => void;
}

export function CategoriesCard({ lastReceived, onInvokeAction }: Props) {
  const [sheet, setSheet] = React.useState(false);

  return (
    <ThemedView style={styles.container}>
      {CATEGORIES.map((cat) => (
        <View key={cat.identifier} style={styles.category}>
          <ThemedText>{cat.identifier}</ThemedText>
          {cat.actions.map((action) => (
            <ThemedText key={action.id}>
              {action.id} {action.textInput && '(text input)'}
            </ThemedText>
          ))}
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setSheet(true)}
        accessibilityState={{ disabled: !lastReceived }}
        disabled={!lastReceived}
      >
        <ThemedText>Open last fired notification's actions</ThemedText>
      </TouchableOpacity>

      {sheet && lastReceived && (
        <View style={styles.sheet}>
          {CATEGORIES.find((c) => c.identifier === lastReceived.categoryId)?.actions.map((action) => (
            <TouchableOpacity key={action.id} onPress={() => onInvokeAction(action.id)}>
              <ThemedText>{action.id}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  category: { marginBottom: 16, gap: 4 },
  sheet: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, gap: 12 },
});
