/**
 * RateControl — 3-segment Slow/Normal/Fast control (US3, T042, FR-013, D-03).
 */

import React from 'react';

import type { RatePreset } from '@/modules/speech-synthesis-lab/synth-types';
import SegmentedControl from './SegmentedControl';

export interface RateControlProps {
  value: RatePreset;
  onChange: (value: RatePreset) => void;
  disabled?: boolean;
}

const RATE_SEGMENTS: ReadonlyArray<RatePreset> = ['Slow', 'Normal', 'Fast'];

export default function RateControl({ value, onChange, disabled }: RateControlProps) {
  return (
    <SegmentedControl<RatePreset>
      label="Rate"
      value={value}
      segments={RATE_SEGMENTS}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
