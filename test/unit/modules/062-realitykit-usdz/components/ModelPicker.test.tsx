/**
 * ModelPicker Component Tests
 * Feature: 062-realitykit-usdz
 */
import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import ModelPicker from '@/modules/062-realitykit-usdz/components/ModelPicker';

describe('ModelPicker', () => {
  it('renders heading', () => {
    render(<ModelPicker value="toy_drummer" onChange={jest.fn()} />);
    expect(screen.getByText(/Select Model/i)).toBeTruthy();
  });

  it('renders all three models', () => {
    render(<ModelPicker value="toy_drummer" onChange={jest.fn()} />);
    expect(screen.getByText(/Toy Drummer/i)).toBeTruthy();
    expect(screen.getByText(/Toy Biplane/i)).toBeTruthy();
    expect(screen.getByText(/Gramophone/i)).toBeTruthy();
  });

  it('calls onChange with the correct id when a model is pressed', () => {
    const onChange = jest.fn();
    render(<ModelPicker value="toy_drummer" onChange={onChange} />);
    fireEvent.press(screen.getByText(/Toy Biplane/i));
    expect(onChange).toHaveBeenCalledWith('toy_biplane');
  });
});
