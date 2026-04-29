import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import TestTriggerCard from '@/modules/background-tasks-lab/components/TestTriggerCard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

describe('TestTriggerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both task identifiers verbatim (FR-050)', () => {
    render(<TestTriggerCard />);
    expect(screen.getByText(/com\.izkizk8\.spot\.refresh/)).toBeTruthy();
    expect(screen.getByText(/com\.izkizk8\.spot\.processing/)).toBeTruthy();
  });

  it('renders private-API caveat copy (FR-051)', () => {
    render(<TestTriggerCard />);
    expect(screen.getByText(/private SPI|Apple-private|never ship/i)).toBeTruthy();
  });

  it('copy-to-clipboard for refresh wires through Clipboard.setStringAsync', () => {
    render(<TestTriggerCard />);
    const btn = screen.getByLabelText('copy refresh trigger command');
    fireEvent.press(btn);
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    expect((Clipboard.setStringAsync as jest.Mock).mock.calls[0][0]).toMatch(
      /com\.izkizk8\.spot\.refresh/,
    );
  });

  it('copy-to-clipboard for processing wires through Clipboard.setStringAsync', () => {
    render(<TestTriggerCard />);
    const btn = screen.getByLabelText('copy processing trigger command');
    fireEvent.press(btn);
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    expect((Clipboard.setStringAsync as jest.Mock).mock.calls[0][0]).toMatch(
      /com\.izkizk8\.spot\.processing/,
    );
  });
});
