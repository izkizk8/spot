/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ItemsList from '@/modules/keychain-lab/components/ItemsList';
import type { KeychainItemMeta } from '@/modules/keychain-lab/types';

describe('ItemsList', () => {
  const mockItems: KeychainItemMeta[] = [
    {
      id: 'key1',
      label: 'key1',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'key2',
      label: 'key2',
      accessibilityClass: 'whenUnlockedThisDeviceOnly',
      biometryRequired: true,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  it('renders empty-state copy when items array is empty', () => {
    const { getByText } = render(
      <ItemsList items={[]} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText(/No keychain items yet/i)).toBeTruthy();
    expect(getByText(/tap Add item to create one/i)).toBeTruthy();
  });

  it('renders N ItemRows when items has N entries', () => {
    const { getByText } = render(
      <ItemsList items={mockItems} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText('key1')).toBeTruthy();
    expect(getByText('key2')).toBeTruthy();
  });

  it('does not render empty-state when items are present', () => {
    const { queryByText } = render(
      <ItemsList items={mockItems} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(queryByText(/No keychain items yet/i)).toBeNull();
  });
});
