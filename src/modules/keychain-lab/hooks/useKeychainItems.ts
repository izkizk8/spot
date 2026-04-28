/**
 * useKeychainItems hook — manages keychain items list and operations.
 *
 * Exposes: items, loading, error, refresh, addItem, revealItem, deleteItem.
 * Never caches cleartext in hook state (NFR-004).
 * Cancellation produces zero warns/errors (NFR-006).
 * mountedRef guards setState after unmount (021/022 pattern).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as keychainStore from '../keychain-store';
import type { AddItemInput, KeychainItemMeta, KeychainResult } from '../types';

export interface UseKeychainItems {
  items: KeychainItemMeta[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  addItem(input: AddItemInput): Promise<KeychainResult>;
  revealItem(id: string): Promise<string | null>;
  deleteItem(id: string): Promise<KeychainResult>;
}

export function useKeychainItems(): UseKeychainItems {
  const [items, setItems] = useState<KeychainItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadItems = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    const result = await keychainStore.list();

    if (!mountedRef.current) return;

    if (result === null) {
      setError('Failed to load keychain items');
      setItems([]);
    } else {
      setItems(result);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      await loadItems();
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [loadItems]);

  async function refresh(): Promise<void> {
    await loadItems();
  }

  async function addItem(input: AddItemInput): Promise<KeychainResult> {
    const result = await keychainStore.add(input);

    if (!mountedRef.current) return result;

    if (result.kind === 'ok') {
      // Refresh the list
      const updatedItems = await keychainStore.list();
      if (mountedRef.current && updatedItems) {
        setItems(updatedItems);
        setError(null);
      }
    } else if (result.kind !== 'cancelled') {
      // Don't set error state for cancellation
      if (result.kind === 'error') {
        setError(result.message);
      } else {
        setError(`Failed to add item: ${result.kind}`);
      }
    }

    return result;
  }

  async function revealItem(id: string): Promise<string | null> {
    // Get cleartext from store; never cache it in hook state
    const value = await keychainStore.get(id);
    return value;
  }

  async function deleteItem(id: string): Promise<KeychainResult> {
    await keychainStore.deleteItem(id);

    if (!mountedRef.current) return { kind: 'ok' };

    // Refresh the list
    const updatedItems = await keychainStore.list();
    if (mountedRef.current && updatedItems) {
      setItems(updatedItems);
      setError(null);
    }

    // Check if item was actually deleted
    const stillExists = updatedItems?.some((item) => item.id === id);
    if (stillExists) {
      return { kind: 'error', message: 'Failed to delete item' };
    }

    return { kind: 'ok' };
  }

  return {
    items,
    loading,
    error,
    refresh,
    addItem,
    revealItem,
    deleteItem,
  };
}
