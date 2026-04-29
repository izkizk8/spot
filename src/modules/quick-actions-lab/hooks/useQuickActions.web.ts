/**
 * useQuickActions — web stub. No-op shape, never imports the native bridge.
 * Feature: 039-quick-actions
 */

import { useState } from 'react';

import type { InvocationEvent, QuickActionDefinition } from '../types';

export interface UseQuickActionsResult {
  lastInvoked: InvocationEvent | null;
  setItems: (items: readonly QuickActionDefinition[]) => Promise<void>;
  clearItems: () => Promise<void>;
  getItems: () => Promise<readonly QuickActionDefinition[]>;
}

export function useQuickActions(): UseQuickActionsResult {
  const [lastInvoked] = useState<InvocationEvent | null>(null);
  return {
    lastInvoked,
    setItems: async () => undefined,
    clearItems: async () => undefined,
    getItems: async () => [],
  };
}
