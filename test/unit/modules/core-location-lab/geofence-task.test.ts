/**
 * Tests for geofence-task.ts (feature 025)
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import { GEOFENCE_TASK_NAME } from '@/modules/core-location-lab/geofence-task';
import {
  appendGeofenceEvent,
  getGeofenceEvents,
  __resetGeofenceStore,
} from '@/modules/core-location-lab/event-store';

// Access mock helper
const mockTaskManager = TaskManager as typeof TaskManager & {
  __triggerGeofenceEvent: (
    taskName: string,
    body: { eventType: number; region: { identifier: string } },
  ) => void;
  __triggerGeofenceError: (
    taskName: string,
    error: { code?: string; message: string },
  ) => void;
};

describe('geofence-task', () => {
  beforeEach(() => {
    __resetGeofenceStore();
    // Re-register task after global mock reset - use dynamic import to trigger side effect
    jest.isolateModules(() => {
      require('@/modules/core-location-lab/geofence-task');
    });
  });

  it('handler records event with regionId === region.identifier for Enter event', () => {
    mockTaskManager.__triggerGeofenceEvent(GEOFENCE_TASK_NAME, {
      eventType: Location.GeofencingEventType.Enter,
      region: { identifier: 'region-1' },
    });

    const events = getGeofenceEvents();
    expect(events).toHaveLength(1);
    expect(events[0].regionId).toBe('region-1');
    expect(events[0].type).toBe('enter');
    expect(events[0].timestamp).toBeInstanceOf(Date);
  });

  it('handler records event with type "exit" for Exit event', () => {
    mockTaskManager.__triggerGeofenceEvent(GEOFENCE_TASK_NAME, {
      eventType: Location.GeofencingEventType.Exit,
      region: { identifier: 'region-2' },
    });

    const events = getGeofenceEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('exit');
  });

  it('handler is idempotent — duplicate events within same timestamp bucket yield one entry', () => {
    // Same region, same type, rapid-fire
    mockTaskManager.__triggerGeofenceEvent(GEOFENCE_TASK_NAME, {
      eventType: Location.GeofencingEventType.Enter,
      region: { identifier: 'region-1' },
    });
    mockTaskManager.__triggerGeofenceEvent(GEOFENCE_TASK_NAME, {
      eventType: Location.GeofencingEventType.Enter,
      region: { identifier: 'region-1' },
    });

    const events = getGeofenceEvents();
    // Idempotency should collapse to 1
    expect(events).toHaveLength(1);
  });

  it('error !== null short-circuits without writing an event', () => {
    mockTaskManager.__triggerGeofenceError(GEOFENCE_TASK_NAME, {
      message: 'Test error',
    });

    const events = getGeofenceEvents();
    expect(events).toHaveLength(0);
  });

  it('reaching 101 events FIFO-evicts the oldest', () => {
    // Add 101 events with different regions to avoid dedup
    for (let i = 0; i < 101; i++) {
      appendGeofenceEvent({
        regionId: `region-${i}`,
        type: 'enter',
        timestamp: new Date(Date.now() + i * 2000), // Different buckets
      });
    }

    const events = getGeofenceEvents();
    expect(events).toHaveLength(100);
    // First event (region-0) should be evicted
    expect(events[0].regionId).toBe('region-1');
    // Last event (region-100) should be present
    expect(events[99].regionId).toBe('region-100');
  });

  it('exports the correct GEOFENCE_TASK_NAME', () => {
    expect(GEOFENCE_TASK_NAME).toBe('spot.core-location-lab.geofence');
  });
});
