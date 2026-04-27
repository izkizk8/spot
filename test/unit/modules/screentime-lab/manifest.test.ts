/**
 * @file T031 — manifest test.
 */

import React from 'react';

import manifest from '@/modules/screentime-lab';

describe('screentime-lab manifest', () => {
  it('has id screentime-lab', () => {
    expect(manifest.id).toBe('screentime-lab');
  });
  it('has minIOS 16.0', () => {
    expect(manifest.minIOS).toBe('16.0');
  });
  it('lists ios, android, and web platforms', () => {
    expect(manifest.platforms).toEqual(expect.arrayContaining(['ios', 'android', 'web']));
  });
  it('render returns a React element', () => {
    const el = manifest.render();
    expect(React.isValidElement(el)).toBe(true);
  });
});
