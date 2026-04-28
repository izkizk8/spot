/**
 * Locked sample texts for the preset chips (data-model.md §11, FR-005, FR-006, A-02).
 */

export const EN_SAMPLE = 'The quick brown fox jumps over the lazy dog.';
export const ZH_SAMPLE = '敏捷的棕色狐狸跳过了懒狗。';
export const JA_SAMPLE = '素早い茶色の狐が怠け者の犬を飛び越えます。';

export type SamplePresetId = 'en' | 'zh' | 'ja';

export interface SamplePreset {
  id: SamplePresetId;
  label: 'English' | 'Chinese' | 'Japanese';
  text: string;
}

export const SAMPLE_PRESETS: readonly SamplePreset[] = [
  { id: 'en', label: 'English', text: EN_SAMPLE },
  { id: 'zh', label: 'Chinese', text: ZH_SAMPLE },
  { id: 'ja', label: 'Japanese', text: JA_SAMPLE },
];
