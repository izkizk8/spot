/**
 * IOSOnlyBanner Tests — Feature 072
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import IOSOnlyBanner from '@/modules/shortcuts-snippets-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the iOS Only Feature title', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions Shortcuts Snippets in the message', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Shortcuts Snippets/i)).toBeTruthy();
  });
});
