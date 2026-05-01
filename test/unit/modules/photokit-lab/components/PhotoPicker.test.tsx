/**
 * PhotoPicker Component Test
 * Feature: 057-photokit
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import PhotoPicker from '@/modules/photokit-lab/components/PhotoPicker';

describe('PhotoPicker', () => {
  const noop = jest.fn();

  it('renders the title', () => {
    render(
      <PhotoPicker
        authorizationStatus={null}
        loading={false}
        onRequestAccess={noop}
        onPickPhotos={noop}
        onClear={noop}
      />,
    );
    expect(screen.getByText(/Controls/i)).toBeTruthy();
  });

  it('renders Request Access and Clear buttons', () => {
    render(
      <PhotoPicker
        authorizationStatus={null}
        loading={false}
        onRequestAccess={noop}
        onPickPhotos={noop}
        onClear={noop}
      />,
    );
    expect(screen.getByText(/Request Access/i)).toBeTruthy();
    expect(screen.getByText(/Clear/i)).toBeTruthy();
  });

  it('calls onRequestAccess when button pressed', () => {
    const onRequestAccess = jest.fn();
    render(
      <PhotoPicker
        authorizationStatus={null}
        loading={false}
        onRequestAccess={onRequestAccess}
        onPickPhotos={noop}
        onClear={noop}
      />,
    );
    fireEvent.press(screen.getByText(/Request Access/i));
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
  });

  it('shows "Opening Picker…" when loading', () => {
    render(
      <PhotoPicker
        authorizationStatus='authorized'
        loading={true}
        onRequestAccess={noop}
        onPickPhotos={noop}
        onClear={noop}
      />,
    );
    expect(screen.getByText(/Opening Picker/i)).toBeTruthy();
  });

  it('calls onPickPhotos when status is authorized', () => {
    const onPickPhotos = jest.fn();
    render(
      <PhotoPicker
        authorizationStatus='authorized'
        loading={false}
        onRequestAccess={noop}
        onPickPhotos={onPickPhotos}
        onClear={noop}
      />,
    );
    fireEvent.press(screen.getByText(/Pick Photos/i));
    expect(onPickPhotos).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when clear button pressed', () => {
    const onClear = jest.fn();
    render(
      <PhotoPicker
        authorizationStatus={null}
        loading={false}
        onRequestAccess={noop}
        onPickPhotos={noop}
        onClear={onClear}
      />,
    );
    fireEvent.press(screen.getByText(/Clear/i));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
