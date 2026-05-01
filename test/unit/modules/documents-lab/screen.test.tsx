/**
 * Tests for Documents Lab Screen (iOS variant) — feature 032 / T040.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';

jest.mock('@/native/quicklook', () => ({
  __esModule: true,
  bridge: { present: jest.fn(), isAvailable: () => true },
}));
jest.mock('expo-sharing', () => ({
  __esModule: true,
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('expo-document-picker', () => ({
  __esModule: true,
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn((id) => ({
      localUri: `file://bundled/${id}`,
      uri: `file://bundled/${id}`,
      downloadAsync: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import DocumentsLabScreen from '@/modules/documents-lab/screen';

describe('DocumentsLabScreen (iOS)', () => {
  it('renders PickDocumentsCard, BundledSamplesCard, TypeFilterControl, FilesList in order', async () => {
    render(<DocumentsLabScreen />);
    await waitFor(() => expect(screen.getByText('Open documents')).toBeTruthy());
    expect(screen.getByText('Bundled samples')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    await act(async () => {});
  });

  it('does NOT render IOSOnlyBanner or top-level QuickLookFallback on iOS', async () => {
    render(<DocumentsLabScreen />);
    await waitFor(() => expect(screen.getByText('Open documents')).toBeTruthy());
    expect(screen.queryByText(/iOS-only/i)).toBeNull();
    expect(screen.queryByText(/Quick Look preview is only available on iOS/)).toBeNull();
    await act(async () => {});
  });
});
