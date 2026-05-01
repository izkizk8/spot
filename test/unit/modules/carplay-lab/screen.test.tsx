/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CarPlayLabScreen, {
  DEFAULT_CARPLAY_CATEGORY,
  DEFAULT_CARPLAY_TEMPLATE,
} from '@/modules/carplay-lab/screen';

describe('carplay-lab screen (iOS)', () => {
  it('renders the entitlement banner and the four content cards', () => {
    const { getByTestId } = render(<CarPlayLabScreen />);
    expect(getByTestId('carplay-entitlement-banner')).toBeTruthy();
    expect(getByTestId('carplay-scene-composer')).toBeTruthy();
    expect(getByTestId('carplay-template-preview')).toBeTruthy();
    expect(getByTestId('carplay-scene-config-form')).toBeTruthy();
    expect(getByTestId('carplay-setup-instructions')).toBeTruthy();
  });

  it('defaults the picked template to now-playing under the audio category', () => {
    expect(DEFAULT_CARPLAY_CATEGORY).toBe('audio');
    expect(DEFAULT_CARPLAY_TEMPLATE).toBe('now-playing');

    const { getByTestId } = render(<CarPlayLabScreen />);
    expect(getByTestId('carplay-preview-canvas-now-playing')).toBeTruthy();
  });
});
