/**
 * IntentSimulator Tests — Feature 071
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import IntentSimulator from '@/modules/sirikit-lab/components/IntentSimulator';
import type { IntentItem } from '@/native/sirikit.types';

describe('IntentSimulator', () => {
  it('renders the Intent Simulator heading', () => {
    render(
      <IntentSimulator intents={[]} onSimulate={jest.fn()} onHandle={jest.fn()} loading={false} />,
    );
    expect(screen.getByText(/Intent Simulator/i)).toBeTruthy();
  });

  it('renders intent items when provided', () => {
    const intents: readonly IntentItem[] = [
      {
        id: 'x1',
        domain: 'messaging',
        utterance: 'Send a message',
        status: 'pending',
        response: null,
        createdAt: 1,
      },
    ];
    render(
      <IntentSimulator
        intents={intents}
        onSimulate={jest.fn()}
        onHandle={jest.fn()}
        loading={false}
      />,
    );
    expect(screen.getByText(/Send a message/i)).toBeTruthy();
    expect(screen.getByText(/pending/i)).toBeTruthy();
  });
});
