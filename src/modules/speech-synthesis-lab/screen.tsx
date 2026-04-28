/**
 * Speech Synthesis Lab — iOS screen.
 *
 * Composes TextInputArea + preset chips + VoicePicker + Rate/Pitch/Volume
 * controls + TransportControls + PersonalVoiceCard (iOS 17+ only). Wires
 * `useSynthesisSession` end-to-end.
 */

import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import PersonalVoiceCard from './components/PersonalVoiceCard';
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

function isIOS17Plus(): boolean {
  if (Platform.OS !== 'ios') return false;
  const v = Platform.Version;
  if (typeof v === 'number') return v >= 17;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 17;
  }
  return false;
}

export default function SpeechSynthesisLabScreen() {
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

  const handlePause = React.useCallback(() => {
    void session.pause();
  }, [session]);

  const handleContinue = React.useCallback(() => {
    void session.continue();
  }, [session]);

  const handleStop = React.useCallback(() => {
    void session.stop();
  }, [session]);

  const showPersonalVoice = isIOS17Plus();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.presetRow}>
          {SAMPLE_PRESETS.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => setText(preset.text)}
              accessibilityRole="button"
              accessibilityLabel={`Load ${preset.label} sample text`}
              style={[styles.presetChip, { backgroundColor: theme.backgroundElement }]}
            >
              <ThemedText type="smallBold" themeColor="tintA">
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
          onPause={handlePause}
          onContinue={handleContinue}
          onStop={handleStop}
        />

        {showPersonalVoice ? (
          <PersonalVoiceCard
            status={session.personalVoiceStatus}
            onRequest={session.requestPersonalVoice}
          />
        ) : null}
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
