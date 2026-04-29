/**
 * Shared types for the Quick Actions Lab module.
 * Feature: 039-quick-actions
 */

export type { QuickActionDefinition } from './default-actions';

export interface InvocationEvent {
  type: string;
  userInfo: Record<string, unknown>;
  /** ISO 8601, captured the moment the listener / initial fires. */
  timestamp: string;
}
