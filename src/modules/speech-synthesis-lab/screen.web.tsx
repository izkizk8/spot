/**
 * Speech Synthesis Lab — Web screen (Phase 9, T066).
 *
 * Same composition as `screen.tsx` minus PersonalVoiceCard (D-08). The Web
 * JS bridge from `src/native/speech-synthesis.web.ts` supplies the events
 * through `window.speechSynthesis`. Degrades silently when the API is
 * absent (NOOP_BRIDGE — empty voice list, disabled transport).
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import PitchControl from './components/PitchControl';
import RateControl from './components/RateControl';
import TextInputArea from './components/TextInputArea';
import TransportControls from './components/TransportControls';
import VoicePicker from './components/VoicePicker';
import VolumeControl from './components/VolumeControl';
import { useSynthesisSession } from './hooks/useSynthesisSession';
import { SAMPLE_PRESETS } from './sample-texts';
import { pitchPresetToValue, ratePresetToValue, volumePresetToValue } from './synth-mapping';
import type { PitchPreset, RatePreset, VolumePreset } from './synth-types';

export default function SpeechSynthesisLabScreenWeb() {
  const theme = useTheme();
  const session = useSynthesisSession();
  const [text, setText] = React.useState('');
  const [ratePreset, setRatePreset] = React.useState<RatePreset>('Normal');
  const [pitchPreset, setPitchPreset] = React.useState<PitchPreset>('Normal');
  const [volumePreset, setVolumePreset] = React.useState<VolumePreset>('Normal');

  const canSpeak = text.trim().length > 0;

  const handleSpeak = React.useCallback(() => {
    if (!canSpeak) return;
    void session.speak({
      text: text.trim(),
      rate: ratePresetToValue(ratePreset),
      pitch: pitchPresetToValue(pitchPreset),
      volume: volumePresetToValue(volumePreset),
    });
  }, [canSpeak, text, ratePreset, pitchPreset, volumePreset, session]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.presetRow}>
          {SAMPLE_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => setText(preset.text)}
              accessibilityRole='button'
              accessibilityLabel={`Load ${preset.label} sample text`}
              style={[styles.presetChip, { backgroundColor: theme.backgroundElement }]}
            >
              <ThemedText type='smallBold' themeColor='tintA'>
                {preset.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <TextInputArea
          value={text}
          onChangeText={setText}
          currentWordRange={session.currentWordRange}
        />

        <VoicePicker
          voices={session.voices}
          selectedVoiceId={session.selectedVoiceId}
          onSelectVoice={session.selectVoice}
          personalVoiceStatus={session.personalVoiceStatus}
        />

        <RateControl value={ratePreset} onChange={setRatePreset} />
        <PitchControl value={pitchPreset} onChange={setPitchPreset} />
        <VolumeControl value={volumePreset} onChange={setVolumePreset} />

        <TransportControls
          status={session.status}
          canSpeak={canSpeak}
          pauseSupported={session.pauseSupported}
          onSpeak={handleSpeak}
          onPause={() => session.pause()}
          onContinue={() => session.continue()}
          onStop={() => session.stop()}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
