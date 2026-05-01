import React from 'react';
import { render } from '@testing-library/react-native';

import { SetupInstructions } from '@/modules/widgets-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders an ordered list of steps when isAvailable is true', () => {
    const { getByText } = render(<SetupInstructions isAvailable={true} />);
    expect(getByText(/^1\./)).toBeTruthy();
    expect(getByText(/^2\./)).toBeTruthy();
    expect(getByText(/^3\./)).toBeTruthy();
  });

  it('mentions the widget kind name SpotShowcaseWidget literally', () => {
    const { getAllByText } = render(<SetupInstructions isAvailable={true} />);
    expect(getAllByText(/SpotShowcaseWidget/).length).toBeGreaterThan(0);
  });

  it('renders null when isAvailable is false (FR-031)', () => {
    const { toJSON } = render(<SetupInstructions isAvailable={false} />);
    expect(toJSON()).toBeNull();
  });
});
