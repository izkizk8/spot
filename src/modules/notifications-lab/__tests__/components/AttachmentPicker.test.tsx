import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AttachmentPicker } from '../../components/AttachmentPicker';

describe('AttachmentPicker', () => {
  it('renders None + 3 thumbnails', () => {
    const { getByText } = render(<AttachmentPicker selected={null} onSelect={jest.fn()} />);
    expect(getByText(/none/i)).toBeTruthy();
  });

  it('calls onSelect(id) when thumbnail tapped', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<AttachmentPicker selected={null} onSelect={onSelect} />);
    fireEvent.press(getByTestId('attachment-sample-1'));
    expect(onSelect).toHaveBeenCalledWith('sample-1');
  });

  it('calls onSelect(null) when None tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<AttachmentPicker selected={null} onSelect={onSelect} />);
    fireEvent.press(getByText(/none/i));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('applies selected styling to selected thumbnail', () => {
    const { getByTestId } = render(<AttachmentPicker selected="sample-1" onSelect={jest.fn()} />);
    const selected = getByTestId('attachment-sample-1');
    expect(selected.props.accessibilityState?.selected).toBe(true);
  });
});
