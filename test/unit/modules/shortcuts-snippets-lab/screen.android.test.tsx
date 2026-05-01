/**
 * Shortcuts Snippets Lab Screen Test (Android)
 * Feature: 072-shortcuts-snippets
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import Screen from '@/modules/shortcuts-snippets-lab/screen.android';

describe('ShortcutsSnippetsLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Shortcuts Capability/i)).toBeNull();
  });
});
