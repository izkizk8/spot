/**
 * Tests for QuickLookFallback — feature 032 / T030.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import QuickLookFallback from '@/modules/documents-lab/components/QuickLookFallback';

describe('QuickLookFallback', () => {
  it('mentions "iOS" and "Quick Look" in copy', () => {
    render(<QuickLookFallback />);
    expect(screen.getByText(/iOS/)).toBeTruthy();
    expect(screen.getByText(/Quick Look/)).toBeTruthy();
  });

  it('invokes onShare when Share button pressed', () => {
    const onShare = jest.fn();
    render(<QuickLookFallback onShare={onShare} />);
    fireEvent.press(screen.getByText('Share'));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('omits Share button when onShare prop absent', () => {
    render(<QuickLookFallback />);
    expect(screen.queryByText('Share')).toBeNull();
  });
});
