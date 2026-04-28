import manifest from '../../index';

describe('notifications-lab manifest', () => {
  it('has correct id', () => {
    expect(manifest.id).toBe('notifications-lab');
  });

  it('has correct label', () => {
    expect(manifest.label).toBe('Notifications Lab');
  });

  it('supports ios, android, web', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS 10.0', () => {
    expect(manifest.minIOS).toBe('10.0');
  });

  it('has screen component', () => {
    expect(manifest.screen).toBeDefined();
    expect(typeof manifest.screen).toBe('function');
  });
});
