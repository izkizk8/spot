/**
 * Tests for BulkActionsCard — feature 031 / T023.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import BulkActionsCard from '@/modules/spotlight-lab/components/BulkActionsCard';

describe('BulkActionsCard', () => {
  it('renders both CTA labels "Index all" and "Remove all from index" (FR-040)', () => {
    render(
      <BulkActionsCard pending={false} onIndexAll={() => undefined} onRemoveAll={() => undefined} />,
    );
    expect(screen.getByText(/index all/i)).toBeTruthy();
    expect(screen.getByText(/remove all/i)).toBeTruthy();
  });

  it('tapping "Index all" calls onIndexAll exactly once (FR-041)', () => {
    const onIndexAll = jest.fn();
    render(
      <BulkActionsCard pending={false} onIndexAll={onIndexAll} onRemoveAll={() => undefined} />,
    );
    fireEvent.press(screen.getByText(/index all/i));
    expect(onIndexAll).toHaveBeenCalledTimes(1);
  });

  it('tapping "Remove all from index" calls onRemoveAll exactly once (FR-042)', () => {
    const onRemoveAll = jest.fn();
    render(
      <BulkActionsCard pending={false} onIndexAll={() => undefined} onRemoveAll={onRemoveAll} />,
    );
    fireEvent.press(screen.getByText(/remove all/i));
    expect(onRemoveAll).toHaveBeenCalledTimes(1);
  });

  it('both CTAs are disabled while pending === true (FR-043)', () => {
    render(
      <BulkActionsCard pending={true} onIndexAll={() => undefined} onRemoveAll={() => undefined} />,
    );
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    }
  });

  it('pending indicator is visible while pending', () => {
    render(
      <BulkActionsCard pending={true} onIndexAll={() => undefined} onRemoveAll={() => undefined} />,
    );
    // Should show some loading indicator (ActivityIndicator or text)
    expect(
      screen.getByText(/loading|working|pending/i) || screen.getByTestId('activity-indicator'),
    ).toBeTruthy();
  });

  it('renders without crashing when pending is false', () => {
    const { toJSON } = render(
      <BulkActionsCard pending={false} onIndexAll={() => undefined} onRemoveAll={() => undefined} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
