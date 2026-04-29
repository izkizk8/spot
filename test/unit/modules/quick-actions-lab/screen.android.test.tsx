/**
 * Quick Actions screen.android tests — banner only, no native bridge call.
 * Feature: 039-quick-actions
 */

jest.mock('expo-quick-actions', () => ({
  __esModule: true,
  setItems: jest.fn(),
  getItems: jest.fn().mockResolvedValue([]),
  getInitial: jest.fn().mockResolvedValue(null),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  clearItems: jest.fn().mockResolvedValue(undefined),
}));

import { render } from '@testing-library/react-native';
import * as QA from 'expo-quick-actions';
import React from 'react';

import QuickActionsLabAndroidScreen from '@/modules/quick-actions-lab/screen.android';

const qaMock = QA as unknown as { setItems: jest.Mock; addListener: jest.Mock };

describe('QuickActionsLab screen (android)', () => {
  beforeEach(() => {
    qaMock.setItems.mockClear();
    qaMock.addListener.mockClear();
  });

  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<QuickActionsLabAndroidScreen />);
    expect(getByTestId('quick-actions-ios-only-banner')).toBeTruthy();
  });

  it('does not invoke native bridge methods', () => {
    render(<QuickActionsLabAndroidScreen />);
    expect(qaMock.setItems).not.toHaveBeenCalled();
    expect(qaMock.addListener).not.toHaveBeenCalled();
  });
});
