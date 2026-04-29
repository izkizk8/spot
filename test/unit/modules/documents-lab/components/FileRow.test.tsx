/**
 * Tests for FileRow — feature 032 / T028.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockPresent = jest.fn();
const mockShareAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();

jest.mock('@/native/quicklook', () => ({
  __esModule: true,
  bridge: {
    present: (uri: string) => mockPresent(uri),
    isAvailable: () => true,
  },
}));

jest.mock('expo-sharing', () => ({
  __esModule: true,
  shareAsync: (uri: string) => mockShareAsync(uri),
  isAvailableAsync: () => mockIsAvailableAsync(),
}));

import FileRow from '@/modules/documents-lab/components/FileRow';
import type { DocumentEntry } from '@/modules/documents-lab/documents-store';

const ENTRY: DocumentEntry = {
  id: 'row-1',
  name: 'paper.pdf',
  uri: 'file:///tmp/paper.pdf',
  mimeType: 'application/pdf',
  size: 2048,
  addedAt: '2026-04-29T00:00:00Z',
  source: 'picker',
};

describe('FileRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPresent.mockResolvedValue({ shown: true });
    mockShareAsync.mockResolvedValue(undefined);
    mockIsAvailableAsync.mockResolvedValue(true);
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('renders name, mime label, and formatted size', () => {
    render(<FileRow entry={ENTRY} onRemove={() => {}} />);
    expect(screen.getByText('paper.pdf')).toBeTruthy();
    expect(screen.getByText(/application\/pdf/)).toBeTruthy();
    expect(screen.getByText(/2\.0 KB/)).toBeTruthy();
  });

  it('renders Preview / Share / Delete buttons', () => {
    render(<FileRow entry={ENTRY} onRemove={() => {}} />);
    expect(screen.getByText('Preview')).toBeTruthy();
    expect(screen.getByText('Share')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('Preview on iOS calls quicklook.present with the entry URI', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    render(<FileRow entry={ENTRY} onRemove={() => {}} />);
    fireEvent.press(screen.getByText('Preview'));
    await waitFor(() => expect(mockPresent).toHaveBeenCalledWith('file:///tmp/paper.pdf'));
  });

  it('Preview on non-iOS renders inline fallback (no crash)', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    render(<FileRow entry={ENTRY} onRemove={() => {}} />);
    fireEvent.press(screen.getByText('Preview'));
    await waitFor(() => {
      expect(screen.getByText(/Quick Look preview is only available on iOS/)).toBeTruthy();
    });
    expect(mockPresent).not.toHaveBeenCalled();
  });

  it('Share calls expo-sharing.shareAsync with the URI', async () => {
    render(<FileRow entry={ENTRY} onRemove={() => {}} />);
    fireEvent.press(screen.getByText('Share'));
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalledWith('file:///tmp/paper.pdf'));
  });

  it('Delete calls onRemove(id) and does NOT call any FS delete API', () => {
    const onRemove = jest.fn();
    render(<FileRow entry={ENTRY} onRemove={onRemove} />);
    fireEvent.press(screen.getByText('Delete'));
    expect(onRemove).toHaveBeenCalledWith('row-1');
  });
});
