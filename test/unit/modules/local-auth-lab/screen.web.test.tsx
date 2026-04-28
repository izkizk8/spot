/**
 * Test suite for Local Auth screen (Web).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import LocalAuthScreen from '@/modules/local-auth-lab/screen.web';

jest.mock('expo-local-authentication');

const mockLocalAuth = jest.requireMock(
  'expo-local-authentication',
) as typeof import('../../../__mocks__/expo-local-authentication');

describe('LocalAuthScreen (Web)', () => {
  beforeEach(() => {
    mockLocalAuth.__reset();
  });

  it('renders the IOSOnlyBanner', () => {
    const { getByText } = render(<LocalAuthScreen />);
    expect(getByText(/Local Authentication is unavailable on the Web/)).toBeTruthy();
  });

  it('renders disabled UI', () => {
    const { getByTestId } = render(<LocalAuthScreen />);
    expect(getByTestId('localauth-authenticate')).toBeTruthy();
  });

  it('never calls authenticateAsync', () => {
    render(<LocalAuthScreen />);
    expect(mockLocalAuth.authenticateAsync).not.toHaveBeenCalled();
  });

  it('never calls hasHardwareAsync', () => {
    render(<LocalAuthScreen />);
    expect(mockLocalAuth.hasHardwareAsync).not.toHaveBeenCalled();
  });
});
