/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ItemRow from '@/modules/keychain-lab/components/ItemRow';
import type { KeychainItemMeta } from '@/modules/keychain-lab/types';

describe('ItemRow', () => {
  const mockItem: KeychainItemMeta = {
    id: 'test-key',
    label: 'test-key',
    accessibilityClass: 'whenUnlockedThisDeviceOnly',
    biometryRequired: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('renders label', () => {
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(getByText('test-key')).toBeTruthy();
  });

  it('renders accessibility class label', () => {
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(getByText(/When Unlocked \(This Device\)/i)).toBeTruthy();
  });

  it('renders biometry badge when biometryRequired is true', () => {
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(getByText(/🔐/)).toBeTruthy();
  });

  it('renders device-only badge for *ThisDeviceOnly classes', () => {
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(getByText(/📱/)).toBeTruthy();
  });

  it('does not render device-only badge for non-ThisDeviceOnly classes', () => {
    const nonDeviceItem: KeychainItemMeta = {
      ...mockItem,
      accessibilityClass: 'whenUnlocked',
    };
    const { queryByText } = render(
      <ItemRow item={nonDeviceItem} onReveal={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(queryByText(/📱/)).toBeNull();
  });

  it('toggles Show to Hide and reveals value', async () => {
    const mockReveal = jest.fn().mockResolvedValue('secret-value');
    const { getByText, queryByText } = render(
      <ItemRow item={mockItem} onReveal={mockReveal} onDelete={jest.fn()} />,
    );

    const showButton = getByText('Show');
    fireEvent.press(showButton);

    await waitFor(() => {
      expect(mockReveal).toHaveBeenCalledWith('test-key');
      expect(getByText('secret-value')).toBeTruthy();
      expect(getByText('Hide')).toBeTruthy();
      expect(queryByText('Show')).toBeNull();
    });
  });

  it('hides value when Hide is pressed', async () => {
    const mockReveal = jest.fn().mockResolvedValue('secret-value');
    const { getByText, queryByText } = render(
      <ItemRow item={mockItem} onReveal={mockReveal} onDelete={jest.fn()} />,
    );

    // Show
    fireEvent.press(getByText('Show'));
    await waitFor(() => expect(getByText('Hide')).toBeTruthy());

    // Hide
    fireEvent.press(getByText('Hide'));
    await waitFor(() => {
      expect(queryByText('secret-value')).toBeNull();
      expect(getByText('Show')).toBeTruthy();
    });
  });

  it('renders inline message on cancelled', async () => {
    const mockReveal = jest.fn().mockResolvedValue(null);
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={mockReveal} onDelete={jest.fn()} />,
    );

    fireEvent.press(getByText('Show'));

    await waitFor(() => {
      expect(getByText(/cancelled/i)).toBeTruthy();
    });
  });

  it('renders inline message on auth-failed', async () => {
    const mockReveal = jest.fn().mockResolvedValue(null);
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={mockReveal} onDelete={jest.fn()} />,
    );

    fireEvent.press(getByText('Show'));

    await waitFor(() => {
      expect(getByText(/cancelled/i)).toBeTruthy();
    });
  });

  it('invokes Delete callback exactly once', () => {
    const mockDelete = jest.fn();
    const { getByText } = render(
      <ItemRow item={mockItem} onReveal={jest.fn()} onDelete={mockDelete} />,
    );

    fireEvent.press(getByText('Delete'));

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('test-key');
  });
});
