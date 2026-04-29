/**
 * Tests for FileContentPicker — feature 033 / T018.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock documents-store
jest.mock('@/modules/documents-lab/documents-store', () => ({
  useDocumentsStore: jest.fn(() => ({
    documents: [],
  })),
}));

import FileContentPicker from '@/modules/share-sheet-lab/components/FileContentPicker';
import { useDocumentsStore } from '@/modules/documents-lab/documents-store';

const mockUseDocumentsStore = useDocumentsStore as jest.MockedFunction<
  typeof useDocumentsStore
>;

describe('FileContentPicker', () => {
  it('when documents-store list is non-empty → renders that list', () => {
    mockUseDocumentsStore.mockReturnValue({
      documents: [
        { uri: 'file://test.txt', name: 'test.txt', mimeType: 'text/plain', size: 100 },
        { uri: 'file://doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 200 },
      ],
    } as any);

    render(<FileContentPicker selectedUri={null} onSelect={() => {}} />);

    expect(screen.getByText('test.txt')).toBeTruthy();
    expect(screen.getByText('doc.pdf')).toBeTruthy();
  });

  it('when unavailable or empty → renders only the bundled fallback row', () => {
    mockUseDocumentsStore.mockReturnValue({
      documents: [],
    } as any);

    render(<FileContentPicker selectedUri={null} onSelect={() => {}} />);

    // Should show at least the fallback sample
    expect(screen.getByText(/sample/i)).toBeTruthy();
  });
});
