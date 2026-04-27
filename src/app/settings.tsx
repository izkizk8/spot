import React from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Placeholder — replaced by the System / Light / Dark switcher in Phase 5 (T034).
export default function SettingsPlaceholder() {
  return (
    <ThemedView>
      <ThemedText>Settings</ThemedText>
    </ThemedView>
  );
}
