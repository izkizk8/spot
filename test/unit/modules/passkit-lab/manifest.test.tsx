/**
 * PassKit Lab manifest tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T035 lands.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

describe('PassKit Lab manifest', () => {
  it('M2: id is passkit-lab', async () => {
    const { manifest } = require('@/modules/passkit-lab');
    expect(manifest.id).toBe('passkit-lab');
  });

  it('M3: label is Wallet (PassKit)', async () => {
    const { manifest } = require('@/modules/passkit-lab');
    expect(manifest.title).toBe('Wallet (PassKit)');
  });

  it('M4: platforms deep-equals [ios, android, web]', async () => {
    const { manifest } = require('@/modules/passkit-lab');
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('M5: minIOS is 6.0', async () => {
    const { manifest } = require('@/modules/passkit-lab');
    expect(manifest.minIOS).toBe('6.0');
  });

  it('M6: screen resolves to a renderable React component', async () => {
    const { manifest } = require('@/modules/passkit-lab');
    expect(typeof manifest.render).toBe('function');

    const Screen = manifest.render;
    expect(() => render(<Screen />)).not.toThrow();
  });

  it('M1: manifest object shape matches other modules', async () => {
    const { manifest } = require('@/modules/passkit-lab');

    expect(manifest).toHaveProperty('id');
    expect(manifest).toHaveProperty('title');
    expect(manifest).toHaveProperty('description');
    expect(manifest).toHaveProperty('icon');
    expect(manifest).toHaveProperty('platforms');
    expect(manifest).toHaveProperty('minIOS');
    expect(manifest).toHaveProperty('render');
  });
});
