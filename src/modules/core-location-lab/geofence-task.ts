/**
 * Geofence task handler (feature 025).
 *
 * Defines the TaskManager task that receives geofencing events from expo-location
 * and records them in the module-scoped event store.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

import { appendGeofenceEvent } from './event-store';

export const GEOFENCE_TASK_NAME = 'spot.core-location-lab.geofence';

interface GeofenceTaskBody {
  data: {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  } | null;
  error: { code?: string; message: string } | null;
}

TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }: GeofenceTaskBody) => {
  // Short-circuit on error
  if (error) {
    console.warn('[geofence-task] Error:', error.message);
    return;
  }

  if (!data) {
    return;
  }

  const { eventType, region } = data;
  const type = eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';

  appendGeofenceEvent({
    regionId: region.identifier,
    type,
    timestamp: new Date(),
  });
});
