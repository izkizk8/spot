/**
 * Tests for CustomActivityToggle — feature 033 / T020.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import CustomActivityToggle from '@/modules/share-sheet-lab/components/CustomActivityToggle';

describe('CustomActivityToggle', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  it('default off', () => {
    const { toJSON } = render(<CustomActivityToggle value={false} onValueChange={() => {}} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"value":false');
  });

  it('onValueChange flips the value', () => {
    const onValueChange = jest.fn();
    render(<CustomActivityToggle value={false} onValueChange={onValueChange} />);

    const toggle = screen.getAllByRole('switch')[0];
    fireEvent(toggle, 'valueChange', true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('disabled with caption on non-iOS', () => {
    Platform.OS = 'android';

    const { toJSON } = render(<CustomActivityToggle value={false} onValueChange={() => {}} />);
    const tree = JSON.stringify(toJSON());

    expect(tree).toContain('"disabled":true');
    expect(screen.getByText(/iOS only/i)).toBeTruthy();
  });
});
