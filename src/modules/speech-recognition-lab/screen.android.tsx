/**
 * Speech Recognition Lab — Android screen (US5, T061).
 *
 * Composes the same components as the iOS screen but every interactive
 * surface is disabled and the IOSOnlyBanner is rendered across the top.
 * Never instantiates `useSpeechSession` and never invokes any bridge
 * methods beyond the synchronous `isAvailable` (which always returns
 * `false` on Android per FR-022).
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import AuthStatusPill from './components/AuthStatusPill';
import AudioSessionIndicator from './components/AudioSessionIndicator';
import RecognitionModePicker from './components/RecognitionModePicker';
import LocalePicker from './components/LocalePicker';
import TranscriptView from './components/TranscriptView';
import MicButton from './components/MicButton';
import ActionRow from './components/ActionRow';
import IOSOnlyBanner from './components/IOSOnlyBanner';

const noop = () => {};

export default function SpeechRecognitionLabScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <IOSOnlyBanner />

        <View style={styles.headerRow}>
          <AuthStatusPill status='notDetermined' />
          <AudioSessionIndicator active={false} />
        </View>

        <RecognitionModePicker
          mode='server'
          onDeviceAvailable={false}
          onModeChange={noop}
          disabled
        />

        <LocalePicker locale='en-US' onLocaleChange={noop} disabled />

        <View style={styles.transcript}>
          <TranscriptView final='' partial='' />
        </View>

        <View style={styles.micRow}>
          <MicButton listening={false} disabled onPress={noop} />
        </View>

        <ActionRow canCopy={false} onClear={noop} onCopy={noop} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  transcript: { minHeight: 160 },
  micRow: { alignItems: 'center', paddingVertical: Spacing.three },
});
