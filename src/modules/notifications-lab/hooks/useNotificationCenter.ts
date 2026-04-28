import { useState, useEffect, useRef } from 'react';
import { Platform, Image } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { CATEGORIES } from '../categories';
import { BUNDLED_ATTACHMENTS } from '../bundled-attachments';
import type {
  PermissionsState,
  ComposeDraft,
  PendingNotification,
  DeliveredNotification,
  NotificationEvent,
} from '../types';

// Module-scope flags for idempotent registration
let __categoriesRegistered = false;
let __defaultChannelRegistered = false;
let __lastResponseReplayed = false;

// Test helper to reset module-scope flags
export function __resetModuleFlags() {
  __categoriesRegistered = false;
  __defaultChannelRegistered = false;
  __lastResponseReplayed = false;
}

const ANDROID_CHANNEL_ID = 'spot.default';
const ANDROID_CHANNEL_NAME = 'Default';
const EVENT_LOG_CAP = 20;
const IOS_DISMISS_ACTION_ID = 'com.apple.UNNotificationDismissActionIdentifier';

export interface UseNotificationCenter {
  permissions: PermissionsState;
  pending: ReadonlyArray<PendingNotification>;
  delivered: ReadonlyArray<DeliveredNotification>;
  events: ReadonlyArray<NotificationEvent>;
  request(opts?: { provisional?: boolean }): Promise<void>;
  schedule(draft: ComposeDraft): Promise<string>;
  cancel(identifier: string): Promise<void>;
  cancelAll(): Promise<void>;
  remove(identifier: string): Promise<void>;
  clearAll(): Promise<void>;
  refresh(): Promise<void>;
  invokeAction(args: {
    identifier: string;
    actionIdentifier: string;
    textInput?: string;
  }): void;
  error: Error | null;
}

