/**
 * useQuickActions — listens to the native bridge, fires routing &
 * mood-log side effects, exposes `setItems` / `clearItems` to the
 * Lab UI.
 *
 * Feature: 039-quick-actions
 * @see specs/039-quick-actions/contracts/bridge.md
 * @see specs/039-quick-actions/contracts/routing.md
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as QuickActions from 'expo-quick-actions';
import { router } from 'expo-router';

import type { InvocationEvent, QuickActionDefinition } from '../types';
import { appendMoodEntry } from '../mood-log';

const MAX_ITEMS = 4;

interface BridgeAction {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  params?: Record<string, unknown>;
}

function toBridgeAction(def: QuickActionDefinition): BridgeAction {
  const action: BridgeAction = {
    id: def.type,
    title: def.title,
    icon: def.iconName,
    params: { ...def.userInfo },
  };
  if (def.subtitle) action.subtitle = def.subtitle;
  return action;
}

function toInvocationEvent(action: BridgeAction): InvocationEvent {
  return {
    type: action.id,
    userInfo: { ...action.params },
    timestamp: new Date().toISOString(),
  };
}

export interface UseQuickActionsResult {
  lastInvoked: InvocationEvent | null;
  setItems: (items: readonly QuickActionDefinition[]) => Promise<void>;
  clearItems: () => Promise<void>;
  getItems: () => Promise<readonly QuickActionDefinition[]>;
}

export function useQuickActions(): UseQuickActionsResult {
  const [lastInvoked, setLastInvoked] = useState<InvocationEvent | null>(null);
  const isColdLaunchRef = useRef(true);

  const handleAction = useCallback((action: BridgeAction, isCold: boolean) => {
    const event = toInvocationEvent(action);
    setLastInvoked(event);

    if (event.type === 'add-mood-happy') {
      appendMoodEntry({
        mood: 'happy',
        source: 'quick-action',
        timestamp: event.timestamp,
      });
    }

    const route = event.userInfo.route;
    if (typeof route !== 'string' || route.length === 0) {
      if (__DEV__) {
        console.warn('[quick-actions] no route for', event.type);
      }
      return;
    }

    if (isCold) {
      router.replace(route as never);
    } else {
      router.navigate(route as never);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qa = QuickActions as unknown as {
      getInitial?: () => Promise<BridgeAction | null>;
      addListener?: (handler: (a: BridgeAction) => void) => { remove: () => void };
    };

    qa.getInitial?.()
      .then((action) => {
        if (cancelled || !action) return;
        handleAction(action, /*isCold*/ true);
        isColdLaunchRef.current = false;
      })
      .catch(() => {
        // swallow — no cold-launch event
      });

    const sub = qa.addListener?.((action) => {
      handleAction(action, /*isCold*/ isColdLaunchRef.current);
      isColdLaunchRef.current = false;
    });

    // After mount, any further invocations are warm.
    isColdLaunchRef.current = false;

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [handleAction]);

  const setItems = useCallback(async (items: readonly QuickActionDefinition[]): Promise<void> => {
    if (items.length > MAX_ITEMS) {
      throw new Error(`Quick Actions cap exceeded: ${items.length} > ${MAX_ITEMS}`);
    }
    const qa = QuickActions as unknown as {
      setItems?: (items: BridgeAction[]) => Promise<void>;
    };
    await qa.setItems?.(items.map(toBridgeAction));
  }, []);

  const clearItems = useCallback(async (): Promise<void> => {
    const qa = QuickActions as unknown as {
      clearItems?: () => Promise<void>;
      setItems?: (items: BridgeAction[]) => Promise<void>;
    };
    if (qa.clearItems) {
      await qa.clearItems();
      return;
    }
    await qa.setItems?.([]);
  }, []);

  const getItems = useCallback(async (): Promise<readonly QuickActionDefinition[]> => {
    const qa = QuickActions as unknown as {
      getItems?: () => Promise<BridgeAction[]>;
    };
    const items = (await qa.getItems?.()) ?? [];
    return items.map(
      (a): QuickActionDefinition => ({
        type: a.id,
        title: a.title,
        subtitle: a.subtitle,
        iconName: a.icon ?? '',
        userInfo: {
          route: typeof a.params?.route === 'string' ? (a.params.route as string) : '',
          ...a.params,
        },
      }),
    );
  }, []);

  return { lastInvoked, setItems, clearItems, getItems };
}
