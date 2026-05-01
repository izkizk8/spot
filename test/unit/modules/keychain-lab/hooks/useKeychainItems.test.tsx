/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';

// Import hook and mock after React is loaded
const useKeychainItems = require('@/modules/keychain-lab/hooks/useKeychainItems').useKeychainItems;

describe('useKeychainItems', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    const mock = require('@test/__mocks__/native-keychain');
    mock.__reset();

    // Set up console spy fresh for each test
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('loads items from the store on initial mount', async () => {
    const mock = require('@test/__mocks__/native-keychain');

    // Pre-populate store with both item and index
    await mock.keychain.addItem({
      label: 'key1',
      value: 'value1',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    // Add the index entry
    const index = {
      version: 1,
      items: [
        {
          id: 'key1',
          label: 'key1',
          accessibilityClass: 'whenUnlocked' as const,
          biometryRequired: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    await mock.keychain.addItem({
      label: 'spot.keychain.lab.index',
      value: JSON.stringify(index),
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    const { result } = renderHook(() => useKeychainItems());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);

    // Wait for load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].label).toBe('key1');
    expect(result.current.error).toBeNull();
  });

  it('sets error state if initial load fails', async () => {
    const mock = require('@test/__mocks__/native-keychain');
    mock.__setNextResult({ kind: 'error', message: 'Keychain locked' });

    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toEqual([]);
  });

  it('addItem updates the list and resolves with KeychainResult', async () => {
    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const addResult = await result.current.addItem({
      label: 'new-key',
      value: 'new-value',
      accessibilityClass: 'whenUnlockedThisDeviceOnly',
      biometryRequired: true,
    });

    expect(addResult.kind).toBe('ok');

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].label).toBe('new-key');
      expect(result.current.items[0].accessibilityClass).toBe('whenUnlockedThisDeviceOnly');
      expect(result.current.items[0].biometryRequired).toBe(true);
    });
  });

  it('addItem returns cancelled without warning on user cancellation', async () => {
    consoleWarnSpy.mockClear();

    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mock = require('@test/__mocks__/native-keychain');
    mock.__setNextResult({ kind: 'cancelled' });

    const addResult = await result.current.addItem({
      label: 'cancel-key',
      value: 'cancel-value',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    expect(addResult.kind).toBe('cancelled');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('revealItem returns cleartext on ok', async () => {
    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addItem({
      label: 'reveal-key',
      value: 'secret-text',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    const revealed = await result.current.revealItem('reveal-key');
    expect(revealed).toBe('secret-text');
  });

  it('revealItem returns null on cancelled', async () => {
    consoleWarnSpy.mockClear();

    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addItem({
      label: 'auth-key',
      value: 'secret',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: true,
    });

    const mock = require('@test/__mocks__/native-keychain');
    mock.__setNextResult({ kind: 'cancelled' });

    const revealed = await result.current.revealItem('auth-key');
    expect(revealed).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('revealItem returns null on auth-failed without warning', async () => {
    consoleWarnSpy.mockClear();

    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const mock = require('@test/__mocks__/native-keychain');
    mock.__setNextResult({ kind: 'auth-failed' });

    const revealed = await result.current.revealItem('fail-key');
    expect(revealed).toBeNull();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('never holds cleartext in hook state', async () => {
    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addItem({
      label: 'ephemeral',
      value: 'cleartext-secret',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    const revealed = await result.current.revealItem('ephemeral');
    expect(revealed).toBe('cleartext-secret');

    // After reveal, the hook state should NOT contain the cleartext
    expect(JSON.stringify(result.current)).not.toContain('cleartext-secret');
  });

  it('deleteItem removes the row and tolerates not-found', async () => {
    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addItem({
      label: 'delete-me',
      value: 'value',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    const deleteResult = await result.current.deleteItem('delete-me');
    expect(deleteResult.kind).toBe('ok');

    await waitFor(() => {
      expect(result.current.items).toHaveLength(0);
    });

    // Delete again — should tolerate not-found without error state
    const deleteResult2 = await result.current.deleteItem('delete-me');
    expect(deleteResult2.kind).toBe('not-found');
    expect(result.current.error).toBeNull();
  });

  it('refresh reloads items and clears error state', async () => {
    const mock = require('@test/__mocks__/native-keychain');
    mock.__setNextResult({ kind: 'error', message: 'Initial error' });

    const { result } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Now clear the error and allow refresh to succeed
    mock.__setNextResult({
      kind: 'ok',
      value: JSON.stringify({ version: 1, items: [] }),
    });

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('guards setState after unmount with mountedRef', async () => {
    const { result, unmount } = renderHook(() => useKeychainItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start an async operation
    const addPromise = result.current.addItem({
      label: 'unmount-test',
      value: 'value',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    // Unmount immediately
    unmount();

    // Operation completes but should not call setState
    await addPromise;

    // No error should be thrown
  });
});
