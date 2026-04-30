/**
 * Unit tests: AASAPreviewCard — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockSetStringAsync = jest.fn().mockResolvedValue(true);
jest.mock('expo-clipboard', () => ({
  setStringAsync: (s: string) => mockSetStringAsync(s),
}));

import AASAPreviewCard from '@/modules/universal-links-lab/components/AASAPreviewCard';

describe('AASAPreviewCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading and a JSON code block', () => {
    const { getByText, getByTestId } = render(
      <AASAPreviewCard bundleIdentifier="com.example.app" />,
    );
    expect(getByText(/AASA Preview/)).toBeTruthy();
    const block = getByTestId('aasa-json-block');
    expect(block.props.children).toContain('applinks');
    expect(block.props.children).toContain('com.example.app');
  });

  it('uses the supplied team id in the JSON block', () => {
    const { getByTestId } = render(
      <AASAPreviewCard bundleIdentifier="com.example.app" teamId="ABCDEF1234" />,
    );
    const block = getByTestId('aasa-json-block');
    expect(block.props.children).toContain('ABCDEF1234.com.example.app');
  });

  it('copies the JSON to the clipboard when the Copy button is pressed', async () => {
    const { getByTestId, getByText } = render(
      <AASAPreviewCard bundleIdentifier="com.example.app" />,
    );
    fireEvent.press(getByTestId('copy-aasa-btn'));
    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockSetStringAsync.mock.calls[0][0]).toContain('com.example.app');
    await waitFor(() => {
      expect(getByText(/Copied/)).toBeTruthy();
    });
  });
});
