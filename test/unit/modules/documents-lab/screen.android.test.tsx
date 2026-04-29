/**
 * Tests for Documents Lab Screen (Android variant) — feature 032 / T041.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';

jest.mock('@/native/quicklook', () => ({
  __esModule: true,
  bridge: { present: jest.fn(), isAvailable: () => false },
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

import DocumentsLabScreenAndroid from '@/modules/documents-lab/screen.android';

describe('DocumentsLabScreenAndroid', () => {
  it('renders all panels including IOSOnlyBanner and QuickLookFallback', async () => {
    render(<DocumentsLabScreenAndroid />);
    await waitFor(() => expect(screen.getByText('Open documents')).toBeTruthy());
    expect(screen.getByText('Bundled samples')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText(/iOS-only/i)).toBeTruthy();
    expect(screen.getByText(/Quick Look preview is only available on iOS/)).toBeTruthy();
    await act(async () => {});
  });
});
