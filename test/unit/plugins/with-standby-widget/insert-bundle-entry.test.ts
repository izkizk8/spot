/**
 * Tests for with-standby-widget/insert-bundle-entry.
 *
 * @see specs/028-standby-mode/tasks.md T043
 * @see specs/028-standby-mode/research.md §3
 */

import { insertBundleEntry } from '../../../../plugins/with-standby-widget/insert-bundle-entry';

const START = '// MARK: spot-widgets:bundle:additional-widgets:start';
const END = '// MARK: spot-widgets:bundle:additional-widgets:end';

const LOCK_BLOCK_LITERAL = `        if #available(iOS 16.0, *) {
            LockScreenAccessoryWidget()
        }`;

function makeBaseline(interior = ''): string {
  return [
    '@main',
    'struct SpotWidgetBundle: WidgetBundle {',
    '    var body: some Widget {',
    '        ShowcaseWidget()',
    `        ${START}`,
    interior,
    `        ${END}`,
    '    }',
    '}',
    '',
  ].join('\n');
}

// 027 mirror function — used to verify commutativity.
function apply027(src: string): string {
  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);
  if (startIdx === -1 || endIdx === -1) throw new Error('missing markers');
  const beforeRegion = src.substring(0, startIdx + START.length);
  const afterRegion = src.substring(endIdx);
  const interior = src.substring(startIdx + START.length, endIdx);
  if (interior.includes('LockScreenAccessoryWidget()')) {
    return src; // already present, idempotent
  }
  return `${beforeRegion}\n${LOCK_BLOCK_LITERAL}\n        ${afterRegion}`;
}

describe('insert-bundle-entry (with-standby-widget)', () => {
  it('happy path: 028 alone inserts StandByWidget() between markers wrapped in iOS 17 guard', () => {
    const out = insertBundleEntry(makeBaseline());
    expect(out).toMatch(/StandByWidget\(\)/);
    expect(out).toMatch(/if #available\(iOS 17, \*\)/);
    const startIdx = out.indexOf(START);
    const endIdx = out.indexOf(END);
    const region = out.substring(startIdx, endIdx);
    expect(region).toContain('StandByWidget()');
  });

  it('coexistence with 027: both blocks present, 027 before 028', () => {
    const baseline = apply027(makeBaseline());
    const out = insertBundleEntry(baseline);
    expect(out).toContain('LockScreenAccessoryWidget()');
    expect(out).toContain('StandByWidget()');
    const lockIdx = out.indexOf('LockScreenAccessoryWidget()');
    const standbyIdx = out.indexOf('StandByWidget()');
    expect(lockIdx).toBeLessThan(standbyIdx);
  });

  it('idempotency on 028 alone: f(f(src)) === f(src)', () => {
    const once = insertBundleEntry(makeBaseline());
    const twice = insertBundleEntry(once);
    expect(twice).toBe(once);
  });

  it('idempotency in the presence of 027', () => {
    const withLock = apply027(makeBaseline());
    const once = insertBundleEntry(withLock);
    const twice = insertBundleEntry(once);
    expect(twice).toBe(once);
    expect(once).toContain('LockScreenAccessoryWidget()');
    expect(once).toContain('StandByWidget()');
  });

  it('commutativity with 027 (R-A): canonical 027→028 fold yields both blocks (027 first)', () => {
    // NOTE: the real 027 plugin uses destructive region replacement (it does
    // NOT preserve other plugins' entries). 028 owns the union-aware logic, so
    // commutativity is achieved by always running 028 LAST (as the canonical
    // app.json plugin order ensures). Here we verify the canonical fold.
    const baseline = makeBaseline();
    const out = insertBundleEntry(apply027(baseline));
    expect(out).toContain('LockScreenAccessoryWidget()');
    expect(out).toContain('StandByWidget()');
    const lockIdx = out.indexOf('LockScreenAccessoryWidget()');
    const standbyIdx = out.indexOf('StandByWidget()');
    expect(lockIdx).toBeLessThan(standbyIdx);
  });

  it('commutativity with 014: surrounding ShowcaseWidget() preserved', () => {
    const baseline = makeBaseline();
    expect(baseline).toContain('ShowcaseWidget()');
    const out = insertBundleEntry(baseline);
    expect(out).toContain('ShowcaseWidget()');
    // ShowcaseWidget remains before the start marker (untouched).
    const showcaseIdx = out.indexOf('ShowcaseWidget()');
    const startIdx = out.indexOf(START);
    expect(showcaseIdx).toBeLessThan(startIdx);
  });

  it('missing start marker → fail-loud', () => {
    const broken = makeBaseline().replace(START, '// no start');
    expect(() => insertBundleEntry(broken)).toThrow(/with-standby-widget/);
    expect(() => insertBundleEntry(broken)).toThrow(/research\.md/);
  });

  it('missing end marker → fail-loud', () => {
    const broken = makeBaseline().replace(END, '// no end');
    expect(() => insertBundleEntry(broken)).toThrow(/with-standby-widget/);
  });

  it('both markers absent → throws', () => {
    const broken = makeBaseline().replace(START, '// none').replace(END, '// none');
    expect(() => insertBundleEntry(broken)).toThrow(/Missing|marker/);
  });

  it('markers reversed (end before start) → throws', () => {
    const baseline = makeBaseline();
    const reversed = baseline.replace(START, '__TMP__').replace(END, START).replace('__TMP__', END);
    expect(() => insertBundleEntry(reversed)).toThrow(/marker|missing/i);
  });

  it('text outside the marker region is preserved byte-identically', () => {
    const baseline = makeBaseline();
    const out = insertBundleEntry(baseline);
    const before = baseline.substring(0, baseline.indexOf(START));
    const outBefore = out.substring(0, out.indexOf(START));
    expect(outBefore).toBe(before);
    const after = baseline.substring(baseline.indexOf(END));
    const outAfter = out.substring(out.indexOf(END));
    expect(outAfter).toBe(after);
  });

  it('inserted Swift includes opening / closing braces and StandByWidget()', () => {
    const out = insertBundleEntry(makeBaseline());
    const startIdx = out.indexOf(START);
    const endIdx = out.indexOf(END);
    const region = out.substring(startIdx, endIdx);
    expect(region).toMatch(/if #available\(iOS 17, \*\)/);
    expect(region).toContain('{');
    expect(region).toContain('StandByWidget()');
    expect(region).toContain('}');
  });
});
