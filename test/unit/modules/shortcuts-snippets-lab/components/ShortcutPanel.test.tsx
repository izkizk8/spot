/**
 * ShortcutPanel Tests — Feature 072
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import ShortcutPanel from '@/modules/shortcuts-snippets-lab/components/ShortcutPanel';

describe('ShortcutPanel', () => {
  const noop = jest.fn();

  it('shows empty state when no shortcuts', () => {
    render(
      <ShortcutPanel
        shortcuts={[]}
        onSimulateSnippet={noop}
        onAddVoiceShortcut={noop}
        loading={false}
      />,
    );
    expect(screen.getByText(/Donated Shortcuts/i)).toBeTruthy();
    expect(screen.getByText(/No shortcuts/i)).toBeTruthy();
  });

  it('renders a donated shortcut phrase', () => {
    const shortcuts = [
      {
        id: 'sc1',
        phrase: 'Order my coffee',
        intentType: 'OrderCoffeeIntent',
        status: 'pending' as const,
        snippetType: null,
        createdAt: 1,
      },
    ];
    render(
      <ShortcutPanel
        shortcuts={shortcuts}
        onSimulateSnippet={noop}
        onAddVoiceShortcut={noop}
        loading={false}
      />,
    );
    expect(screen.getByText('Order my coffee')).toBeTruthy();
  });
});
