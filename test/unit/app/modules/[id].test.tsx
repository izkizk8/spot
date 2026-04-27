import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

const MODULES_REF: { current: unknown[] } = { current: [] };
const PARAMS_REF: { current: { id?: string | string[] } } = { current: {} };

jest.mock('@/modules/registry', () => ({
  get MODULES() {
    return MODULES_REF.current;
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => PARAMS_REF.current,
}));

import ModuleDetailScreen from '@/app/modules/[id]';
import type { ModuleManifest } from '@/modules/types';

const renderSpy = jest.fn(() => <Text>module-x-content</Text>);

const moduleX: ModuleManifest = {
  id: 'x',
  title: 'X',
  description: 'demo',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios', 'android', 'web'],
  render: renderSpy,
};

describe('<ModuleDetailScreen>', () => {
  it('mounts the registered module render() output for the matching id', () => {
    MODULES_REF.current = [moduleX];
    PARAMS_REF.current = { id: 'x' };
    renderSpy.mockClear();

    const { getByText } = render(<ModuleDetailScreen />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(getByText('module-x-content')).toBeTruthy();
  });

  it('renders a not-found state when the id is not registered', () => {
    MODULES_REF.current = [moduleX];
    PARAMS_REF.current = { id: 'unknown-x' };
    renderSpy.mockClear();

    const { getByText } = render(<ModuleDetailScreen />);
    expect(renderSpy).not.toHaveBeenCalled();
    expect(getByText('Not available')).toBeTruthy();
    expect(getByText(/unknown-x/)).toBeTruthy();
  });

  it('renders a not-found state when no id route param is provided', () => {
    MODULES_REF.current = [moduleX];
    PARAMS_REF.current = {};
    const { getByText } = render(<ModuleDetailScreen />);
    expect(getByText('Not available')).toBeTruthy();
  });
});
