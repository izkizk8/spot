/**
 * SetupGuide Tests — Feature 072
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import SetupGuide from '@/modules/shortcuts-snippets-lab/components/SetupGuide';

describe('SetupGuide', () => {
  it('renders the Setup Guide title', () => {
    render(<SetupGuide />);
    expect(screen.getAllByText(/Setup Guide/i).length).toBeGreaterThan(0);
  });

  it('mentions Siri & Shortcuts capability', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/Siri.*Shortcuts/i)).toBeTruthy();
  });

  it('mentions INUIAddVoiceShortcutViewController', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/INUIAddVoiceShortcutViewController/i)).toBeTruthy();
  });
});
