/**
 * Root layout (_layout.tsx) tests — useQuickActions wired in.
 * Feature: 039-quick-actions
 */

jest.mock('@/modules/quick-actions-lab/hooks/useQuickActions', () => ({
  useQuickActions: jest.fn(() => ({
    lastInvoked: null,
    setItems: jest.fn(),
    clearItems: jest.fn(),
    getItems: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

jest.mock('@/components/app-tabs', () => ({
  __esModule: true,
  default: () => null,
}));

import { render } from '@testing-library/react-native';
import React from 'react';

import TabLayout from '@/app/_layout';
import { useQuickActions } from '@/modules/quick-actions-lab/hooks/useQuickActions';

describe('Root layout', () => {
  beforeEach(() => {
    (useQuickActions as jest.Mock).mockClear();
  });

  it('invokes useQuickActions() on mount', () => {
    render(<TabLayout />);
    expect(useQuickActions).toHaveBeenCalled();
  });
});
