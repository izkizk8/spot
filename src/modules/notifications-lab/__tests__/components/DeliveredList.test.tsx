import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DeliveredList } from '../../components/DeliveredList';

describe('DeliveredList', () => {
  it('renders empty state when no delivered', () => {
    const { getByText } = render(
      <DeliveredList delivered={[]} onRemove={jest.fn()} onClearAll={jest.fn()} />,
    );
    expect(getByText(/no delivered/i)).toBeTruthy();
  });

  it('renders N rows for N delivered notifications', () => {
    const delivered = [
      { identifier: 'n1', title: 'Title 1', deliveredAt: new Date() },
      { identifier: 'n2', title: 'Title 2', deliveredAt: new Date() },
    ];
    const { getByText } = render(
      <DeliveredList delivered={delivered} onRemove={jest.fn()} onClearAll={jest.fn()} />,
    );
    expect(getByText(/Title 1/)).toBeTruthy();
    expect(getByText(/Title 2/)).toBeTruthy();
  });

  it('calls onRemove with identifier', () => {
    const onRemove = jest.fn();
    const delivered = [{ identifier: 'n1', title: 'Title 1', deliveredAt: new Date() }];
    const { getByText } = render(
      <DeliveredList delivered={delivered} onRemove={onRemove} onClearAll={jest.fn()} />,
    );
    fireEvent.press(getByText(/remove/i));
    expect(onRemove).toHaveBeenCalledWith('n1');
  });

  it('calls onClearAll', () => {
    const onClearAll = jest.fn();
    const delivered = [{ identifier: 'n1', title: 'Title 1', deliveredAt: new Date() }];
    const { getByText } = render(
      <DeliveredList delivered={delivered} onRemove={jest.fn()} onClearAll={onClearAll} />,
    );
    fireEvent.press(getByText(/clear all/i));
    expect(onClearAll).toHaveBeenCalled();
  });
});
