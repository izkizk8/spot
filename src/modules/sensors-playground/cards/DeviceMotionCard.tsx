/**
 * @file DeviceMotionCard.tsx
 * @description Reads DeviceMotion.rotation { alpha, beta, gamma } in radians.
 * Displays pitch (β), roll (γ), yaw (α) in degrees, with a SpiritLevel.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PermissionNotice } from '../components/PermissionNotice';
import { SampleRatePicker, type SampleRate } from '../components/SampleRatePicker';
import { SpiritLevel } from '../components/SpiritLevel';
import { Sensors, useSensorStream } from '../hooks/useSensorStream';
import { useRegisterCard, type SensorCardHandle } from '../SensorsContext';

interface RotationSample {
  alpha: number; // yaw
  beta: number; // pitch
  gamma: number; // roll
}

const TITLE = 'Device Motion';
const RAD_TO_DEG = 180 / Math.PI;
const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');

export function DeviceMotionCard() {
  const [rate, setRate] = useState<SampleRate>(60);
  const stream = useSensorStream<RotationSample>({
    sensor: Sensors.DeviceMotion,
    mapSample: (raw) => {
      const r = (raw as { rotation?: Partial<RotationSample> }).rotation ?? {};
      return { alpha: r.alpha ?? 0, beta: r.beta ?? 0, gamma: r.gamma ?? 0 };
    },
    requiresPermission: true,
    rate,
    capacity: 60,
  });

  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = stream.subscribeToSnapshot(() => setTick((t) => (t + 1) & 0xffff));
    return unsub;
  }, [stream]);

  const samples = stream.snapshot(1);
  const latest = samples.length > 0 ? samples[samples.length - 1] : { alpha: 0, beta: 0, gamma: 0 };

  const streamRef = useRef(stream);
  useEffect(() => {
    streamRef.current = stream;
  });
  const handle = useMemo<SensorCardHandle>(
    () => ({
      id: 'devicemotion',
      isAvailable: () => streamRef.current.isAvailable,
      isRunning: () => streamRef.current.isRunning,
      start: () => {
        void streamRef.current.start();
      },
      stop: () => streamRef.current.stop(),
    }),
    [],
  );
  useRegisterCard(handle);

  const noticeKind = !stream.isAvailable
    ? 'unsupported'
    : stream.permissionState === 'denied'
      ? 'denied'
      : 'idle';

  return (
    <ThemedView style={styles.card} testID="device-motion-card">
      <ThemedText type="subtitle">{TITLE}</ThemedText>
      <ThemedView style={styles.readouts}>
        <ThemedText
          type="code"
          testID="readout-pitch"
        >{`pitch: ${fmt(latest.beta * RAD_TO_DEG)}`}</ThemedText>
        <ThemedText
          type="code"
          testID="readout-roll"
        >{`roll: ${fmt(latest.gamma * RAD_TO_DEG)}`}</ThemedText>
        <ThemedText
          type="code"
          testID="readout-yaw"
        >{`yaw: ${fmt(latest.alpha * RAD_TO_DEG)}`}</ThemedText>
      </ThemedView>
      <SampleRatePicker value={rate} onChange={setRate} />
      <Pressable
        accessibilityRole="button"
        testID="start-stop-button"
        onPress={() => {
          if (stream.isRunning) stream.stop();
          else void stream.start();
        }}
        disabled={!stream.isAvailable || stream.permissionState === 'denied'}
        style={styles.button}
      >
        <ThemedText type="smallBold">{stream.isRunning ? 'Stop' : 'Start'}</ThemedText>
      </Pressable>
      <PermissionNotice kind={noticeKind} />
      <SpiritLevel pitch={latest.beta} roll={latest.gamma} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.two },
  readouts: { flexDirection: 'row', gap: Spacing.three },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignSelf: 'flex-start',
    borderRadius: Spacing.one,
    backgroundColor: '#E0E1E6',
  },
});
