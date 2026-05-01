import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { MoodLogger } from '@/modules/app-intents-lab/components/MoodLogger';

describe('MoodLogger', () => {
  it('renders three options labelled Happy / Neutral / Sad', () => {
    const { getByLabelText } = render(
      <MoodLogger value='neutral' onChange={() => {}} onLog={() => {}} />,
    );
    expect(getByLabelText('Mood: Happy')).toBeTruthy();
    expect(getByLabelText('Mood: Neutral')).toBeTruthy();
    expect(getByLabelText('Mood: Sad')).toBeTruthy();
  });

  it('Neutral option reads as selected when value="neutral"', () => {
    const { getByLabelText } = render(
      <MoodLogger value='neutral' onChange={() => {}} onLog={() => {}} />,
    );
    expect(getByLabelText('Mood: Neutral').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Mood: Happy').props.accessibilityState.selected).toBe(false);
  });

  it('pressing Happy invokes onChange with "happy"', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MoodLogger value='neutral' onChange={onChange} onLog={() => {}} />,
    );
    fireEvent.press(getByLabelText('Mood: Happy'));
    expect(onChange).toHaveBeenCalledWith('happy');
  });

  it('pressing Sad invokes onChange with "sad"', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MoodLogger value='happy' onChange={onChange} onLog={() => {}} />,
    );
    fireEvent.press(getByLabelText('Mood: Sad'));
    expect(onChange).toHaveBeenCalledWith('sad');
  });

  it('pressing the Log mood button calls onLog once', () => {
    const onLog = jest.fn();
    const { getByLabelText } = render(
      <MoodLogger value='neutral' onChange={() => {}} onLog={onLog} />,
    );
    fireEvent.press(getByLabelText('Log mood'));
    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it('honours custom logLabel', () => {
    const { getByLabelText } = render(
      <MoodLogger value='neutral' onChange={() => {}} onLog={() => {}} logLabel='Save mood' />,
    );
    expect(getByLabelText('Save mood')).toBeTruthy();
  });
});
