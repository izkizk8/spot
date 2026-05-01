/**
 * VolumeControl — 3-segment Low/Normal/High control (US3, T044, FR-015, D-05).
 */

import React from 'react';

import type { VolumePreset } from '@/modules/speech-synthesis-lab/synth-types';
import SegmentedControl from './SegmentedControl';

export interface VolumeControlProps {
  value: VolumePreset;
  onChange: (value: VolumePreset) => void;
  disabled?: boolean;
}

const VOLUME_SEGMENTS: ReadonlyArray<VolumePreset> = ['Low', 'Normal', 'High'];

export default function VolumeControl({ value, onChange, disabled }: VolumeControlProps) {
  return (
    <SegmentedControl<VolumePreset>
      label='Volume'
      value={value}
      segments={VOLUME_SEGMENTS}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
