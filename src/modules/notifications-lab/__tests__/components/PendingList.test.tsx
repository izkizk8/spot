import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PendingList } from '../../components/PendingList';

describe('PendingList', () => {
  it('renders empty state when no pending', () => {
    const { getByText } = render(
      <PendingList pending={[]} onCancel={jest.fn()} onCancelAll={jest.fn()} />,
    );
    expect(getByText(/no pending/i)).toBeTruthy();
  });

  it('renders N rows for N pending notifications', () => {
    const pending = [
      { identifier: 'n1', title: 'Title 1', triggerSummary: 'immediate' },
      { identifier: 'n2', title: 'Title 2', triggerSummary: 'in 30s' },
    ];
    const { getByText } = render(
      <PendingList pending={pending} onCancel={jest.fn()} onCancelAll={jest.fn()} />,
    );
    expect(getByText(/Title 1/)).toBeTruthy();
    expect(getByText(/Title 2/)).toBeTruthy();
  });

  it('calls onCancel with identifier', () => {
    const onCancel = jest.fn();
    const pending = [
      { identifier: 'n1', title: 'Title 1', triggerSummary: 'immediate' },
    ];
    const { getByText } = render(
      <PendingList pending={pending} onCancel={onCancel} onCancelAll={jest.fn()} />,
    );
    fireEvent.press(getByText(/cancel/i));
    expect(onCancel).toHaveBeenCalledWith('n1');
  });

  it('calls onCancelAll', () => {
    const onCancelAll = jest.fn();
    const pending = [
      { identifier: 'n1', title: 'Title 1', triggerSummary: 'immediate' },
    ];
    const { getByText } = render(
      <PendingList pending={pending} onCancel={jest.fn()} onCancelAll={onCancelAll} />,
    );
    fireEvent.press(getByText(/cancel all/i));
    expect(onCancelAll).toHaveBeenCalled();
  });
});
