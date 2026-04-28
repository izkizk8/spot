/**
 * Keychain store — single seam over src/native/keychain.ts.
 *
 * Owns the JSON-encoded metadata index under the fixed key
 * `spot.keychain.lab.index` (accessibility class `whenUnlocked`, no biometry).
 *
 * Applies tolerant-fallback policy: single `console.warn` per swallowed
 * bridge throw; cancellation never warned (NFR-006).
 */

import { keychain } from '@/native/keychain';
import type { AddItemInput, KeychainItemMeta, KeychainResult, MetadataIndex } from './types';

const INDEX_KEY = 'spot.keychain.lab.index';
const INDEX_VERSION = 1;

/**
 * List all items the module has created.
 * Returns null on read error (single console.warn emitted).
 * Returns empty array if index not found (first run).
 */
export async function list(): Promise<KeychainItemMeta[] | null> {
  const result = await keychain.getItem({ label: INDEX_KEY });

  if (result.kind === 'not-found') {
    return [];
  }

  if (result.kind !== 'ok' || !result.value) {
    console.warn('Failed to read keychain index:', result);
    return null;
  }

  try {
    const index: MetadataIndex = JSON.parse(result.value);
    if (index.version !== INDEX_VERSION) {
      // Version mismatch — treat as missing
      return [];
    }
    return index.items;
  } catch (error) {
    console.warn('Failed to parse keychain index:', error);
    return null;
  }
}

/**
 * Add or update an item.
 * On duplicate label, performs upsert (preserves createdAt).
 * Returns the bridge result.
 * Swallows errors with a single console.warn (except 'cancelled').
 */
export async function add(input: AddItemInput): Promise<KeychainResult> {
  // Write the actual secret
  const addResult = await keychain.addItem(input);

  if (addResult.kind === 'cancelled') {
    // Cancellation is not an error — no warn
    return addResult;
  }

  if (addResult.kind !== 'ok') {
    if (addResult.kind === 'error') {
      console.warn('Failed to add item to keychain:', addResult.message);
    } else {
      console.warn('Failed to add item to keychain:', addResult.kind);
    }
    return addResult;
  }

  // Update the metadata index
  await updateIndex(async (items) => {
    const existingIndex = items.findIndex((i) => i.id === input.label);

    const meta: KeychainItemMeta = {
      id: input.label,
      label: input.label,
      accessibilityClass: input.accessibilityClass,
      biometryRequired: input.biometryRequired,
      createdAt: existingIndex >= 0 ? items[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      items[existingIndex] = meta;
    } else {
      items.push(meta);
    }

    return items;
  });

  return { kind: 'ok' };
}

/**
 * Get the cleartext value for an item.
 * Returns null if not found or on error (single console.warn emitted).
 */
export async function get(label: string): Promise<string | null> {
  const result = await keychain.getItem({ label });

  if (result.kind === 'not-found') {
    return null;
  }

  if (result.kind === 'cancelled') {
    // User cancelled — no warn
    return null;
  }

  if (result.kind !== 'ok' || !result.value) {
    console.warn('Failed to get item from keychain:', result);
    return null;
  }

  return result.value;
}

/**
 * Delete an item.
 * Idempotent — no warning if not found.
 * Swallows errors with a single console.warn.
 */
export async function deleteItem(label: string): Promise<void> {
  const deleteResult = await keychain.deleteItem({ label });

  if (deleteResult.kind === 'not-found') {
    // Idempotent delete — just remove from index
  } else if (deleteResult.kind === 'cancelled') {
    // User cancelled — no warn
    return;
  } else if (deleteResult.kind !== 'ok') {
    if (deleteResult.kind === 'error') {
      console.warn('Failed to delete item from keychain:', deleteResult.message);
    } else {
      console.warn('Failed to delete item from keychain:', deleteResult.kind);
    }
    return;
  }

  // Update the metadata index
  await updateIndex(async (items) => {
    return items.filter((i) => i.id !== label);
  });
}

/**
 * Try to probe the access group.
 * Delegates directly to the bridge — no index mutation.
 */
export async function tryAccessGroupProbe(
  accessGroup: string,
): Promise<KeychainResult<{ bytes: number }>> {
  return keychain.tryAccessGroupProbe({ accessGroup });
}

/**
 * Update the metadata index atomically.
 * Reads current index, applies mutation, writes back.
 */
async function updateIndex(
  mutate: (items: KeychainItemMeta[]) => Promise<KeychainItemMeta[]> | KeychainItemMeta[],
): Promise<void> {
  const currentItems = (await list()) ?? [];
  const updatedItems = await mutate(currentItems);

  const index: MetadataIndex = {
    version: INDEX_VERSION,
    items: updatedItems,
  };

  const setResult = await keychain.addItem({
    label: INDEX_KEY,
    value: JSON.stringify(index),
    accessibilityClass: 'whenUnlocked',
    biometryRequired: false,
  });

  if (setResult.kind !== 'ok') {
    console.warn('Failed to update keychain index:', setResult);
  }
}
