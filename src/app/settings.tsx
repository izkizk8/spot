import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type ThemePreference } from '@/theme/preference-provider';
import { usePreferenceLoaded, useThemePreference } from '@/theme/use-theme-preference';

const OPTIONS: ReadonlyArray<{ id: ThemePreference; label: string; description: string }> = [
  { id: 'system', label: 'System', description: 'Follow the device appearance.' },
  { id: 'light', label: 'Light', description: 'Always use the light theme.' },
  { id: 'dark', label: 'Dark', description: 'Always use the dark theme.' },
];

function RadioOption({
  option,
  selected,
  onPress,
}: {
  option: (typeof OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='radio'
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.optionRow}
      >
        <ThemedView
          style={styles.optionText}
          type={selected ? 'backgroundSelected' : 'backgroundElement'}
        >
          <ThemedText type='smallBold'>{option.label}</ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            {option.description}
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={[
            styles.radio,
            { borderColor: theme.text },
            selected && { backgroundColor: theme.text },
          ]}
          type={selected ? 'backgroundSelected' : 'backgroundElement'}
        />
      </ThemedView>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  // FR-021 / SC-004: suppress flicker until persisted value is hydrated.
  const loaded = usePreferenceLoaded();

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type='subtitle'>Settings</ThemedText>
        </ThemedView>

        <ThemedView style={styles.group}>
          <ThemedText type='smallBold' style={styles.groupHeader}>
            Appearance
          </ThemedText>
          {loaded ? (
            <ThemedView style={styles.options}>
              {OPTIONS.map((opt) => (
                <RadioOption
                  key={opt.id}
                  option={opt}
                  selected={preference === opt.id}
                  onPress={() => setPreference(opt.id)}
                />
              ))}
            </ThemedView>
          ) : (
            <ThemedView type='backgroundElement' style={styles.placeholder} />
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.two,
  },
  groupHeader: {
    paddingHorizontal: Spacing.two,
  },
  options: {
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  optionText: {
    flex: 1,
    gap: Spacing.half,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  placeholder: {
    height: 200,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
