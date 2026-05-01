/**
 * Tests for Documents Lab Screen (Web variant) — feature 032 / T042.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';

const mockIosBridgePresent = jest.fn();
jest.mock('@/native/quicklook', () => {
  // Track that this module is NOT pulled in by web bundle at evaluation time.
  // (Jest resolves it because we're testing the web screen variant which
  //  uses platform-suffixed resolution at runtime; the assertion below
  //  inspects the source instead.)
  return {
    __esModule: true,
    bridge: { present: mockIosBridgePresent, isAvailable: () => false },
  };
});
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

import DocumentsLabScreenWeb from '@/modules/documents-lab/screen.web';

describe('DocumentsLabScreenWeb', () => {
  it('renders all panels including IOSOnlyBanner and QuickLookFallback', async () => {
    render(<DocumentsLabScreenWeb />);
    await waitFor(() => expect(screen.getByText('Open documents')).toBeTruthy());
    expect(screen.getByText('Bundled samples')).toBeTruthy();
    expect(screen.getByText(/iOS-only/i)).toBeTruthy();
    expect(screen.getByText(/Quick Look preview is only available on iOS/)).toBeTruthy();
    await act(async () => {});
  });

  it('source code does NOT statically import "@/native/quicklook" (SC-007 carryover)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/documents-lab/screen.web.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/from\s+['"]@\/native\/quicklook['"]/);
  });
});
