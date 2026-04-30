/**
 * Unit tests: handoff-lab screen (Android) — T016 / US7.
 *
 * Validates the Android screen renders IOSOnlyBanner only and makes no native calls.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as handoffMock from '@/native/handoff';

// Mock the native bridge to ensure it's never called
jest.mock('@/native/handoff', () => ({
  isAvailable: false,
  setCurrent: jest.fn(),
  resignCurrent: jest.fn(),
  getCurrent: jest.fn(),
  addContinuationListener: jest.fn(),
}));

import AndroidScreen from '@/modules/handoff-lab/screen.android';

describe('handoff-lab screen (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders IOSOnlyBanner inside a ThemedView page wrapper', () => {
    const { getAllByText } = render(<AndroidScreen />);
    // Should find the iOS-only message
    const iosElements = getAllByText(/iOS/);
    expect(iosElements.length).toBeGreaterThan(0);
  });

  it('does not call any native bridge methods', () => {
    render(<AndroidScreen />);
    expect(handoffMock.setCurrent).not.toHaveBeenCalled();
    expect(handoffMock.resignCurrent).not.toHaveBeenCalled();
    expect(handoffMock.getCurrent).not.toHaveBeenCalled();
    expect(handoffMock.addContinuationListener).not.toHaveBeenCalled();
  });
});
