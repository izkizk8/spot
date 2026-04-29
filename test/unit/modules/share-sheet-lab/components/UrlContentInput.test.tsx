/**
 * Tests for UrlContentInput — feature 033 / T016.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react-native';

import UrlContentInput from '@/modules/share-sheet-lab/components/UrlContentInput';

describe('UrlContentInput', () => {
  afterEach(cleanup);

  it('renders with default value "https://expo.dev"', () => {
    render(<UrlContentInput value="https://expo.dev" onChange={() => {}} />);
    const input = screen.getByDisplayValue('https://expo.dev');
    expect(input).toBeTruthy();
  });

  it('valid URLs do not show error', () => {
    const onChange = jest.fn();
    
    const { unmount } = render(<UrlContentInput value="https://expo.dev" onChange={onChange} />);
    expect(screen.queryByText(/Invalid URL/i)).toBeNull();
    unmount();

    render(<UrlContentInput value="http://example.com" onChange={onChange} />);
    expect(screen.queryByText(/Invalid URL/i)).toBeNull();
  });

  it('empty or invalid URLs show inline error', () => {
    const onChange = jest.fn();
    const { rerender } = render(<UrlContentInput value="" onChange={onChange} />);
    expect(screen.getByText(/Invalid URL/i)).toBeTruthy();

    rerender(<UrlContentInput value="not-a-url" onChange={onChange} />);
    expect(screen.getByText(/Invalid URL/i)).toBeTruthy();
  });

  it('onChange propagates edited URL', () => {
    const onChange = jest.fn();
    render(<UrlContentInput value="https://expo.dev" onChange={onChange} />);

    const input = screen.getByDisplayValue('https://expo.dev');
    fireEvent.changeText(input, 'https://github.com');

    expect(onChange).toHaveBeenCalledWith('https://github.com');
  });
});
