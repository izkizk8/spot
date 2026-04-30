/**
 * Unit tests: aasa-template (feature 041).
 *
 * @jest-environment node
 */

import {
  TEAM_ID_PLACEHOLDER,
  aasaToJsonString,
  buildAASA,
} from '@/modules/universal-links-lab/aasa-template';

describe('buildAASA', () => {
  it('produces a single details entry with TEAMID.bundleId when team id omitted', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app' });
    expect(doc.applinks.details).toHaveLength(1);
    expect(doc.applinks.details[0].appID).toBe(`${TEAM_ID_PLACEHOLDER}.com.example.app`);
  });

  it('uses the supplied team id when provided', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app', teamId: 'ABCDEF1234' });
    expect(doc.applinks.details[0].appID).toBe('ABCDEF1234.com.example.app');
  });

  it('defaults paths to ["*"] when omitted', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app' });
    expect(doc.applinks.details[0].paths).toEqual(['*']);
  });

  it('respects supplied non-empty paths array', () => {
    const doc = buildAASA({
      bundleIdentifier: 'com.example.app',
      paths: ['/a', '/b/*'],
    });
    expect(doc.applinks.details[0].paths).toEqual(['/a', '/b/*']);
  });

  it('falls back to ["*"] when supplied paths is an empty array', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app', paths: [] });
    expect(doc.applinks.details[0].paths).toEqual(['*']);
  });

  it('returns a structurally serialisable object', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app' });
    expect(() => JSON.stringify(doc)).not.toThrow();
    const round = JSON.parse(JSON.stringify(doc));
    expect(round).toEqual(doc);
  });
});

describe('aasaToJsonString', () => {
  it('returns valid JSON ending with a newline', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app' });
    const out = aasaToJsonString(doc);
    expect(out.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('uses 2-space indentation', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app' });
    const out = aasaToJsonString(doc);
    expect(out).toContain('\n  "applinks"');
  });

  it('round-trips: parsing the string equals the original document', () => {
    const doc = buildAASA({ bundleIdentifier: 'com.example.app', teamId: 'X' });
    const parsed = JSON.parse(aasaToJsonString(doc));
    expect(parsed).toEqual(doc);
  });
});
