/**
 * Tests for FilesList — feature 032 / T027.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/native/quicklook', () => ({
  __esModule: true,
  bridge: { present: jest.fn(), isAvailable: () => true },
}));
jest.mock('expo-sharing', () => ({
  __esModule: true,
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

import FilesList from '@/modules/documents-lab/components/FilesList';
import type { DocumentEntry } from '@/modules/documents-lab/documents-store';

function makeEntry(id: string, name: string, mimeType = 'text/plain'): DocumentEntry {
  return {
    id,
    name,
    uri: `file:///tmp/${name}`,
    mimeType,
    size: 100,
    addedAt: '2026-04-29T00:00:00Z',
    source: 'picker',
  };
}

describe('FilesList', () => {
  it('renders empty-state "No files yet" for filter=all and no entries', () => {
    render(<FilesList entries={[]} filter="all" onRemove={() => {}} />);
    expect(screen.getByText('No files yet')).toBeTruthy();
  });

  it('renders empty-state per filter (images / text / pdf)', () => {
    const cases: Array<{ f: 'images' | 'text' | 'pdf'; copy: RegExp }> = [
      { f: 'images', copy: /No image files/i },
      { f: 'text', copy: /No text files/i },
      { f: 'pdf', copy: /No PDF files/i },
    ];
    cases.forEach(({ f, copy }) => {
      const { unmount } = render(<FilesList entries={[]} filter={f} onRemove={() => {}} />);
      expect(screen.getByText(copy)).toBeTruthy();
      unmount();
    });
  });

  it('renders 1 row when 1 entry passed', () => {
    const e = makeEntry('a', 'one.txt');
    render(<FilesList entries={[e]} filter="all" onRemove={() => {}} />);
    expect(screen.getByText('one.txt')).toBeTruthy();
  });

  it('renders N rows newest-first (last appended renders first)', () => {
    const a = makeEntry('a', 'first.txt');
    const b = makeEntry('b', 'second.txt');
    const c = makeEntry('c', 'third.txt');
    render(<FilesList entries={[a, b, c]} filter="all" onRemove={() => {}} />);
    const tree = JSON.stringify(
      render(<FilesList entries={[a, b, c]} filter="all" onRemove={() => {}} />).toJSON(),
    );
    // third.txt should appear before first.txt in the rendered output
    expect(tree.indexOf('third.txt')).toBeLessThan(tree.indexOf('first.txt'));
  });
});
