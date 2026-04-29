/**
 * Tests for searchable-items-source.ts — feature 031 / T008.
 *
 * Covers registry → SearchableItem[] mapping per
 * contracts/searchable-items-source.contract.ts.
 */

import {
  DOMAIN_IDENTIFIER,
  mapRegistryToItems,
  type MapErrorSignal,
} from '@/modules/spotlight-lab/searchable-items-source';

interface MockRegistryEntry {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

function createMockEntry(partial: Partial<MockRegistryEntry> & { id: string }): MockRegistryEntry {
  return {
    id: partial.id,
    title: partial.title,
    description: partial.description,
    keywords: partial.keywords,
  };
}

describe('searchable-items-source: basic mapping', () => {
  it('given a registry of 3 distinct modules with full metadata, returns 3 SearchableItems with correct ids (FR-021/FR-022)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({
        id: 'haptics',
        title: 'Haptics Playground',
        description: 'Explore haptic feedback patterns',
        keywords: ['haptic', 'vibration'],
      }),
      createMockEntry({
        id: 'sensors',
        title: 'Sensors Lab',
        description: 'Sensor data visualization',
        keywords: ['sensors', 'gyro'],
      }),
      createMockEntry({
        id: 'audio',
        title: 'Audio Lab',
        description: 'Audio recording and playback',
        keywords: ['audio', 'sound'],
      }),
    ];

    const result = mapRegistryToItems(registry);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(`${DOMAIN_IDENTIFIER}.haptics`);
    expect(result[1].id).toBe(`${DOMAIN_IDENTIFIER}.sensors`);
    expect(result[2].id).toBe(`${DOMAIN_IDENTIFIER}.audio`);
  });

  it('every returned item has domainIdentifier === DOMAIN_IDENTIFIER (FR-022)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'test1', title: 'Test 1', description: 'Desc 1' }),
      createMockEntry({ id: 'test2', title: 'Test 2', description: 'Desc 2' }),
    ];

    const result = mapRegistryToItems(registry);
    for (const item of result) {
      expect(item.domainIdentifier).toBe(DOMAIN_IDENTIFIER);
    }
  });

  it('every returned keywords field is string[]; missing keywords on source produces [] (FR-023)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'with-keywords', title: 'With Keywords', keywords: ['a', 'b'] }),
      createMockEntry({ id: 'no-keywords', title: 'No Keywords' }),
      createMockEntry({ id: 'empty-keywords', title: 'Empty', keywords: [] }),
    ];

    const result = mapRegistryToItems(registry);
    expect(result[0].keywords).toEqual(['a', 'b']);
    expect(result[1].keywords).toEqual([]);
    expect(result[2].keywords).toEqual([]);
  });
});

describe('searchable-items-source: empty-label fallback', () => {
  it('source module with empty title falls back to title === module.id (FR-023/EC-003)', () => {
    const errors: MapErrorSignal[] = [];
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'empty-title', title: '', description: 'Has description' }),
    ];

    const result = mapRegistryToItems(registry, { onError: (err) => errors.push(err) });
    expect(result[0].title).toBe('empty-title');
    expect(errors.some((e) => e.kind === 'minimal-metadata')).toBe(true);
  });

  it('source module with undefined title falls back to module.id', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'no-title', description: 'Desc' }),
    ];

    const result = mapRegistryToItems(registry);
    expect(result[0].title).toBe('no-title');
  });

  it('source module with empty description falls back to contentDescription === "" (contract S6)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'empty-desc', title: 'Title', description: '' }),
      createMockEntry({ id: 'no-desc', title: 'Title 2' }),
    ];

    const result = mapRegistryToItems(registry);
    expect(result[0].contentDescription).toBe('');
    expect(result[1].contentDescription).toBe('');
  });
});

describe('searchable-items-source: duplicate handling', () => {
  it('two source entries sharing the same id: result contains exactly one item (de-dup); onError invoked once (FR-024/EC-004)', () => {
    const errors: MapErrorSignal[] = [];
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'duplicate', title: 'First', description: 'First entry' }),
      createMockEntry({ id: 'duplicate', title: 'Second', description: 'Second entry' }),
    ];

    const result = mapRegistryToItems(registry, { onError: (err) => errors.push(err) });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('First'); // first-wins
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      kind: 'duplicate-id',
      id: `${DOMAIN_IDENTIFIER}.duplicate`,
    });
  });

  it('three source entries sharing the same id: result contains exactly one item; onError invoked once total (S8)', () => {
    const errors: MapErrorSignal[] = [];
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'triple', title: 'First' }),
      createMockEntry({ id: 'triple', title: 'Second' }),
      createMockEntry({ id: 'triple', title: 'Third' }),
    ];

    const result = mapRegistryToItems(registry, { onError: (err) => errors.push(err) });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('First');
    const duplicateErrors = errors.filter((e) => e.kind === 'duplicate-id');
    expect(duplicateErrors).toHaveLength(1); // once total, not per duplicate
  });

  it('onError omitted: function does not throw on duplicates (best-effort tolerance)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'dup', title: 'First' }),
      createMockEntry({ id: 'dup', title: 'Second' }),
    ];

    expect(() => mapRegistryToItems(registry)).not.toThrow();
    const result = mapRegistryToItems(registry);
    expect(result).toHaveLength(1);
  });
});

describe('searchable-items-source: edge cases', () => {
  it('empty registry: returns []; onError not invoked', () => {
    const errors: MapErrorSignal[] = [];
    const result = mapRegistryToItems([], { onError: (err) => errors.push(err) });
    expect(result).toEqual([]);
    expect(errors).toEqual([]);
  });

  it('result is stable across calls with the same input (deterministic ordering)', () => {
    const registry: MockRegistryEntry[] = [
      createMockEntry({ id: 'a', title: 'A' }),
      createMockEntry({ id: 'b', title: 'B' }),
      createMockEntry({ id: 'c', title: 'C' }),
    ];

    const result1 = mapRegistryToItems(registry);
    const result2 = mapRegistryToItems(registry);
    expect(result1).toEqual(result2);
    expect(result1[0].id).toBe(`${DOMAIN_IDENTIFIER}.a`);
    expect(result1[1].id).toBe(`${DOMAIN_IDENTIFIER}.b`);
    expect(result1[2].id).toBe(`${DOMAIN_IDENTIFIER}.c`);
  });

  it('output is a fresh array (no mutation of the input registry)', () => {
    const registry: MockRegistryEntry[] = [createMockEntry({ id: 'test', title: 'Test' })];
    const originalLength = registry.length;

    const result = mapRegistryToItems(registry);
    result.push(result[0]); // try to mutate output
    expect(registry).toHaveLength(originalLength);
  });
});
