import { LANDMARKS, DEFAULT_FALLBACK_REGION } from '@/modules/mapkit-lab/landmarks';

describe('landmarks', () => {
  it('exports exactly 4 landmarks', () => {
    expect(LANDMARKS).toHaveLength(4);
  });

  it('all landmark ids match kebab-case pattern', () => {
    const pattern = /^[a-z][a-z0-9-]*$/;
    LANDMARKS.forEach((landmark) => {
      expect(landmark.id).toMatch(pattern);
    });
  });

  it('all landmark ids are unique', () => {
    const ids = LANDMARKS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all lat values are within [-90, 90]', () => {
    LANDMARKS.forEach((landmark) => {
      expect(landmark.lat).toBeGreaterThanOrEqual(-90);
      expect(landmark.lat).toBeLessThanOrEqual(90);
    });
  });

  it('all lng values are within [-180, 180]', () => {
    LANDMARKS.forEach((landmark) => {
      expect(landmark.lng).toBeGreaterThanOrEqual(-180);
      expect(landmark.lng).toBeLessThanOrEqual(180);
    });
  });

  it('all descriptions are non-empty', () => {
    LANDMARKS.forEach((landmark) => {
      expect(landmark.description).toBeTruthy();
      expect(landmark.description.length).toBeGreaterThan(0);
    });
  });

  it('DEFAULT_FALLBACK_REGION is within continental US bounds', () => {
    expect(DEFAULT_FALLBACK_REGION.lat).toBeGreaterThanOrEqual(25);
    expect(DEFAULT_FALLBACK_REGION.lat).toBeLessThanOrEqual(50);
    expect(DEFAULT_FALLBACK_REGION.lng).toBeGreaterThanOrEqual(-130);
    expect(DEFAULT_FALLBACK_REGION.lng).toBeLessThanOrEqual(-65);
  });
});
