/**
 * ImageSourcePicker component tests (feature 016).
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageSourcePicker } from '@/modules/coreml-lab/components/ImageSourcePicker';

jest.mock('expo-image-picker');

describe('ImageSourcePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sample and library buttons', () => {
    const { getByText } = render(<ImageSourcePicker onSourceChange={jest.fn()} />);
    expect(getByText('Pick a sample image')).toBeTruthy();
    expect(getByText('Pick from Photo Library')).toBeTruthy();
  });

  it('calls onSourceChange when sample button is pressed', () => {
    const onSourceChange = jest.fn();
    const { getByText } = render(<ImageSourcePicker onSourceChange={onSourceChange} />);
    fireEvent.press(getByText('Pick a sample image'));
    expect(onSourceChange).toHaveBeenCalledWith('sample');
  });

  it('launches photo library picker when library button is pressed', async () => {
    const mockLaunch = ImagePicker.launchImageLibraryAsync as jest.Mock;
    const mockPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;

    mockPermission.mockResolvedValue({ status: 'granted' });
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ base64: 'test-base64', uri: 'test-uri' }],
    });

    const onImagePicked = jest.fn();
    const { getByText } = render(
      <ImageSourcePicker onSourceChange={jest.fn()} onImagePicked={onImagePicked} />,
    );

    fireEvent.press(getByText('Pick from Photo Library'));

    await waitFor(() => {
      expect(mockPermission).toHaveBeenCalled();
      expect(mockLaunch).toHaveBeenCalled();
    });
  });

  it('calls onPermissionDenied when permission is denied', async () => {
    const mockPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
    mockPermission.mockResolvedValue({ status: 'denied' });

    const onPermissionDenied = jest.fn();
    const { getByText } = render(
      <ImageSourcePicker onSourceChange={jest.fn()} onPermissionDenied={onPermissionDenied} />,
    );

    fireEvent.press(getByText('Pick from Photo Library'));

    await waitFor(() => {
      expect(onPermissionDenied).toHaveBeenCalled();
    });
  });
});
