/**
 * EventKit Lab — module-internal types.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/data-model.md
 */

import type { AlarmOffsetPreset } from './alarm-offsets';

/** Calendar authorization status (iOS 17+ adds 'writeOnly'). */
export type AuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'writeOnly';

/** Reminder authorization status (iOS 17+ adds 'fullAccess'). */
export type ReminderAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized'
  | 'fullAccess';

/** A calendar returned by expo-calendar. */
export interface CalendarSummary {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly color: string;
  readonly allowsModifications: boolean;
}

/** An event summary from expo-calendar. */
export interface EventSummary {
  readonly id: string;
  readonly title: string;
  readonly location?: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly allDay: boolean;
  readonly calendarId: string;
  readonly alarmOffset?: AlarmOffsetPreset;
}

/** A reminder summary. */
export interface ReminderSummary {
  readonly id: string;
  readonly title: string;
  readonly dueDate?: Date;
  readonly listId: string;
  readonly priority: 'none' | 'low' | 'medium' | 'high';
  readonly completed: boolean;
}

/** Draft for creating/updating an event. */
export interface EventDraft {
  readonly title: string;
  readonly location?: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly allDay: boolean;
  readonly calendarId: string;
  readonly alarmOffset?: AlarmOffsetPreset;
}

/** Draft for creating/updating a reminder. */
export interface ReminderDraft {
  readonly title: string;
  readonly dueDate?: Date;
  readonly listId: string;
  readonly priority: 'none' | 'low' | 'medium' | 'high';
}

/** Reminders filter. */
export type RemindersFilter = 'completed' | 'incomplete' | 'all';

/** Error classification output (R-D / H6). */
export type ClassifiedError =
  | { readonly kind: 'denied'; readonly message: string }
  | { readonly kind: 'restricted'; readonly message: string }
  | { readonly kind: 'write-only'; readonly message: string }
  | { readonly kind: 'not-found'; readonly message: string }
  | { readonly kind: 'invalid-input'; readonly message: string }
  | { readonly kind: 'failed'; readonly message: string };

/** Discriminated error kind. */
export type ClassifiedErrorKind = ClassifiedError['kind'];
