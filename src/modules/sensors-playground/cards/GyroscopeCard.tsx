/**
 * @file GyroscopeCard.tsx
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PermissionNotice } from '../components/PermissionNotice';
import { RotationIndicator } from '../components/RotationIndicator';
import { SampleRatePicker, type SampleRate } from '../components/SampleRatePicker';
import { Sensors, useSensorStream } from '../hooks/useSensorStream';
import { useRegisterCard, type SensorCardHandle } from '../SensorsContext';

interface XYZ {
  x: number;
  y: number;
  z: number;
}

const TITLE = 'Gyroscope';
const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');

export function GyroscopeCard() {
  const [rate, setRate] = useState<SampleRate>(60);
  const stream = useSensorStream<XYZ>({
    sensor: Sensors.Gyroscope,
    mapSample: (raw) => {
      const r = raw as Partial<XYZ>;
      return { x: r.x ?? 0, y: r.y ?? 0, z: r.z ?? 0 };
    },
    requiresPermission: false,
    rate,
    capacity: 60,
  });

  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = stream.subscribeToSnapshot(() => setTick((t) => (t + 1) & 0xffff));
    return unsub;
  }, [stream]);

  // Integrate yaw across snapshot deltas using the most-recent two samples
  // and Δt = 1/rate. (research.md Decision 4 — naive Riemann sum is sufficient.)
  const yawRef = useRef(0);
  const lastSampleCountRef = useRef(0);
  const samples = stream.snapshot(60);
  if (samples.length > lastSampleCountRef.current) {
    const delta = samples.length - lastSampleCountRef.current;
    const dt = 1 / rate;
    for (let i = samples.length - delta; i < samples.length; i++) {
      yawRef.current += samples[i].z * dt;
    }
    lastSampleCountRef.current = samples.length;
  } else if (samples.length === 0) {
    lastSampleCountRef.current = 0;
  }

  const latest = samples.length > 0 ? samples[samples.length - 1] : { x: 0, y: 0, z: 0 };

  const streamRef = useRef(stream);
  streamRef.current = stream;
  const handle = useMemo<SensorCardHandle>(
    () => ({
      id: 'gyroscope',
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
    <ThemedView style={styles.card} testID="gyroscope-card">
      <ThemedText type="subtitle">{TITLE}</ThemedText>
      <ThemedView style={styles.readouts}>
        <ThemedText type="code" testID="readout-x">{`x: ${fmt(latest.x)}`}</ThemedText>
        <ThemedText type="code" testID="readout-y">{`y: ${fmt(latest.y)}`}</ThemedText>
        <ThemedText type="code" testID="readout-z">{`z: ${fmt(latest.z)}`}</ThemedText>
      </ThemedView>
      <SampleRatePicker value={rate} onChange={setRate} />
      <Pressable
        accessibilityRole="button"
        testID="start-stop-button"
        onPress={() => {
          if (stream.isRunning) stream.stop();
          else void stream.start();
        }}
        disabled={!stream.isAvailable}
        style={styles.button}
      >
        <ThemedText type="smallBold">{stream.isRunning ? 'Stop' : 'Start'}</ThemedText>
      </Pressable>
      <PermissionNotice kind={noticeKind} />
      <RotationIndicator yaw={yawRef.current} />
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
