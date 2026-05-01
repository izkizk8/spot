/**
 * PitchControl — 3-segment Low/Normal/High control (US3, T043, FR-014, D-04).
 */

import React from 'react';

import type { PitchPreset } from '@/modules/speech-synthesis-lab/synth-types';
import SegmentedControl from './SegmentedControl';

export interface PitchControlProps {
  value: PitchPreset;
  onChange: (value: PitchPreset) => void;
  disabled?: boolean;
}

const PITCH_SEGMENTS: ReadonlyArray<PitchPreset> = ['Low', 'Normal', 'High'];

export default function PitchControl({ value, onChange, disabled }: PitchControlProps) {
  return (
    <SegmentedControl<PitchPreset>
      label='Pitch'
      value={value}
      segments={PITCH_SEGMENTS}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
