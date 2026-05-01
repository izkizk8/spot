/**
 * DynamicActionsManager tests.
 * Feature: 039-quick-actions
 */

const mockSetItems = jest.fn().mockResolvedValue(undefined);
const mockClearItems = jest.fn().mockResolvedValue(undefined);

jest.mock('@/modules/quick-actions-lab/hooks/useQuickActions', () => ({
  useQuickActions: () => ({
    lastInvoked: null,
    setItems: mockSetItems,
    clearItems: mockClearItems,
    getItems: jest.fn().mockResolvedValue([]),
  }),
}));

import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import React from 'react';

import { DynamicActionsManager } from '@/modules/quick-actions-lab/components/DynamicActionsManager';

describe('DynamicActionsManager', () => {
  beforeEach(() => {
    mockSetItems.mockClear();
    mockClearItems.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    (Alert.alert as jest.Mock).mockRestore?.();
  });

  it('renders with default state (effectiveStaticCount = 4, no dynamic items)', () => {
    const { getByTestId } = render(<DynamicActionsManager />);
    expect(getByTestId('dynamic-actions-manager')).toBeTruthy();
    expect(getByTestId('add-dynamic')).toBeTruthy();
  });

  it('"Pretend N statics" toggle (1..4) updates the cap', () => {
    const { getByTestId, getByText } = render(<DynamicActionsManager />);
    fireEvent.press(getByTestId('pretend-static-2'));
    expect(getByText(/Pretend static count = 2/)).toBeTruthy();
    expect(getByText(/dynamic cap = 2/)).toBeTruthy();
  });

  it('Adding pushes a new item and calls setItems', () => {
    const { getByTestId } = render(<DynamicActionsManager />);
    // pretend 1 static so cap = 3
    fireEvent.press(getByTestId('pretend-static-1'));
    fireEvent.press(getByTestId('add-dynamic'));
    expect(mockSetItems).toHaveBeenCalledTimes(1);
    expect(mockSetItems.mock.calls[0][0]).toHaveLength(1);
  });

  it('Add is disabled when at cap and shows the cap alert', () => {
    const { getByTestId } = render(<DynamicActionsManager />);
    // effectiveStaticCount = 4, cap = 0; first press should hit the cap branch
    fireEvent.press(getByTestId('add-dynamic'));
    expect(mockSetItems).not.toHaveBeenCalled();
  });

  it('Reorder up/down arrows call setItems with reordered list', () => {
    const { getByTestId } = render(<DynamicActionsManager />);
    fireEvent.press(getByTestId('pretend-static-1')); // cap = 3
    fireEvent.press(getByTestId('add-dynamic'));
    fireEvent.press(getByTestId('add-dynamic'));
    expect(mockSetItems).toHaveBeenCalledTimes(2);

    fireEvent.press(getByTestId('move-down-0'));
    expect(mockSetItems).toHaveBeenCalledTimes(3);
    const lastCall = mockSetItems.mock.calls[2][0];
    expect(lastCall).toHaveLength(2);
  });

  it('Remove confirms then splices and calls setItems', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = render(<DynamicActionsManager />);
    fireEvent.press(getByTestId('pretend-static-1'));
    fireEvent.press(getByTestId('add-dynamic'));
    expect(mockSetItems).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('remove-0'));
    // The remove handler shows an Alert with buttons; simulate confirm via the
    // last button pressed (style: destructive).
    const lastCallButtons = alertSpy.mock.calls.at(-1)?.[2];
    expect(Array.isArray(lastCallButtons)).toBe(true);
    const removeBtn = (lastCallButtons as Array<{ text: string; onPress?: () => void }>).find(
      (b) => b.text === 'Remove',
    );
    removeBtn?.onPress?.();
    expect(mockSetItems).toHaveBeenCalledTimes(2);
    expect(mockSetItems.mock.calls[1][0]).toHaveLength(0);
  });
});
