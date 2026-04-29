/**
 * Tests for PickDocumentsCard — feature 032 / T025.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  __esModule: true,
  getDocumentAsync: (opts: unknown) => mockGetDocumentAsync(opts),
}));

import PickDocumentsCard from '@/modules/documents-lab/components/PickDocumentsCard';

describe('PickDocumentsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the "Open documents" CTA', () => {
    render(<PickDocumentsCard filter="all" onAdd={() => {}} />);
    expect(screen.getByText('Open documents')).toBeTruthy();
  });

  it('calls getDocumentAsync with type derived from filter via pickerTypeForFilter (images)', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true });
    const onAdd = jest.fn();
    render(<PickDocumentsCard filter="images" onAdd={onAdd} />);
    fireEvent.press(screen.getByText('Open documents'));
    await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalledTimes(1));
    expect(mockGetDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/*', copyToCacheDirectory: true }),
    );
  });

  it('calls getDocumentAsync with undefined type for filter=all', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true });
    render(<PickDocumentsCard filter="all" onAdd={() => {}} />);
    fireEvent.press(screen.getByText('Open documents'));
    await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());
    expect(mockGetDocumentAsync.mock.calls[0][0].type).toBeUndefined();
  });

  it('does not call onAdd when the picker is cancelled', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true });
    const onAdd = jest.fn();
    render(<PickDocumentsCard filter="all" onAdd={onAdd} />);
    fireEvent.press(screen.getByText('Open documents'));
    await waitFor(() => expect(mockGetDocumentAsync).toHaveBeenCalled());
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onAdd with a DocumentEntry when a file is picked', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'paper.pdf',
          uri: 'file:///tmp/paper.pdf',
          mimeType: 'application/pdf',
          size: 12345,
        },
      ],
    });
    const onAdd = jest.fn();
    render(<PickDocumentsCard filter="all" onAdd={onAdd} />);
    fireEvent.press(screen.getByText('Open documents'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    const entry = onAdd.mock.calls[0][0];
    expect(entry.name).toBe('paper.pdf');
    expect(entry.uri).toBe('file:///tmp/paper.pdf');
    expect(entry.mimeType).toBe('application/pdf');
    expect(entry.size).toBe(12345);
    expect(entry.source).toBe('picker');
  });
});
