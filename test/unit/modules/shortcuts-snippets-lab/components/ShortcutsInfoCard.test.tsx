/**
 * ShortcutsInfoCard Tests — Feature 072
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import ShortcutsInfoCard from '@/modules/shortcuts-snippets-lab/components/ShortcutsInfoCard';

describe('ShortcutsInfoCard', () => {
  it('shows available status when Shortcuts is available', () => {
    const info = {
      available: true,
      supportedSnippetTypes: ['confirmation', 'result'] as const,
      donatedCount: 5,
    };
    render(<ShortcutsInfoCard info={info} />);
    expect(screen.getByText(/Shortcuts Capability/i)).toBeTruthy();
    expect(screen.getByText(/Available/i)).toBeTruthy();
  });

  it('shows loading when info is null', () => {
    render(<ShortcutsInfoCard info={null} />);
    expect(screen.getByText(/Shortcuts Capability/i)).toBeTruthy();
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it('shows unavailable message when not available', () => {
    const info = {
      available: false,
      supportedSnippetTypes: [] as const,
      donatedCount: 0,
    };
    render(<ShortcutsInfoCard info={info} />);
    expect(screen.getByText(/unavailable/i)).toBeTruthy();
  });
});
