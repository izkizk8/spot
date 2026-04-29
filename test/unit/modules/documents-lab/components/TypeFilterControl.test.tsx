/**
 * Tests for TypeFilterControl — feature 032 / T029.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TypeFilterControl from '@/modules/documents-lab/components/TypeFilterControl';
import type { DocumentFilter } from '@/modules/documents-lab/mime-types';

describe('TypeFilterControl', () => {
  it('renders 4 segments labelled All / Images / Text / PDF', () => {
    render(<TypeFilterControl value="all" onChange={() => {}} />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Images')).toBeTruthy();
    expect(screen.getByText('Text')).toBeTruthy();
    expect(screen.getByText('PDF')).toBeTruthy();
  });

  it('calls onChange with the corresponding filter value when each segment is pressed', () => {
    const onChange = jest.fn<void, [DocumentFilter]>();
    render(<TypeFilterControl value="all" onChange={onChange} />);

    fireEvent.press(screen.getByText('Images'));
    fireEvent.press(screen.getByText('Text'));
    fireEvent.press(screen.getByText('PDF'));
    fireEvent.press(screen.getByText('All'));

    expect(onChange).toHaveBeenNthCalledWith(1, 'images');
    expect(onChange).toHaveBeenNthCalledWith(2, 'text');
    expect(onChange).toHaveBeenNthCalledWith(3, 'pdf');
    expect(onChange).toHaveBeenNthCalledWith(4, 'all');
  });

  it('marks the active segment with accessibilityState.selected === true', () => {
    const { toJSON } = render(<TypeFilterControl value="text" onChange={() => {}} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"selected":true');
  });
});
