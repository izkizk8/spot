import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Region } from '@/modules/mapkit-lab/landmarks';

export interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MapKitSearchBridge {
  searchLocations: (query: string, region: Region) => Promise<SearchResult[]>;
}

interface SearchPanelProps {
  region: Region;
  onResultPress: (r: SearchResult) => void;
  bridge: MapKitSearchBridge;
}

export function SearchPanel({ region, onResultPress, bridge }: SearchPanelProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const next = await bridge.searchLocations(trimmed, region);
      setResults(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        accessibilityLabel="Search query"
        testID="search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search places"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
          },
        ]}
      />

      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        testID="search-submit-button"
        style={[styles.button, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
          Submit
        </ThemedText>
      </Pressable>

      {loading ? (
        <ThemedText type="small" themeColor="textSecondary" testID="search-loading">
          Searching…
        </ThemedText>
      ) : null}

      {error ? (
        <ThemedText type="small" themeColor="textSecondary" testID="search-error">
          {error}
        </ThemedText>
      ) : null}

      {!loading && !error && results !== null && results.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="search-empty-state">
          No results found
        </ThemedText>
      ) : null}

      {!loading && !error && results !== null && results.length > 0 ? (
        <ThemedView style={styles.results} testID="search-results">
          {results.map((r, i) => (
            <Pressable
              key={`${r.name}-${r.lat}-${r.lng}-${i}`}
              accessibilityRole="button"
              testID={`search-result-${i}`}
              onPress={() => onResultPress(r)}
              style={[styles.resultRow, { backgroundColor: theme.backgroundElement }]}
            >
              <ThemedText type="smallBold">{r.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {r.address}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  input: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 14,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: {
    gap: Spacing.two,
  },
  resultRow: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.half,
  },
});
