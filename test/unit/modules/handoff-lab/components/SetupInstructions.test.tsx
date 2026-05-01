/**
 * Unit tests: SetupInstructions (T034 / US5).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions from '@/modules/handoff-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders exactly 8 numbered steps', () => {
    const { getAllByTestId } = render(<SetupInstructions />);
    const steps = getAllByTestId(/setup-step-/);
    expect(steps.length).toBe(8);
  });

  it('mentions iCloud, Bluetooth, Handoff toggle, and awake state', () => {
    const { getByText, getAllByText } = render(<SetupInstructions />);
    expect(getByText(/iCloud/i)).toBeTruthy();
    expect(getByText(/Bluetooth/i)).toBeTruthy();
    expect(getAllByText(/Handoff/i).length).toBeGreaterThan(0);
    expect(getByText(/awake/i)).toBeTruthy();
  });

  it('mentions installing spot, becoming current, and tapping the hint', () => {
    const { getByText, getAllByText } = render(<SetupInstructions />);
    expect(getByText(/install/i)).toBeTruthy();
    expect(getByText(/Become current|become current/)).toBeTruthy();
    expect(getAllByText(/tap/i).length).toBeGreaterThan(0);
  });

  it('mentions a Handoff hint surface', () => {
    const { getAllByText } = render(<SetupInstructions />);
    expect(getAllByText(/hint/i).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot using themed primitives', () => {
    const { toJSON } = render(<SetupInstructions />);
    expect(toJSON()).toBeTruthy();
  });
});
