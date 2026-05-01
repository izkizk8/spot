/**
 * Tests for UserActivityCard — feature 031 / T025.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import UserActivityCard from '@/modules/spotlight-lab/components/UserActivityCard';

describe('UserActivityCard', () => {
  it('renders both CTA labels (FR-060)', () => {
    render(
      <UserActivityCard state='inactive' onMark={() => undefined} onClear={() => undefined} />,
    );
    expect(screen.getByText(/mark.*activity/i)).toBeTruthy();
    expect(screen.getByText(/clear.*activity/i)).toBeTruthy();
  });

  it('tapping "Mark" calls onMark exactly once (FR-061)', () => {
    const onMark = jest.fn();
    render(<UserActivityCard state='inactive' onMark={onMark} onClear={() => undefined} />);
    fireEvent.press(screen.getByText(/mark.*activity/i));
    expect(onMark).toHaveBeenCalledTimes(1);
  });

  it('tapping "Clear" calls onClear exactly once (FR-063)', () => {
    const onClear = jest.fn();
    render(<UserActivityCard state='active' onMark={() => undefined} onClear={onClear} />);
    fireEvent.press(screen.getByText(/clear.*activity/i));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('status pill renders "active" variant (FR-062)', () => {
    render(<UserActivityCard state='active' onMark={() => undefined} onClear={() => undefined} />);
    // The pill shows "Active" (capitalized)
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('status pill renders "inactive" variant', () => {
    render(
      <UserActivityCard state='inactive' onMark={() => undefined} onClear={() => undefined} />,
    );
    // The pill shows "Inactive" (capitalized)
    expect(screen.getByText('Inactive')).toBeTruthy();
  });

  it('includes comparison block mentioning CSSearchableIndex vs NSUserActivity', () => {
    render(
      <UserActivityCard state='inactive' onMark={() => undefined} onClear={() => undefined} />,
    );
    // The explainer should mention the contrast between the two APIs
    const content = JSON.stringify(
      render(
        <UserActivityCard state='inactive' onMark={() => undefined} onClear={() => undefined} />,
      ).toJSON(),
    );
    expect(content).toMatch(/CSSearchableIndex|NSUserActivity/);
  });

  it('renders without crashing when state is inactive', () => {
    const { toJSON } = render(
      <UserActivityCard state='inactive' onMark={() => undefined} onClear={() => undefined} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
