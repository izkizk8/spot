/**
 * @file MagnetometerCard.tsx
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { CompassNeedle } from '../components/CompassNeedle';
import { PermissionNotice } from '../components/PermissionNotice';
import { SampleRatePicker, type SampleRate } from '../components/SampleRatePicker';
import { Sensors, useSensorStream } from '../hooks/useSensorStream';
import { useRegisterCard, type SensorCardHandle } from '../SensorsContext';

interface XYZ {
  x: number;
  y: number;
  z: number;
}

const TITLE = 'Magnetometer';
const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');

export function MagnetometerCard() {
  const [rate, setRate] = useState<SampleRate>(60);
  const stream = useSensorStream<XYZ>({
    sensor: Sensors.Magnetometer,
    mapSample: (raw) => {
      const r = raw as Partial<XYZ>;
      return { x: r.x ?? 0, y: r.y ?? 0, z: r.z ?? 0 };
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
  const latest = samples.length > 0 ? samples[samples.length - 1] : { x: 0, y: 0, z: 0 };

  const streamRef = useRef(stream);
  useEffect(() => {
    streamRef.current = stream;
  });
  const handle = useMemo<SensorCardHandle>(
    () => ({
      id: 'magnetometer',
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
    <ThemedView style={styles.card} testID="magnetometer-card">
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
        disabled={!stream.isAvailable || stream.permissionState === 'denied'}
        style={styles.button}
      >
        <ThemedText type="smallBold">{stream.isRunning ? 'Stop' : 'Start'}</ThemedText>
      </Pressable>
      <PermissionNotice kind={noticeKind} />
      <CompassNeedle x={latest.x} y={latest.y} />
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
