// Type definitions for the Notifications Lab module
import type { CategoryId } from './categories';
import type { InterruptionLevel } from './interruption-levels';

export interface PermissionsState {
  status: 'notDetermined' | 'provisional' | 'authorized' | 'denied' | 'ephemeral';
  alerts: boolean;
  sounds: boolean;
  badges: boolean;
  criticalAlerts: boolean;
  timeSensitive: boolean | null; // null on iOS<15 / non-iOS
}

export type TriggerSpec =
  | { kind: 'immediate' }
  | { kind: 'in-seconds'; seconds: number } // ≥ 1
  | { kind: 'at-time'; date: Date }
  | { kind: 'daily-at-time'; hour: number; minute: number }
  | {
      kind: 'on-region-entry';
      latitude: number;
      longitude: number;
      radius: 50 | 100 | 500;
    };

export interface ComposeDraft {
  title: string;
  subtitle: string;
  body: string;
  attachmentId: string | null;
  threadId: string;
  soundId: 'none' | 'default' | 'custom-bundled';
  interruptionLevel: InterruptionLevel;
  badge: number; // 0..99
  categoryId: CategoryId | null;
  trigger: TriggerSpec;
}

export interface PendingNotification {
  identifier: string;
  title: string;
  triggerSummary: string; // e.g. "in 30s", "daily 09:00"
}

export interface DeliveredNotification {
  identifier: string;
  title: string;
  deliveredAt: Date;
}

export type NotificationEvent =
  | { kind: 'received'; identifier: string; at: Date }
  | {
      kind: 'action-response';
      identifier: string;
      actionIdentifier: string;
      textInput: string | null;
      at: Date;
    }
  | { kind: 'dismissed'; identifier: string; at: Date };

// Re-export for convenience
export type { CategoryId, InterruptionLevel };
