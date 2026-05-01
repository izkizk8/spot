/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ActivityComposer from '@/modules/shareplay-lab/components/ActivityComposer';

describe('ActivityComposer', () => {
  it('renders all three activity-type buttons and the title input', () => {
    const { getByTestId } = render(
      <ActivityComposer
        selectedType='counter'
        title='Hello'
        onSelectType={() => {}}
        onChangeTitle={() => {}}
      />,
    );
    expect(getByTestId('shareplay-activity-counter')).toBeTruthy();
    expect(getByTestId('shareplay-activity-drawing')).toBeTruthy();
    expect(getByTestId('shareplay-activity-quiz')).toBeTruthy();
    expect(getByTestId('shareplay-activity-title').props.value).toBe('Hello');
  });

  it('marks the selected button via accessibilityState', () => {
    const { getByTestId } = render(
      <ActivityComposer
        selectedType='quiz'
        title=''
        onSelectType={() => {}}
        onChangeTitle={() => {}}
      />,
    );
    expect(getByTestId('shareplay-activity-quiz').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('shareplay-activity-counter').props.accessibilityState.selected).toBe(false);
  });

  it('invokes onSelectType when a different activity is tapped', () => {
    const onSelectType = jest.fn();
    const { getByTestId } = render(
      <ActivityComposer
        selectedType='counter'
        title=''
        onSelectType={onSelectType}
        onChangeTitle={() => {}}
      />,
    );
    fireEvent.press(getByTestId('shareplay-activity-drawing'));
    expect(onSelectType).toHaveBeenCalledWith('drawing');
  });

  it('invokes onChangeTitle when the input changes', () => {
    const onChangeTitle = jest.fn();
    const { getByTestId } = render(
      <ActivityComposer
        selectedType='counter'
        title=''
        onSelectType={() => {}}
        onChangeTitle={onChangeTitle}
      />,
    );
    fireEvent.changeText(getByTestId('shareplay-activity-title'), 'Family Counter');
    expect(onChangeTitle).toHaveBeenCalledWith('Family Counter');
  });
});
