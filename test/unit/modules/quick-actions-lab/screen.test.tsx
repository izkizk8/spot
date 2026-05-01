/**
 * Quick Actions Lab iOS screen tests.
 * Feature: 039-quick-actions
 */

const mockClearItems = jest.fn().mockResolvedValue(undefined);
const mockSetItems = jest.fn().mockResolvedValue(undefined);

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

import QuickActionsLabScreen from '@/modules/quick-actions-lab/screen';

describe('QuickActionsLabScreen (iOS)', () => {
  beforeEach(() => {
    mockClearItems.mockClear();
    mockSetItems.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders ExplainerCard, StaticActionsList, DynamicActionsManager, LastInvokedCard', () => {
    const { getByTestId } = render(<QuickActionsLabScreen />);
    expect(getByTestId('explainer-card')).toBeTruthy();
    expect(getByTestId('static-actions-list')).toBeTruthy();
    expect(getByTestId('dynamic-actions-manager')).toBeTruthy();
    expect(getByTestId('last-invoked-card')).toBeTruthy();
    expect(getByTestId('reset-button')).toBeTruthy();
  });

  it('Reset shows confirm alert; confirming calls clearItems', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = render(<QuickActionsLabScreen />);
    fireEvent.press(getByTestId('reset-button'));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    const reset = (buttons as Array<{ text: string; onPress?: () => void }>).find(
      (b) => b.text === 'Reset',
    );
    reset?.onPress?.();
    expect(mockClearItems).toHaveBeenCalledTimes(1);
  });

  it('Reset cancel is a no-op', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = render(<QuickActionsLabScreen />);
    fireEvent.press(getByTestId('reset-button'));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    const cancel = (buttons as Array<{ text: string; onPress?: () => void }>).find(
      (b) => b.text === 'Cancel',
    );
    cancel?.onPress?.();
    expect(mockClearItems).not.toHaveBeenCalled();
  });
});
