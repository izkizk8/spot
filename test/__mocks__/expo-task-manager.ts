/**
 * Mock for expo-task-manager (feature 025).
 *
 * Provides defineTask, isTaskRegisteredAsync, getRegisteredTasksAsync,
 * plus test-only helpers __triggerGeofenceEvent and __resetTaskManagerMock.
 */

// Module-scoped registry for tasks
const taskRegistry: Map<string, (body: unknown) => void> = new Map();

// Test helper to track tasks and trigger events
export function defineTask(name: string, handler: (body: unknown) => void): void {
  taskRegistry.set(name, handler);
}

export async function isTaskRegisteredAsync(name: string): Promise<boolean> {
  return taskRegistry.has(name);
}

export async function getRegisteredTasksAsync(): Promise<{ taskName: string }[]> {
  return Array.from(taskRegistry.keys()).map((taskName) => ({ taskName }));
}

// Test-only helpers
export function __triggerGeofenceEvent(
  taskName: string,
  body: { eventType: number; region: { identifier: string } },
): void {
  const handler = taskRegistry.get(taskName);
  if (handler) {
    handler({ data: body, error: null });
  }
}

export function __triggerGeofenceError(
  taskName: string,
  error: { code?: string; message: string },
): void {
  const handler = taskRegistry.get(taskName);
  if (handler) {
    handler({ data: null, error });
  }
}

export function __resetTaskManagerMock(): void {
  taskRegistry.clear();
  jest.clearAllMocks();
}
