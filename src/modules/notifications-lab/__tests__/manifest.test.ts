import manifest from '../index';

describe('notifications-lab manifest', () => {
  it('has correct id', () => {
    expect(manifest.id).toBe('notifications-lab');
  });

  it('has correct title', () => {
    expect(manifest.title).toBe('Notifications Lab');
  });

  it('has description', () => {
    expect(manifest.description).toBeTruthy();
  });

  it('has icon with ios and fallback', () => {
    expect(manifest.icon.ios).toBe('bell.badge.fill');
    expect(manifest.icon.fallback).toBe('🔔');
  });

  it('supports ios, android, web', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS 10.0', () => {
    expect(manifest.minIOS).toBe('10.0');
  });

  it('has render function', () => {
    expect(manifest.render).toBeDefined();
    expect(typeof manifest.render).toBe('function');
  });
});
