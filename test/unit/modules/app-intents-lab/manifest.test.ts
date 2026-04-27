import AppIntentsLabManifest from '@/modules/app-intents-lab';
import { MODULES } from '@/modules/registry';

describe('app-intents-lab manifest', () => {
  it('id matches kebab-case and equals "app-intents-lab"', () => {
    expect(AppIntentsLabManifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(AppIntentsLabManifest.id).toBe('app-intents-lab');
  });

  it('platforms includes ios, android, web', () => {
    expect(AppIntentsLabManifest.platforms).toEqual(
      expect.arrayContaining(['ios', 'android', 'web']),
    );
  });

  it('minIOS === "16.0"', () => {
    expect(AppIntentsLabManifest.minIOS).toBe('16.0');
  });

  it('title, description, icon.ios, icon.fallback are non-empty', () => {
    expect(AppIntentsLabManifest.title.length).toBeGreaterThan(0);
    expect(AppIntentsLabManifest.description.length).toBeGreaterThan(0);
    expect(AppIntentsLabManifest.icon.ios.length).toBeGreaterThan(0);
    expect(AppIntentsLabManifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('render is a function returning a React element', () => {
    expect(typeof AppIntentsLabManifest.render).toBe('function');
    const el = AppIntentsLabManifest.render();
    expect(el).toBeTruthy();
  });

  it('manifest is registered in MODULES', () => {
    expect(MODULES).toContain(AppIntentsLabManifest);
  });
});