export function useNotificationCenter(): UseNotificationCenter {
  const [permissions, setPermissions] = useState<PermissionsState>({
    status: 'notDetermined',
    alerts: false,
    sounds: false,
    badges: false,
    criticalAlerts: false,
    timeSensitive: null,
  });

  const [pending, setPending] = useState<ReadonlyArray<PendingNotification>>([]);
  const [delivered, setDelivered] = useState<ReadonlyArray<DeliveredNotification>>([]);
  const [events, setEvents] = useState<ReadonlyArray<NotificationEvent>>([]);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const subscriptionsRef = useRef<Array<{ remove: () => void }>>([]);

  useEffect(() => {
    mountedRef.current = true;

    // Idempotent category registration
    if (!__categoriesRegistered && typeof Notifications.setNotificationCategoriesAsync === 'function') {
      __categoriesRegistered = true;
      Notifications.setNotificationCategoriesAsync(CATEGORIES as any).catch((err) => {
        if (mountedRef.current) {
          setError(err);
        }
      });
    }

    // Android channel registration
    if (Platform.OS === 'android' && !__defaultChannelRegistered) {
      __defaultChannelRegistered = true;
      Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: ANDROID_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch((err) => {
        if (mountedRef.current) {
          setError(err);
        }
      });
    }

    // Attach listeners
    const receivedSub = Notifications.addNotificationReceivedListener((notification: any) => {
      if (!mountedRef.current) return;

      const event: NotificationEvent = {
        kind: 'received',
        identifier: notification.request.identifier,
        at: new Date(),
      };

      setEvents((prev) => {
        const updated = [event, ...prev];
        return updated.slice(0, EVENT_LOG_CAP);
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      if (!mountedRef.current) return;

      const identifier = response.notification.request.identifier;
      const actionIdentifier = response.actionIdentifier;

      let event: NotificationEvent;

      if (actionIdentifier === IOS_DISMISS_ACTION_ID) {
        event = {
          kind: 'dismissed',
          identifier,
          at: new Date(),
        };
      } else {
        event = {
          kind: 'action-response',
          identifier,
          actionIdentifier,
          textInput: response.userText ?? null,
          at: new Date(),
        };
      }

      setEvents((prev) => {
        const updated = [event, ...prev];
        return updated.slice(0, EVENT_LOG_CAP);
      });
    });

    subscriptionsRef.current.push(receivedSub, responseSub);

    // Cold-launch response replay (one-shot)
    if (!__lastResponseReplayed) {
      __lastResponseReplayed = true;
      Notifications.getLastNotificationResponseAsync()
        .then((lastResponse: any) => {
          if (!lastResponse || !mountedRef.current) return;

          const event: NotificationEvent = {
            kind: 'action-response',
            identifier: lastResponse.notification.request.identifier,
            actionIdentifier: lastResponse.actionIdentifier,
            textInput: lastResponse.userText ?? null,
            at: new Date(),
          };

          setEvents((prev) => {
            const updated = [event, ...prev];
            return updated.slice(0, EVENT_LOG_CAP);
          });
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err);
          }
        });
    }

    // Initial permissions check
    Notifications.getPermissionsAsync()
      .then((result: any) => {
        if (!mountedRef.current) return;
        setPermissions(mapPermissions(result));
      })
      .catch((err) => {
        if (mountedRef.current) {
          setError(err);
        }
      });

    // Initial refresh
    refresh();

    return () => {
      mountedRef.current = false;
      subscriptionsRef.current.forEach((sub) => sub.remove());
      subscriptionsRef.current = [];
    };
  }, []);

  const request = async (opts?: { provisional?: boolean }): Promise<void> => {
    try {
      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
          allowProvisional: !!opts?.provisional,
          provideAppNotificationSettings: true,
        },
      });

      if (mountedRef.current) {
        setPermissions(mapPermissions(result));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const schedule = async (draft: ComposeDraft): Promise<string> => {
    try {
      const content: any = {
        title: draft.title,
        subtitle: draft.subtitle || undefined,
        body: draft.body,
        badge: draft.badge || undefined,
        data: {},
      };

      // Sound
      if (draft.soundId === 'default') {
        content.sound = 'default';
      } else if (draft.soundId === 'custom-bundled') {
        content.sound = 'sample-sound.caf';
      }

      // Category
      if (draft.categoryId) {
        content.categoryIdentifier = draft.categoryId;
      }

      // Thread ID
      if (draft.threadId) {
        content.threadIdentifier = draft.threadId;
      }

      // Interruption level (iOS only)
      if (Platform.OS === 'ios') {
        content.interruptionLevel = draft.interruptionLevel;
      }

      // Android channel
      if (Platform.OS === 'android') {
        content.channelId = ANDROID_CHANNEL_ID;
      }

      // Attachment
      if (draft.attachmentId) {
        const attachment = BUNDLED_ATTACHMENTS.find((a) => a.id === draft.attachmentId);
        if (attachment) {
          const resolved = Image.resolveAssetSource(attachment.requireAsset);
          content.attachments = [
            {
              url: resolved.uri,
            },
          ];
        }
      }

      // Trigger translation
      let trigger: any = null;

      switch (draft.trigger.kind) {
        case 'immediate':
          trigger = null;
          break;

        case 'in-seconds':
          trigger = {
            seconds: draft.trigger.seconds,
            repeats: false,
          };
          break;

        case 'at-time':
          trigger = {
            date: draft.trigger.date,
          };
          break;

        case 'daily-at-time':
          trigger = {
            hour: draft.trigger.hour,
            minute: draft.trigger.minute,
            repeats: true,
          };
          break;

        case 'on-region-entry':
          {
            // Generate UUID for geofence identifier
            const uuid = generateUUID();
            const identifier = `spot-geofence-${uuid}`;

            try {
              // Register geofence task (reusing 025's pattern)
              await Location.startGeofencingAsync(identifier, [
                {
                  identifier,
                  latitude: draft.trigger.latitude,
                  longitude: draft.trigger.longitude,
                  radius: draft.trigger.radius,
                  notifyOnEnter: true,
                  notifyOnExit: false,
                },
              ]);
            } catch (err: any) {
              // Quota error handling
              if (err.message && /quota/i.test(err.message)) {
                const quotaError = new Error(
                  'Geofence quota reached (iOS limits 20 per app). Cancel an existing region trigger or geofence in 025 to free a slot.',
                );
                if (mountedRef.current) {
                  setError(quotaError);
                }
                throw quotaError;
              }
              throw err;
            }

            trigger = {
              type: 'location',
              region: {
                identifier,
                latitude: draft.trigger.latitude,
                longitude: draft.trigger.longitude,
                radius: draft.trigger.radius,
                notifyOnEnter: true,
                notifyOnExit: false,
              },
            };
          }
          break;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      await refresh();
      return identifier;
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  };

  const cancel = async (identifier: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const cancelAll = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const remove = async (identifier: string): Promise<void> => {
    try {
      await Notifications.dismissNotificationAsync(identifier);
      await refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const clearAll = async (): Promise<void> => {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const refresh = async (): Promise<void> => {
    try {
      const [scheduledNotifs, presentedNotifs] = await Promise.all([
        Notifications.getAllScheduledNotificationsAsync(),
        Notifications.getPresentedNotificationsAsync(),
      ]);

      if (!mountedRef.current) return;

      setPending(
        scheduledNotifs.map((n: any) => ({
          identifier: n.identifier,
          title: n.content.title || '',
          triggerSummary: summarizeTrigger(n.trigger),
        })),
      );

      setDelivered(
        presentedNotifs.map((n: any) => ({
          identifier: n.identifier,
          title: n.request.content.title || '',
          deliveredAt: new Date(n.date),
        })),
      );
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    }
  };

  const invokeAction = (args: {
    identifier: string;
    actionIdentifier: string;
    textInput?: string;
  }): void => {
    const event: NotificationEvent = {
      kind: 'action-response',
      identifier: args.identifier,
      actionIdentifier: args.actionIdentifier,
      textInput: args.textInput ?? null,
      at: new Date(),
    };

    setEvents((prev) => {
      const updated = [event, ...prev];
      return updated.slice(0, EVENT_LOG_CAP);
    });
  };

  return {
    permissions,
    pending,
    delivered,
    events,
    request,
    schedule,
    cancel,
    cancelAll,
    remove,
    clearAll,
    refresh,
    invokeAction,
    error,
  };
}

// Helper functions
function mapPermissions(result: any): PermissionsState {
  const status = result.status;
  const ios = result.ios || {};

  let mappedStatus: PermissionsState['status'] = 'notDetermined';

  if (status === 'granted') {
    mappedStatus = 'authorized';
  } else if (status === 'denied') {
    mappedStatus = 'denied';
  } else if (status === 'undetermined') {
    mappedStatus = 'notDetermined';
  } else if (status === 'provisional') {
    mappedStatus = 'provisional';
  } else if (status === 'ephemeral') {
    mappedStatus = 'ephemeral';
  }

  return {
    status: mappedStatus,
    alerts: ios.allowsAlert || false,
    sounds: ios.allowsSound || false,
    badges: ios.allowsBadge || false,
    criticalAlerts: ios.allowsCriticalAlerts || false,
    timeSensitive:
      Platform.OS === 'ios' && Platform.Version >= 15
        ? ios.allowsDisplayInNotificationCenter || false
        : null,
  };
}

function summarizeTrigger(trigger: any): string {
  if (!trigger) {
    return 'immediate';
  }

  if (trigger.seconds !== undefined) {
    return `in ${trigger.seconds}s`;
  }

  if (trigger.date) {
    return `at ${new Date(trigger.date).toLocaleTimeString()}`;
  }

  if (trigger.hour !== undefined && trigger.minute !== undefined) {
    const h = String(trigger.hour).padStart(2, '0');
    const m = String(trigger.minute).padStart(2, '0');
    return `daily ${h}:${m}`;
  }

  if (trigger.type === 'location') {
    return 'on region entry';
  }

  return 'unknown';
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
