/**
 * Tests for BundledSamplesCard — feature 032 / T026.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn((id) => ({
      localUri: `file://bundled/${id}`,
      uri: `file://bundled/${id}`,
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

import BundledSamplesCard from '@/modules/documents-lab/components/BundledSamplesCard';
import { SAMPLES } from '@/modules/documents-lab/samples';

describe('BundledSamplesCard', () => {
  it('renders exactly 4 tiles in row-major order matching SAMPLES', () => {
    render(<BundledSamplesCard onAdd={() => {}} />);
    SAMPLES.forEach((s) => {
      expect(screen.getByText(s.name)).toBeTruthy();
    });
  });

  it('tap appends one row via onAdd', async () => {
    const onAdd = jest.fn();
    render(<BundledSamplesCard onAdd={onAdd} />);
    fireEvent.press(screen.getByText('hello.txt'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    const entry = onAdd.mock.calls[0][0];
    expect(entry.name).toBe('hello.txt');
    expect(entry.source).toBe('sample');
    expect(entry.uri).toContain('file://bundled/');
  });

  it('tapping the same tile twice appends two distinct rows', async () => {
    const onAdd = jest.fn();
    render(<BundledSamplesCard onAdd={onAdd} />);
    fireEvent.press(screen.getByText('icon.png'));
    fireEvent.press(screen.getByText('icon.png'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(2));
    const id1 = onAdd.mock.calls[0][0].id;
    const id2 = onAdd.mock.calls[1][0].id;
    expect(id1).not.toBe(id2);
  });
});
