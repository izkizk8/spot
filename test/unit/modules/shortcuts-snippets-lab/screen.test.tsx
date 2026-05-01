/**
 * Shortcuts Snippets Lab Screen Test (iOS)
 * Feature: 072-shortcuts-snippets
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

const baseStore = {
  info: {
    available: true,
    supportedSnippetTypes: ['confirmation', 'result'] as const,
    donatedCount: 2,
  },
  shortcuts: [],
  activeSnippet: null,
  loading: false,
  lastError: null,
  refresh: jest.fn(),
  donateShortcut: jest.fn(),
  simulateSnippet: jest.fn(),
  addVoiceShortcut: jest.fn(),
};

const mockUseShortcutsSnippets = jest.fn(() => baseStore);

jest.mock('@/modules/shortcuts-snippets-lab/hooks/useShortcutsSnippets', () => ({
  useShortcutsSnippets: mockUseShortcutsSnippets,
}));

describe('ShortcutsSnippetsLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/shortcuts-snippets-lab/screen').default;
    render(<Screen />);
    expect(screen.getAllByText(/Shortcuts Capability/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Donated Shortcuts/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Snippet Preview/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Setup/i).length).toBeGreaterThan(0);
  });
});
