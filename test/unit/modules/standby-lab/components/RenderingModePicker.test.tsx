import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { RenderingModePicker } from '@/modules/standby-lab/components/RenderingModePicker';
import type { RenderingMode } from '@/modules/standby-lab/standby-config';

describe('RenderingModePicker (standby-lab)', () => {
  it('renders 3 segments with labels Full Color, Accented, Vibrant in order', () => {
    const { getByText, getAllByRole } = render(
      <RenderingModePicker value="fullColor" onChange={() => {}} />,
    );
    expect(getByText('Full Color')).toBeTruthy();
    expect(getByText('Accented')).toBeTruthy();
    expect(getByText('Vibrant')).toBeTruthy();
    const radios = getAllByRole('radio');
    expect(radios.length).toBe(3);
  });

  it('the segment matching value is selected', () => {
    const { getAllByRole } = render(<RenderingModePicker value="accented" onChange={() => {}} />);
    const radios = getAllByRole('radio');
    const selectedStates = radios.map((r) => r.props.accessibilityState?.selected === true);
    // exactly one selected
    expect(selectedStates.filter(Boolean).length).toBe(1);
    // and it is the second (Accented)
    expect(selectedStates[1]).toBe(true);
  });

  it('tapping a non-selected segment fires onChange with the matching mode', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <RenderingModePicker value="fullColor" onChange={onChange} />,
    );
    fireEvent.press(getByLabelText(/Rendering mode Vibrant/i));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith<[RenderingMode]>('vibrant');
  });

  it('each mode value is dispatched correctly', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <RenderingModePicker value="fullColor" onChange={onChange} />,
    );
    fireEvent.press(getByLabelText(/Rendering mode Accented/i));
    expect(onChange).toHaveBeenLastCalledWith('accented');
    fireEvent.press(getByLabelText(/Rendering mode Vibrant/i));
    expect(onChange).toHaveBeenLastCalledWith('vibrant');
  });

  it('tapping the already-selected segment does NOT fire onChange', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<RenderingModePicker value="accented" onChange={onChange} />);
    fireEvent.press(getByLabelText(/Rendering mode Accented/i));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('each segment has an accessibilityLabel naming the mode', () => {
    const { getByLabelText } = render(
      <RenderingModePicker value="fullColor" onChange={() => {}} />,
    );
    expect(getByLabelText(/Rendering mode Full Color/i)).toBeTruthy();
    expect(getByLabelText(/Rendering mode Accented/i)).toBeTruthy();
    expect(getByLabelText(/Rendering mode Vibrant/i)).toBeTruthy();
  });
});
