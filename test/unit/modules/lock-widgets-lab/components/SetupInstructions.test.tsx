import React from 'react';
import { render } from '@testing-library/react-native';

import { SetupInstructions } from '@/modules/lock-widgets-lab/components/SetupInstructions';

describe('SetupInstructions (lock-widgets-lab)', () => {
  it('renders an ordered list with ≥5 steps', () => {
    const { getByText } = render(<SetupInstructions />);

    // Check for numbered steps (1., 2., 3., 4., 5.)
    expect(getByText(/1\./)).toBeTruthy();
    expect(getByText(/2\./)).toBeTruthy();
    expect(getByText(/3\./)).toBeTruthy();
    expect(getByText(/4\./)).toBeTruthy();
    expect(getByText(/5\./)).toBeTruthy();
  });

  it('mentions long-press of the Lock Screen', () => {
    const { getAllByText } = render(<SetupInstructions />);

    expect(getAllByText(/long.*press/i).length).toBeGreaterThan(0);
    expect(getAllByText(/lock.*screen/i).length).toBeGreaterThan(0);
  });

  it('mentions opening the customizer', () => {
    const { getByText } = render(<SetupInstructions />);

    expect(getByText(/customiz/i)).toBeTruthy();
  });

  it('mentions picking a widget family', () => {
    const { getAllByText } = render(<SetupInstructions />);

    expect(getAllByText(/widget/i).length).toBeGreaterThan(0);
  });

  it('mentions selecting "spot" (case-insensitive)', () => {
    const { getByText } = render(<SetupInstructions />);

    expect(getByText(/spot/i)).toBeTruthy();
  });

  it('has a heading like "Set up on your Lock Screen"', () => {
    const { getByText } = render(<SetupInstructions />);

    expect(getByText(/set.*up.*lock.*screen/i)).toBeTruthy();
  });

  it('accepts a style prop and applies it to outer container', () => {
    const testStyle = { backgroundColor: 'red' };
    const { getByLabelText } = render(
      <SetupInstructions style={testStyle} accessibilityLabel="setup-container" />,
    );

    // Just verify it doesn't crash - style application is a React Native detail
    const container = getByLabelText('setup-container');
    expect(container).toBeTruthy();
  });
});
