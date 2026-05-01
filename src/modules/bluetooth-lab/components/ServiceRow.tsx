/**
 * ServiceRow — collapsible service with characteristic children.
 * Feature: 035-core-bluetooth
 */

import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CharacteristicEvent, DiscoveredService } from '@/native/ble-central.types';
import { lookup } from '@/modules/bluetooth-lab/utils/well-known-services';

import CharacteristicRow from './CharacteristicRow';

interface Props {
  readonly service: DiscoveredService;
  readonly eventsByCharId: Readonly<Record<string, readonly CharacteristicEvent[]>>;
  readonly onRead: (uuid: string) => void;
  readonly onWrite: (uuid: string, bytes: Uint8Array) => void;
  readonly onSubscribe: (uuid: string) => void;
  readonly onUnsubscribe: (uuid: string) => void;
  readonly onClearEvents: (uuid: string) => void;
}

export default function ServiceRow({
  service,
  eventsByCharId,
  onRead,
  onWrite,
  onSubscribe,
  onUnsubscribe,
  onClearEvents,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const label = lookup(service.uuid);
  const title = label ?? `Custom service ${service.uuid}`;

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        accessibilityRole='button'
        accessibilityState={{ expanded }}
      >
        <ThemedText style={styles.title}>
          {expanded ? '▼ ' : '▶ '}
          {title}
        </ThemedText>
        {!label ? <ThemedText style={styles.uuid}>{service.uuid}</ThemedText> : null}
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.body}>
          {service.characteristics.length === 0 ? (
            <ThemedText style={styles.empty}>No characteristics discovered yet.</ThemedText>
          ) : (
            service.characteristics.map((c) => (
              <CharacteristicRow
                key={c.id}
                characteristic={c}
                events={eventsByCharId[c.id] ?? []}
                onRead={onRead}
                onWrite={onWrite}
                onSubscribe={onSubscribe}
                onUnsubscribe={onUnsubscribe}
                onClearEvents={onClearEvents}
              />
            ))
          )}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.two, borderRadius: Spacing.one, marginVertical: Spacing.one },
  title: { fontSize: 14, fontWeight: '600' },
  uuid: { fontSize: 11, opacity: 0.6 },
  body: { marginTop: Spacing.one },
  empty: { fontSize: 12, opacity: 0.6 },
});
