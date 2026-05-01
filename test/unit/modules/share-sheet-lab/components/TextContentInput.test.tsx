/**
 * Tests for TextContentInput — feature 033 / T015.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TextContentInput from '@/modules/share-sheet-lab/components/TextContentInput';

describe('TextContentInput', () => {
  it('renders with default value "Hello from spot showcase"', () => {
    render(<TextContentInput value='Hello from spot showcase' onChange={() => {}} />);
    const input = screen.getByDisplayValue('Hello from spot showcase');
    expect(input).toBeTruthy();
  });

  it('multiline prop is true', () => {
    const { getByDisplayValue } = render(
      <TextContentInput value='Hello from spot showcase' onChange={() => {}} />,
    );
    const input = getByDisplayValue('Hello from spot showcase');
    expect(input.props.multiline).toBe(true);
  });

  it('onChange propagates edited text', () => {
    const onChange = jest.fn();
    render(<TextContentInput value='Hello from spot showcase' onChange={onChange} />);

    const input = screen.getByDisplayValue('Hello from spot showcase');
    fireEvent.changeText(input, 'New text content');

    expect(onChange).toHaveBeenCalledWith('New text content');
  });
});
