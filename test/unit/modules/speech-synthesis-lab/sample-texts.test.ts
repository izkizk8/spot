/**
 * T009: sample-texts byte-equality tests.
 */

import {
  EN_SAMPLE,
  JA_SAMPLE,
  SAMPLE_PRESETS,
  ZH_SAMPLE,
} from '@/modules/speech-synthesis-lab/sample-texts';

describe('sample-texts', () => {
  it('EN_SAMPLE byte-equality', () => {
    expect(EN_SAMPLE).toBe('The quick brown fox jumps over the lazy dog.');
  });

  it('ZH_SAMPLE byte-equality', () => {
    expect(ZH_SAMPLE).toBe('敏捷的棕色狐狸跳过了懒狗。');
  });

  it('JA_SAMPLE byte-equality', () => {
    expect(JA_SAMPLE).toBe('素早い茶色の狐が怠け者の犬を飛び越えます。');
  });

  it('SAMPLE_PRESETS has three entries with ids en/zh/ja', () => {
    expect(SAMPLE_PRESETS).toHaveLength(3);
    expect(SAMPLE_PRESETS.map((p) => p.id)).toEqual(['en', 'zh', 'ja']);
  });

  it('preset texts equal the corresponding constants', () => {
    expect(SAMPLE_PRESETS[0]?.text).toBe(EN_SAMPLE);
    expect(SAMPLE_PRESETS[1]?.text).toBe(ZH_SAMPLE);
    expect(SAMPLE_PRESETS[2]?.text).toBe(JA_SAMPLE);
  });

  it('preset labels are English / Chinese / Japanese', () => {
    expect(SAMPLE_PRESETS.map((p) => p.label)).toEqual(['English', 'Chinese', 'Japanese']);
  });
});
