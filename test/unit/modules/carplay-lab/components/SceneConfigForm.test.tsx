/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SceneConfigForm, {
  DEFAULT_CARPLAY_SCENE_CONFIG,
} from '@/modules/carplay-lab/components/SceneConfigForm';
import { CARPLAY_SCENE_ROLE } from '@/native/carplay.types';

describe('SceneConfigForm (carplay)', () => {
  it('renders the four UISceneConfiguration rows', () => {
    const { getByTestId } = render(<SceneConfigForm />);
    expect(getByTestId('carplay-scene-row-role')).toBeTruthy();
    expect(getByTestId('carplay-scene-row-delegate')).toBeTruthy();
    expect(getByTestId('carplay-scene-row-scene')).toBeTruthy();
    expect(getByTestId('carplay-scene-row-name')).toBeTruthy();
  });

  it('default config uses CPTemplateApplicationSceneSessionRoleApplication', () => {
    expect(DEFAULT_CARPLAY_SCENE_CONFIG.role).toBe(CARPLAY_SCENE_ROLE);
    expect(DEFAULT_CARPLAY_SCENE_CONFIG.role).toBe(
      'CPTemplateApplicationSceneSessionRoleApplication',
    );
    const { getByText } = render(<SceneConfigForm />);
    expect(getByText('CPTemplateApplicationSceneSessionRoleApplication')).toBeTruthy();
  });

  it('renders the values from a custom config prop', () => {
    const { getByText } = render(
      <SceneConfigForm
        config={{
          role: CARPLAY_SCENE_ROLE,
          delegateClassName: 'MyDelegate',
          sceneClassName: 'MyScene',
          configurationName: 'My Config',
        }}
      />,
    );
    expect(getByText('MyDelegate')).toBeTruthy();
    expect(getByText('MyScene')).toBeTruthy();
    expect(getByText('My Config')).toBeTruthy();
  });
});
