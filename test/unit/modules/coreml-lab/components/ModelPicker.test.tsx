/**
 * ModelPicker component tests (feature 016).
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModelPicker } from '@/modules/coreml-lab/components/ModelPicker';

const mockModels = [
  { name: 'MobileNetV2', displayName: 'MobileNetV2', resourceName: 'MobileNetV2' },
  { name: 'ResNet50', displayName: 'ResNet50', resourceName: 'ResNet50' },
];

describe('ModelPicker', () => {
  it('renders all models', () => {
    const { getByText } = render(
      <ModelPicker models={mockModels} selectedModelId="MobileNetV2" onSelect={jest.fn()} />,
    );
    expect(getByText('MobileNetV2')).toBeTruthy();
    expect(getByText('ResNet50')).toBeTruthy();
  });

  it('calls onSelect when a model is tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <ModelPicker models={mockModels} selectedModelId="MobileNetV2" onSelect={onSelect} />,
    );
    fireEvent.press(getByText('ResNet50'));
    expect(onSelect).toHaveBeenCalledWith('ResNet50');
  });
});
