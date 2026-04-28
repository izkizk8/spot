import React from 'react';
import { render } from '@testing-library/react-native';

import { SetupInstructions } from '@/modules/standby-lab/components/SetupInstructions';

describe('SetupInstructions (standby-lab)', () => {
  it('renders ≥6 numbered steps', () => {
    const { getByText } = render(<SetupInstructions />);
    for (let i = 1; i <= 6; i++) {
      expect(getByText(new RegExp(`^${i}\\.`))).toBeTruthy();
    }
  });

  it('mentions Settings, StandBy, charging, landscape, lock, and "spot"', () => {
    const { getByText, getAllByText } = render(<SetupInstructions />);
    expect(getByText(/settings/i)).toBeTruthy();
    expect(getAllByText(/standby/i).length).toBeGreaterThan(0);
    expect(getByText(/charge|charging|charger/i)).toBeTruthy();
    expect(getByText(/landscape/i)).toBeTruthy();
    expect(getByText(/lock/i)).toBeTruthy();
    expect(getByText(/spot/i)).toBeTruthy();
  });

  it('has a heading like "Set up StandBy"', () => {
    const { getByText } = render(<SetupInstructions />);
    expect(getByText(/set up.*standby/i)).toBeTruthy();
  });

  it('accepts a style prop and renders without crashing', () => {
    const { getByLabelText } = render(
      <SetupInstructions style={{ backgroundColor: 'red' }} accessibilityLabel="setup" />,
    );
    expect(getByLabelText('setup')).toBeTruthy();
  });
});
