/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SceneComposer from '@/modules/carplay-lab/components/SceneComposer';

describe('SceneComposer (carplay)', () => {
  it('renders all five template options', () => {
    const { getByTestId } = render(
      <SceneComposer category="audio" selectedKind="list" onSelect={() => {}} />,
    );
    for (const k of ['list', 'grid', 'information', 'map', 'now-playing']) {
      expect(getByTestId(`carplay-template-option-${k}`)).toBeTruthy();
    }
  });

  it('invokes onSelect with the picked kind', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <SceneComposer category="audio" selectedKind="list" onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('carplay-template-option-now-playing'));
    expect(onSelect).toHaveBeenCalledWith('now-playing');
  });

  it('shows the disallowed warning under the audio category for non-audio templates', () => {
    const { getByTestId, queryByTestId } = render(
      <SceneComposer category="audio" selectedKind="now-playing" onSelect={() => {}} />,
    );
    // Map is not permitted under audio.
    expect(getByTestId('carplay-template-warn-map')).toBeTruthy();
    // Now Playing is permitted under audio.
    expect(queryByTestId('carplay-template-warn-now-playing')).toBeNull();
  });

  it('does NOT show a warning for any template under driving-task that supports map', () => {
    const { queryByTestId } = render(
      <SceneComposer category="driving-task" selectedKind="map" onSelect={() => {}} />,
    );
    expect(queryByTestId('carplay-template-warn-map')).toBeNull();
    // Now Playing is audio-only → still warns under driving-task.
    expect(queryByTestId('carplay-template-warn-now-playing')).not.toBeNull();
  });
});
