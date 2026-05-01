/**
 * Live Activity bridge stub for Web.
 *
 * MUST NOT call requireNativeModule at module load time.
 * MUST NOT throw at import time (FR-018).
 *
 * @see specs/007-live-activities-dynamic-island/contracts/live-activity-bridge.md
 */

import type {
  LiveActivityBridge,
  LiveActivitySession,
  LiveActivityStartArgs,
  LiveActivityState,
} from './live-activity.types';
import { LiveActivityNotSupportedError } from './live-activity.types';

const bridge: LiveActivityBridge = {
  isAvailable(): boolean {
    return false;
  },

  start(_args: LiveActivityStartArgs): Promise<LiveActivitySession> {
    return Promise.reject(new LiveActivityNotSupportedError());
  },

  update(_state: LiveActivityState): Promise<LiveActivitySession> {
    return Promise.reject(new LiveActivityNotSupportedError());
  },

  end(): Promise<void> {
    return Promise.reject(new LiveActivityNotSupportedError());
  },

  current(): Promise<LiveActivitySession | null> {
    return Promise.resolve(null);
  },
};

export default bridge;
