/**
 * useQuickActions web stub tests.
 * Feature: 039-quick-actions
 */

import { renderHook } from '@testing-library/react-native';

import { useQuickActions } from '@/modules/quick-actions-lab/hooks/useQuickActions.web';

describe('useQuickActions (web stub)', () => {
  it('returns the same shape with no-op methods', async () => {
    const { result } = renderHook(() => useQuickActions());
    expect(result.current.lastInvoked).toBeNull();
    await expect(result.current.setItems([])).resolves.toBeUndefined();
    await expect(result.current.clearItems()).resolves.toBeUndefined();
    await expect(result.current.getItems()).resolves.toEqual([]);
  });
});
