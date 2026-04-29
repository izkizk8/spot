/**
 * @jest-environment node
 */

describe('mood-log', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('starts empty', () => {
    const { getMoodEntries } = require('@/modules/quick-actions-lab/mood-log');
    expect(getMoodEntries()).toEqual([]);
  });

  it('appendMoodEntry adds entries in order', () => {
    const { appendMoodEntry, getMoodEntries } = require('@/modules/quick-actions-lab/mood-log');
    appendMoodEntry({ mood: 'happy', source: 'quick-action', timestamp: '2026-04-30T10:00:00Z' });
    appendMoodEntry({ mood: 'sad', source: 'quick-action', timestamp: '2026-04-30T11:00:00Z' });
    const entries = getMoodEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].mood).toBe('happy');
    expect(entries[1].mood).toBe('sad');
  });

  it('clearMoodEntries empties the array', () => {
    const {
      appendMoodEntry,
      clearMoodEntries,
      getMoodEntries,
    } = require('@/modules/quick-actions-lab/mood-log');
    appendMoodEntry({ mood: 'happy', source: 'quick-action', timestamp: '2026-04-30T10:00:00Z' });
    expect(getMoodEntries()).toHaveLength(1);
    clearMoodEntries();
    expect(getMoodEntries()).toEqual([]);
  });

  it('module-scoped state is isolated by jest.resetModules()', () => {
    const m1 = require('@/modules/quick-actions-lab/mood-log');
    m1.appendMoodEntry({
      mood: 'happy',
      source: 'quick-action',
      timestamp: '2026-04-30T10:00:00Z',
    });
    expect(m1.getMoodEntries()).toHaveLength(1);

    jest.resetModules();
    const m2 = require('@/modules/quick-actions-lab/mood-log');
    expect(m2.getMoodEntries()).toEqual([]);
  });

  it('returned array is a defensive copy', () => {
    const { appendMoodEntry, getMoodEntries } = require('@/modules/quick-actions-lab/mood-log');
    appendMoodEntry({ mood: 'happy', source: 'quick-action', timestamp: '2026-04-30T10:00:00Z' });
    const a = getMoodEntries();
    const b = getMoodEntries();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
