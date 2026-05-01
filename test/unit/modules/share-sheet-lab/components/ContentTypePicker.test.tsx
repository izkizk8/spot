/**
 * Tests for ContentTypePicker — feature 033 / T014.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ContentTypePicker from '@/modules/share-sheet-lab/components/ContentTypePicker';

describe('ContentTypePicker', () => {
  it('renders 4 segments labelled Text / URL / Image / File', () => {
    render(<ContentTypePicker value='text' onChange={() => {}} />);
    expect(screen.getByText('Text')).toBeTruthy();
    expect(screen.getByText('URL')).toBeTruthy();
    expect(screen.getByText('Image')).toBeTruthy();
    expect(screen.getByText('File')).toBeTruthy();
  });

  it('calls onChange with the corresponding content type when each segment is pressed', () => {
    const onChange = jest.fn<void, ['text' | 'url' | 'image' | 'file']>();
    render(<ContentTypePicker value='text' onChange={onChange} />);

    fireEvent.press(screen.getByText('URL'));
    fireEvent.press(screen.getByText('Image'));
    fireEvent.press(screen.getByText('File'));
    fireEvent.press(screen.getByText('Text'));

    expect(onChange).toHaveBeenNthCalledWith(1, 'url');
    expect(onChange).toHaveBeenNthCalledWith(2, 'image');
    expect(onChange).toHaveBeenNthCalledWith(3, 'file');
    expect(onChange).toHaveBeenNthCalledWith(4, 'text');
  });

  it('marks the active segment with accessibilityState.selected === true', () => {
    const { toJSON } = render(<ContentTypePicker value='image' onChange={() => {}} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"selected":true');
  });
});
