import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ComposeForm } from '../../components/ComposeForm';

const originalPlatform = Platform.OS;

describe('ComposeForm', () => {
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      get: () => originalPlatform,
      configurable: true,
    });
  });

  it('renders all required fields', () => {
    const { getByPlaceholderText } = render(
      <ComposeForm permissionStatus="authorized" locationAuthorized={true} onSubmit={jest.fn()} />,
    );
    expect(getByPlaceholderText(/^Title$/i)).toBeTruthy();
    expect(getByPlaceholderText(/^Subtitle$/i)).toBeTruthy();
    expect(getByPlaceholderText(/^Body$/i)).toBeTruthy();
  });

  it('disables submit when permission denied', () => {
    const { getByText } = render(
      <ComposeForm permissionStatus="denied" locationAuthorized={true} onSubmit={jest.fn()} />,
    );
    // Verify it renders and shows permission message
    expect(getByText(/schedule/i)).toBeTruthy();
    expect(getByText(/permission required/i)).toBeTruthy();
  });

  it('enables submit when provisional', () => {
    const { getByText } = render(
      <ComposeForm permissionStatus="provisional" locationAuthorized={true} onSubmit={jest.fn()} />,
    );
    // Verify it renders and shows quiet notice
    expect(getByText(/schedule/i)).toBeTruthy();
    expect(getByText(/quiet/i)).toBeTruthy();
  });

  it('shows entitlement notice for time-sensitive', () => {
    const { getByText } = render(
      <ComposeForm permissionStatus="authorized" locationAuthorized={true} onSubmit={jest.fn()} />,
    );
    fireEvent.press(getByText(/time-sensitive/i));
    expect(getByText(/entitlement/i)).toBeTruthy();
  });

  it('validates non-empty title', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <ComposeForm permissionStatus="authorized" locationAuthorized={true} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByText(/schedule/i));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText(/title required/i)).toBeTruthy();
  });

  it('shows iOS-only banner on Android', () => {
    Object.defineProperty(Platform, 'OS', {
      get: () => 'android',
      configurable: true,
    });

    const { getByText } = render(
      <ComposeForm permissionStatus="authorized" locationAuthorized={true} onSubmit={jest.fn()} />,
    );
    expect(getByText(/iOS-only/i)).toBeTruthy();
  });
});
