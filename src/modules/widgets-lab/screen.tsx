/**
 * Widgets Lab — iOS variant.
 *
 * Orchestrates StatusPanel + ConfigPanel + SetupInstructions +
 * WidgetPreview + ReloadEventLog (FR-029 order).
 *
 * Reads/writes config via the WidgetCenter bridge (App Group on iOS).
 * Maintains a 10-capacity ring buffer of ReloadEvents in a useReducer.
 *
 * @see specs/014-home-widgets/tasks.md T035
 */

import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import bridge from '@/native/widget-center';
import { ConfigPanel } from '@/modules/widgets-lab/components/ConfigPanel';
import { ReloadEventLog, type ReloadEvent } from '@/modules/widgets-lab/components/ReloadEventLog';
import { SetupInstructions } from '@/modules/widgets-lab/components/SetupInstructions';
import { StatusPanel } from '@/modules/widgets-lab/components/StatusPanel';
import { WidgetPreview } from '@/modules/widgets-lab/components/WidgetPreview';
import { DEFAULT_CONFIG, type WidgetConfig } from '@/modules/widgets-lab/widget-config';

const LOG_CAPACITY = 10;

type LogAction = { type: 'push'; event: ReloadEvent } | { type: 'clear' };

function logReducer(state: readonly ReloadEvent[], action: LogAction): readonly ReloadEvent[] {
  switch (action.type) {
    case 'push': {
      const next = [action.event, ...state];
      return next.length > LOG_CAPACITY ? next.slice(0, LOG_CAPACITY) : next;
    }
    case 'clear':
      return [];
  }
}

let eventCounter = 0;
function nextEventId(): string {
  eventCounter += 1;
  return `evt-${eventCounter}-${Date.now()}`;
}

export default function WidgetsLabScreen() {
  const isAvailable = bridge.isAvailable();
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  // Bumped whenever `config` changes from outside the ConfigPanel (i.e.
  // after the initial bridge fetch). Used as a `key` to remount the panel
  // so its internal edit state seeds from the new config.
  const [configEpoch, setConfigEpoch] = useState(0);
  const [log, dispatch] = useReducer(logReducer, []);

  useEffect(() => {
    if (!isAvailable) return;
    let mounted = true;
    bridge
      .getCurrentConfig()
      .then((c) => {
        if (mounted) {
          setConfig(c);
          setConfigEpoch((n) => n + 1);
        }
      })
      .catch(() => {
        // Read failure: keep DEFAULT_CONFIG
      });
    return () => {
      mounted = false;
    };
  }, [isAvailable]);

  const handlePush = useCallback(async (next: WidgetConfig): Promise<void> => {
    setConfig(next);
    try {
      await bridge.setConfig(next);
      await bridge.reloadAllTimelines();
      dispatch({
        type: 'push',
        event: { id: nextEventId(), timestamp: Date.now(), status: 'success' },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch({
        type: 'push',
        event: {
          id: nextEventId(),
          timestamp: Date.now(),
          status: 'failure',
          errorMessage: message,
        },
      });
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusPanel isAvailable={isAvailable} config={config} />
      <ThemedView style={styles.section}>
        <ConfigPanel
          key={configEpoch}
          value={config}
          onPush={handlePush}
          pushEnabled={isAvailable}
        />
      </ThemedView>
      <SetupInstructions isAvailable={isAvailable} />
      <ThemedView style={styles.section}>
        <WidgetPreview config={config} />
      </ThemedView>
      <ReloadEventLog events={log} isAvailable={isAvailable} />
    </ScrollView>
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
  section: {
    gap: Spacing.two,
  },
});
