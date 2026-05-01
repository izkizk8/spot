/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import LiveUpdatesCard from '@/modules/healthkit-lab/components/LiveUpdatesCard';

describe('LiveUpdatesCard', () => {
  it('shows "Inactive" and "Start observing" when observerActive is false', () => {
    const { getByTestId, getByText } = render(
      <LiveUpdatesCard observerActive={false} observerUpdateCount={0} onToggle={() => {}} />,
    );
    expect(getByTestId('healthkit-live-status').props.children).toBe('Inactive');
    expect(getByText('Start observing')).toBeTruthy();
  });

  it('shows "Active" and "Stop observing" when observerActive is true', () => {
    const { getByTestId, getByText } = render(
      <LiveUpdatesCard observerActive observerUpdateCount={3} onToggle={() => {}} />,
    );
    expect(getByTestId('healthkit-live-status').props.children).toBe('Active');
    expect(getByText('Stop observing')).toBeTruthy();
  });

  it('renders the update count', () => {
    const { getByTestId } = render(
      <LiveUpdatesCard observerActive observerUpdateCount={7} onToggle={() => {}} />,
    );
    expect(getByTestId('healthkit-live-count').props.children.join('')).toContain('7 updates');
  });

  it('invokes onToggle when the toggle button is pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <LiveUpdatesCard observerActive={false} observerUpdateCount={0} onToggle={onToggle} />,
    );
    fireEvent.press(getByTestId('healthkit-live-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
