/**
 * T033: VoicePicker component tests (FR-008, FR-009, FR-028).
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import VoicePicker from '@/modules/speech-synthesis-lab/components/VoicePicker';
import type { Voice } from '@/modules/speech-synthesis-lab/synth-types';

const VOICES: Voice[] = [
  { id: 'enUS-1', name: 'Alex', language: 'en-US', quality: 'Default', isPersonalVoice: false },
  {
    id: 'enUS-2',
    name: 'Samantha',
    language: 'en-US',
    quality: 'Enhanced',
    isPersonalVoice: false,
  },
  { id: 'enGB-1', name: 'Daniel', language: 'en-GB', quality: 'Default', isPersonalVoice: false },
  { id: 'zhCN-1', name: 'Tingting', language: 'zh-CN', quality: 'Premium', isPersonalVoice: false },
  { id: 'jaJP-1', name: 'Kyoko', language: 'ja-JP', quality: 'Default', isPersonalVoice: false },
];

describe('VoicePicker', () => {
  it('renders raw BCP-47 section headers (no humanization)', () => {
    const view = render(
      <VoicePicker
        voices={VOICES}
        selectedVoiceId={undefined}
        onSelectVoice={jest.fn()}
        personalVoiceStatus="unsupported"
      />,
    );
    expect(view.queryByText('en-US')).toBeTruthy();
    expect(view.queryByText('en-GB')).toBeTruthy();
    expect(view.queryByText('zh-CN')).toBeTruthy();
    expect(view.queryByText('ja-JP')).toBeTruthy();
  });

  it('renders quality badges with literal labels', () => {
    const view = render(
      <VoicePicker
        voices={VOICES}
        selectedVoiceId={undefined}
        onSelectVoice={jest.fn()}
        personalVoiceStatus="unsupported"
      />,
    );
    expect(view.queryAllByText('Default').length).toBeGreaterThan(0);
    expect(view.queryByText('Enhanced')).toBeTruthy();
    expect(view.queryByText('Premium')).toBeTruthy();
  });

  it('selecting a row invokes onSelectVoice once with the voice id', () => {
    const onSelectVoice = jest.fn();
    const view = render(
      <VoicePicker
        voices={VOICES}
        selectedVoiceId={undefined}
        onSelectVoice={onSelectVoice}
        personalVoiceStatus="unsupported"
      />,
    );
    const rows = view.UNSAFE_root.findAll(
      (n: any) =>
        n.props &&
        n.props.accessibilityRole === 'button' &&
        /Select voice Alex/.test(String(n.props.accessibilityLabel ?? '')),
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    fireEvent.press(rows[0]);
    expect(onSelectVoice).toHaveBeenCalledTimes(1);
    expect(onSelectVoice).toHaveBeenCalledWith('enUS-1');
  });

  it('selected voice has accessibilityState.selected === true', () => {
    const view = render(
      <VoicePicker
        voices={VOICES}
        selectedVoiceId="enUS-1"
        onSelectVoice={jest.fn()}
        personalVoiceStatus="unsupported"
      />,
    );
    const row = view.UNSAFE_root.findAll(
      (n: any) =>
        n.props &&
        n.props.accessibilityRole === 'button' &&
        /Select voice Alex/.test(String(n.props.accessibilityLabel ?? '')),
    )[0];
    expect(row.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('renders Personal Voice section when authorized AND a PV voice exists', () => {
    const withPV: Voice[] = [
      ...VOICES,
      { id: 'pv1', name: 'My Voice', language: 'en-US', quality: 'Premium', isPersonalVoice: true },
    ];
    const view = render(
      <VoicePicker
        voices={withPV}
        selectedVoiceId={undefined}
        onSelectVoice={jest.fn()}
        personalVoiceStatus="authorized"
      />,
    );
    expect(view.queryByText('Personal Voice')).toBeTruthy();
  });

  it('does not render Personal Voice section when status is not authorized', () => {
    const withPV: Voice[] = [
      ...VOICES,
      { id: 'pv1', name: 'My Voice', language: 'en-US', quality: 'Premium', isPersonalVoice: true },
    ];
    const view = render(
      <VoicePicker
        voices={withPV}
        selectedVoiceId={undefined}
        onSelectVoice={jest.fn()}
        personalVoiceStatus="notDetermined"
      />,
    );
    expect(view.queryByText('Personal Voice')).toBeNull();
  });

  it('renders empty placeholder for empty voices array', () => {
    const view = render(
      <VoicePicker
        voices={[]}
        selectedVoiceId={undefined}
        onSelectVoice={jest.fn()}
        personalVoiceStatus="unsupported"
      />,
    );
    expect(view.queryByText(/no voices available/i)).toBeTruthy();
  });
});
