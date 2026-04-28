/**
 * Test suite for CapabilitiesCard component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import CapabilitiesCard from '@/modules/local-auth-lab/components/CapabilitiesCard';
import { AuthenticationType, SecurityLevel } from 'expo-local-authentication';

jest.mock('expo-local-authentication');

describe('CapabilitiesCard', () => {
  it('renders Loading when capabilities is null', () => {
    const { getByText } = render(<CapabilitiesCard capabilities={null} onRefresh={() => {}} />);
    expect(getByText(/Loading/)).toBeTruthy();
  });

  it('renders all four rows when capabilities is provided', () => {
    const { getByTestId } = render(
      <CapabilitiesCard
        capabilities={{
          hasHardware: true,
          isEnrolled: true,
          types: [AuthenticationType.FACIAL_RECOGNITION, AuthenticationType.FINGERPRINT],
          securityLevel: SecurityLevel.BIOMETRIC_STRONG,
        }}
        onRefresh={() => {}}
      />,
    );
    expect(getByTestId('localauth-cap-hardware')).toHaveTextContent(/Available/);
    expect(getByTestId('localauth-cap-enrolled')).toHaveTextContent(/Yes/);
    expect(getByTestId('localauth-cap-types')).toHaveTextContent(/Face ID/);
    expect(getByTestId('localauth-cap-types')).toHaveTextContent(/Touch ID/);
    expect(getByTestId('localauth-cap-level')).toHaveTextContent(/Biometric \(strong\)/);
  });

  it('renders "Not available" / "No" / "None" when device lacks biometrics', () => {
    const { getByTestId } = render(
      <CapabilitiesCard
        capabilities={{
          hasHardware: false,
          isEnrolled: false,
          types: [],
          securityLevel: SecurityLevel.NONE,
        }}
        onRefresh={() => {}}
      />,
    );
    expect(getByTestId('localauth-cap-hardware')).toHaveTextContent(/Not available/);
    expect(getByTestId('localauth-cap-enrolled')).toHaveTextContent(/No/);
    expect(getByTestId('localauth-cap-types')).toHaveTextContent(/None/);
    expect(getByTestId('localauth-cap-level')).toHaveTextContent(/None/);
  });

  it('invokes onRefresh when the refresh button is pressed', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(<CapabilitiesCard capabilities={null} onRefresh={onRefresh} />);
    fireEvent.press(getByTestId('localauth-cap-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
