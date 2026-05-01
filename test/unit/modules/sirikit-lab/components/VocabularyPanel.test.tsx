/**
 * VocabularyPanel Tests — Feature 071
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import VocabularyPanel from '@/modules/sirikit-lab/components/VocabularyPanel';
import type { VocabularyEntry } from '@/native/sirikit.types';

describe('VocabularyPanel', () => {
  it('renders the Vocabulary heading', () => {
    const vocab: readonly VocabularyEntry[] = [];
    render(<VocabularyPanel vocabulary={vocab} />);
    expect(screen.getByText(/Vocabulary/i)).toBeTruthy();
  });

  it('shows entries when provided', () => {
    const vocab: readonly VocabularyEntry[] = [
      { term: 'spot', pronunciation: null, scope: 'user' },
      { term: 'lab', pronunciation: null, scope: 'app' },
    ];
    render(<VocabularyPanel vocabulary={vocab} />);
    expect(screen.getByText(/spot/i)).toBeTruthy();
    expect(screen.getByText(/lab/i)).toBeTruthy();
  });
});
