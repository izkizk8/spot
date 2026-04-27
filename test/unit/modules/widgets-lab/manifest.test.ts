import React from 'react';

import manifest from '@/modules/widgets-lab';

describe('widgets-lab manifest', () => {
  it('has id widgets-lab', () => {
    expect(manifest.id).toBe('widgets-lab');
  });
  it('has title Widgets Lab', () => {
    expect(manifest.title).toBe('Widgets Lab');
  });
  it('has minIOS 14.0', () => {
    expect(manifest.minIOS).toBe('14.0');
  });
  it('lists ios, android, and web platforms', () => {
    expect(manifest.platforms).toEqual(expect.arrayContaining(['ios', 'android', 'web']));
  });
  it('render returns a React element', () => {
    const el = manifest.render();
    expect(React.isValidElement(el)).toBe(true);
  });
});
