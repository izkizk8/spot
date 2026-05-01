/**
 * @jest-environment jsdom
 */

import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import AttributionFooter, {
  APPLE_WEATHER_LEGAL_URL,
} from '@/modules/weatherkit-lab/components/AttributionFooter';

describe('AttributionFooter', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as unknown as boolean);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the required Apple Weather attribution copy', () => {
    const { getByTestId, getByText } = render(<AttributionFooter />);
    expect(getByTestId('weatherkit-attribution-footer')).toBeTruthy();
    expect(getByText(/Weather data provided by Apple Weather/)).toBeTruthy();
  });

  it('opens the default legal URL when the link is pressed', () => {
    const openSpy = Linking.openURL as jest.Mock;
    const { getByTestId } = render(<AttributionFooter />);
    fireEvent.press(getByTestId('weatherkit-attribution-link'));
    expect(openSpy).toHaveBeenCalledWith(APPLE_WEATHER_LEGAL_URL);
  });

  it('honours the onOpen override and skips Linking.openURL', () => {
    const openSpy = Linking.openURL as jest.Mock;
    const cb = jest.fn();
    const { getByTestId } = render(<AttributionFooter onOpen={cb} />);
    fireEvent.press(getByTestId('weatherkit-attribution-link'));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens the developer-supplied legalPageUrl when provided', () => {
    const openSpy = Linking.openURL as jest.Mock;
    const { getByTestId } = render(<AttributionFooter legalPageUrl='https://example.com/legal' />);
    fireEvent.press(getByTestId('weatherkit-attribution-link'));
    expect(openSpy).toHaveBeenCalledWith('https://example.com/legal');
  });
});
