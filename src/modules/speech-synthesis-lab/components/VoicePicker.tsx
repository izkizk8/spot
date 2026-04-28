/**
 * VoicePicker — SectionList of voices grouped by raw BCP-47 language tag.
 *
 * US2 (T035). Renders one section per `voice.language`; voices alphabetized
 * within each section. Quality badges (Default / Enhanced / Premium) themed
 * via `useTheme()` color tokens. When `personalVoiceStatus === 'authorized'`
 * AND any `voice.isPersonalVoice === true`, prepends a top-most **Personal
 * Voice** section above all language sections (FR-009, FR-028).
 */

import React from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  PersonalVoiceAuthorizationStatus,
  Voice,
  VoiceQuality,
} from '@/modules/speech-synthesis-lab/synth-types';

export interface VoicePickerProps {
  voices: Voice[];
  selectedVoiceId: string | undefined;
  onSelectVoice: (id: string | undefined) => void;
  personalVoiceStatus: PersonalVoiceAuthorizationStatus;
}

interface Section {
  title: string;
  data: Voice[];
}

function buildSections(
  voices: Voice[],
  personalVoiceStatus: PersonalVoiceAuthorizationStatus,
): Section[] {
  if (voices.length === 0) return [];

  const personalVoices = voices.filter((v) => v.isPersonalVoice);
  const regularVoices = voices.filter((v) => !v.isPersonalVoice);

  const grouped = new Map<string, Voice[]>();
  for (const v of regularVoices) {
    const key = v.language;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(v);
    } else {
      grouped.set(key, [v]);
    }
  }

  const languageSections: Section[] = [...grouped.entries()]
    .map(([title, list]) => ({
      title,
      data: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (personalVoices.length > 0 && personalVoiceStatus === 'authorized') {
    return [
      {
        title: 'Personal Voice',
        data: [...personalVoices].sort((a, b) => a.name.localeCompare(b.name)),
      },
      ...languageSections,
    ];
  }

  return languageSections;
}

const QUALITY_THEME: Record<VoiceQuality, 'textSecondary' | 'tintA' | 'tintB'> = {
  Default: 'textSecondary',
  Enhanced: 'tintA',
  Premium: 'tintB',
};

export default function VoicePicker({
  voices,
  selectedVoiceId,
  onSelectVoice,
  personalVoiceStatus,
}: VoicePickerProps) {
  const theme = useTheme();
  const sections = React.useMemo(
    () => buildSections(voices, personalVoiceStatus),
    [voices, personalVoiceStatus],
  );

  if (voices.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.empty}>
        <ThemedText type="small" themeColor="textSecondary">
          No voices available
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="background" style={styles.container} accessibilityLabel="Voice picker">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {section.title}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedVoiceId;
          return (
            <Pressable
              onPress={() => onSelectVoice(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select voice ${item.name} (${item.language})`}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.row,
                isSelected && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <ThemedText type="default" style={styles.voiceName}>
                {isSelected ? '✓ ' : '  '}
                {item.name}
              </ThemedText>
              <ThemedText type="small" themeColor={QUALITY_THEME[item.quality]} style={styles.badge}>
                {item.quality}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 320,
    borderRadius: Spacing.one,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  voiceName: {
    flex: 1,
  },
  badge: {
    marginLeft: Spacing.two,
  },
  empty: {
    padding: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.one,
  },
});
