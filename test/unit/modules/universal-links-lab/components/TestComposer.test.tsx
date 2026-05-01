/**
 * Unit tests: TestComposer — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import TestComposer, { validateUrl } from '@/modules/universal-links-lab/components/TestComposer';

describe('validateUrl', () => {
  it('rejects empty string', () => {
    expect(validateUrl('')).toBeDefined();
  });

  it('rejects garbage', () => {
    expect(validateUrl('not a url')).toBeDefined();
  });

  it('rejects non-http(s) schemes', () => {
    expect(validateUrl('ftp://example.com')).toBeDefined();
    expect(validateUrl('javascript:alert(1)')).toBeDefined();
  });

  it('accepts https and http', () => {
    expect(validateUrl('https://example.com/')).toBeUndefined();
    expect(validateUrl('http://example.com/x?y=1')).toBeUndefined();
  });
});

describe('TestComposer', () => {
  it('renders heading and dispatch button', () => {
    const { getByText, getByTestId } = render(<TestComposer onDispatch={jest.fn()} />);
    expect(getByText(/Test Composer/)).toBeTruthy();
    expect(getByTestId('dispatch-btn')).toBeTruthy();
  });

  it('calls onDispatch with the current URL when pressed', () => {
    const onDispatch = jest.fn();
    const { getByTestId } = render(<TestComposer onDispatch={onDispatch} />);
    fireEvent.press(getByTestId('dispatch-btn'));
    expect(onDispatch).toHaveBeenCalledTimes(1);
    expect(onDispatch.mock.calls[0][0]).toMatch(/^https:\/\//);
  });

  it('does not call onDispatch when the URL is invalid', () => {
    const onDispatch = jest.fn();
    const { getByTestId } = render(<TestComposer onDispatch={onDispatch} />);
    const input = getByTestId('test-url-input');
    fireEvent.changeText(input, 'not-a-url');
    fireEvent.press(getByTestId('dispatch-btn'));
    expect(onDispatch).not.toHaveBeenCalled();
  });

  it('renders the echo box when lastEchoedUrl is provided', () => {
    const { getByTestId } = render(
      <TestComposer onDispatch={jest.fn()} lastEchoedUrl='https://x.example.com/y' />,
    );
    expect(getByTestId('echo-box')).toBeTruthy();
  });
});
