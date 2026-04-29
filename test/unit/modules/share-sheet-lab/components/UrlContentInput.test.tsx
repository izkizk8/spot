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

  it('valid https URL does not show error', () => {
    render(<UrlContentInput value="https://expo.dev" onChange={jest.fn()} />);
    expect(screen.queryByText(/Invalid URL/i)).toBeNull();
  });

  it('valid http URL does not show error', () => {
    render(<UrlContentInput value="http://example.com" onChange={jest.fn()} />);
    expect(screen.queryByText(/Invalid URL/i)).toBeNull();
  });

  it('empty URL shows inline error', () => {
    render(<UrlContentInput value="" onChange={jest.fn()} />);
    expect(screen.getByText(/Invalid URL/i)).toBeTruthy();
  });

  it('malformed URL shows inline error', () => {
    render(<UrlContentInput value="not-a-url" onChange={jest.fn()} />);
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
