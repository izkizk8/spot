/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SetupInstructions, {
  CARPLAY_SETUP_STEPS,
} from '@/modules/carplay-lab/components/SetupInstructions';

describe('SetupInstructions (carplay)', () => {
  it('renders one row per documented step', () => {
    const { getByTestId } = render(<SetupInstructions />);
    for (let i = 0; i < CARPLAY_SETUP_STEPS.length; i++) {
      expect(getByTestId(`carplay-setup-step-${i}`)).toBeTruthy();
    }
  });

  it('mentions the developer portal request flow in the first step', () => {
    expect(CARPLAY_SETUP_STEPS[0]).toMatch(/developer\.apple\.com/);
  });

  it('mentions the UISceneManifest configuration', () => {
    const flat = CARPLAY_SETUP_STEPS.join(' ');
    expect(flat).toMatch(/UISceneManifest|UISceneConfigurations/);
  });

  it('mentions the CarPlaySceneDelegate scaffold', () => {
    const flat = CARPLAY_SETUP_STEPS.join(' ');
    expect(flat).toMatch(/CarPlaySceneDelegate/);
  });
});
