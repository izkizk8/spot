/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import LiveObserveCard from '@/modules/homekit-lab/components/LiveObserveCard';

describe('LiveObserveCard', () => {
  it('renders the running update count', () => {
    const { getByTestId } = render(
      <LiveObserveCard
        observerActive={false}
        observerUpdateCount={7}
        canSubscribe
        onToggle={() => {}}
      />,
    );
    expect(getByTestId('homekit-live-count').props.children).toBe(7);
  });

  it('renders Subscribe / Unsubscribe based on observerActive', () => {
    const { getByText, rerender } = render(
      <LiveObserveCard
        observerActive={false}
        observerUpdateCount={0}
        canSubscribe
        onToggle={() => {}}
      />,
    );
    expect(getByText('Subscribe')).toBeTruthy();

    rerender(
      <LiveObserveCard observerActive observerUpdateCount={0} canSubscribe onToggle={() => {}} />,
    );
    expect(getByText('Unsubscribe')).toBeTruthy();
  });

  it('invokes onToggle when CTA is pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <LiveObserveCard
        observerActive={false}
        observerUpdateCount={0}
        canSubscribe
        onToggle={onToggle}
      />,
    );
    fireEvent.press(getByTestId('homekit-live-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows a hint and disables the CTA when canSubscribe=false', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <LiveObserveCard
        observerActive={false}
        observerUpdateCount={0}
        canSubscribe={false}
        onToggle={onToggle}
      />,
    );
    expect(getByTestId('homekit-live-disabled-reason')).toBeTruthy();
    fireEvent.press(getByTestId('homekit-live-toggle'));
    // Pressable with disabled doesn't fire onPress.
    expect(onToggle).not.toHaveBeenCalled();
  });
});
