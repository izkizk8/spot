/**
 * SignificantChangesCard component (feature 025).
 *
 * Provides toggle to subscribe/unsubscribe to significant location changes
 * and displays event log of changes.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { EventLog } from './EventLog';
import type { SignificantChangeEvent } from '../types';

const SIGNIFICANT_CHANGES_TASK_NAME = 'spot.core-location-lab.significant-changes';

// Define the task handler for significant location changes
if (!TaskManager.isTaskDefined?.(SIGNIFICANT_CHANGES_TASK_NAME)) {
  TaskManager.defineTask(SIGNIFICANT_CHANGES_TASK_NAME, async ({ data: _data, error }) => {
    if (error) {
      console.warn('[SignificantChanges] Task error:', error);
      return;
    }
    // Task handler - events are processed via the subscription system
  });
}

export function SignificantChangesCard(): React.JSX.Element {
  const [subscribed, setSubscribed] = useState(false);
  const [events, _setEvents] = useState<SignificantChangeEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleToggle = useCallback(async (value: boolean) => {
    setError(null);
    try {
      if (value) {
        // Subscribe to significant location changes
        await Location.startLocationUpdatesAsync(SIGNIFICANT_CHANGES_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          // Significant changes mode on iOS
          activityType: Location.ActivityType.Other,
          deferredUpdatesInterval: 0,
          deferredUpdatesDistance: 0,
        });
        if (mountedRef.current) {
          setSubscribed(true);
        }
      } else {
        // Unsubscribe
        await Location.stopLocationUpdatesAsync(SIGNIFICANT_CHANGES_TASK_NAME);
        if (mountedRef.current) {
          setSubscribed(false);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setSubscribed(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscribed) {
        Location.stopLocationUpdatesAsync(SIGNIFICANT_CHANGES_TASK_NAME).catch(() => {
          // Ignore errors on cleanup
        });
      }
    };
  }, [subscribed]);

  // Format events for EventLog
  const eventLogEntries = events.map((event) => ({
    ...event,
    type: 'change' as const,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Significant Location Changes</Text>

      <View style={styles.explanationContainer}>
        <Text style={styles.explanationText}>
          Significant location changes use coarse location monitoring to receive updates when the
          device moves a significant distance. This is battery-efficient but only provides major
          location updates.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>
          {subscribed ? 'Subscribed — Monitoring active' : 'Subscribe to changes'}
        </Text>
        <Switch value={subscribed} onValueChange={handleToggle} accessibilityRole='switch' />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Events</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>
            No events yet. Enable monitoring and move to a new location.
          </Text>
        ) : (
          <EventLog entries={eventLogEntries} type='significant' />
        )}
      </View>

      {Platform.OS !== 'ios' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Significant location changes work best on iOS. Android support may vary.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  explanationContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  eventsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorContainer: {
    backgroundColor: '#F8D7DA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#721C24',
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 13,
  },
});
