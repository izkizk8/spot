/**
 * ControlItem Test
 * Feature: 087-controls
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import ControlItem from '@/modules/controls-lab/components/ControlItem';
import type { ControlInfo } from '@/native/controls.types';

const buttonControl: ControlInfo = {
  id: 'com.example.flashlight',
  kind: 'button',
  title: 'Flashlight',
  systemImageName: 'flashlight.on.fill',
  isOn: null,
};

const toggleControl: ControlInfo = {
  id: 'com.example.mute',
  kind: 'toggle',
  title: 'Mute',
  systemImageName: 'speaker.slash.fill',
  isOn: false,
};

describe('ControlItem', () => {
  it('renders control title', () => {
    render(
      <ControlItem
        control={buttonControl}
        loading={false}
        lastResult={null}
        onTrigger={() => {}}
      />,
    );
    expect(screen.getAllByText(/Flashlight/i).length).toBeGreaterThan(0);
  });

  it('renders kind and SF symbol', () => {
    render(
      <ControlItem
        control={buttonControl}
        loading={false}
        lastResult={null}
        onTrigger={() => {}}
      />,
    );
    expect(screen.getByText(/button/i)).toBeTruthy();
  });

  it('calls onTrigger when Trigger button pressed', () => {
    const onTrigger = jest.fn();
    render(
      <ControlItem
        control={buttonControl}
        loading={false}
        lastResult={null}
        onTrigger={onTrigger}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: /Trigger Flashlight/i }));
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('shows toggle state for toggle controls', () => {
    render(
      <ControlItem
        control={toggleControl}
        loading={false}
        lastResult={null}
        onTrigger={() => {}}
      />,
    );
    expect(screen.getByText(/State: Off/i)).toBeTruthy();
  });

  it('disables button when loading', () => {
    render(
      <ControlItem control={buttonControl} loading={true} lastResult={null} onTrigger={() => {}} />,
    );
    expect(screen.getByText(/Triggering/i)).toBeTruthy();
  });
});
