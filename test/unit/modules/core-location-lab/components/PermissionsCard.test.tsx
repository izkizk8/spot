/**
 * Tests for PermissionsCard component (feature 025)
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { PermissionsCard } from '@/modules/core-location-lab/components/PermissionsCard';

describe('PermissionsCard', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openSettings').mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('renders status pill for undetermined status', () => {
    render(<PermissionsCard status='undetermined' onRequest={jest.fn()} />);

    expect(screen.getByText('Not determined')).toBeTruthy();
  });

  it('renders status pill for granted-when-in-use status', () => {
    render(<PermissionsCard status='granted' onRequest={jest.fn()} />);

    expect(screen.getByText('When in use')).toBeTruthy();
  });

  it('renders status pill for denied status', () => {
    render(<PermissionsCard status='denied' onRequest={jest.fn()} />);

    expect(screen.getByText('Denied')).toBeTruthy();
  });

  it('Request button calls onRequest when tapped', () => {
    const onRequest = jest.fn();
    render(<PermissionsCard status='undetermined' onRequest={onRequest} />);

    const requestButton = screen.getByText('Request');
    fireEvent.press(requestButton);

    expect(onRequest).toHaveBeenCalled();
  });

  it('Request button is disabled when status is denied', () => {
    const onRequest = jest.fn();
    render(<PermissionsCard status='denied' onRequest={onRequest} />);

    const requestButton = screen.getByText('Request');
    fireEvent.press(requestButton);

    // onRequest should not be called when disabled
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('Open Settings link calls Linking.openSettings() when tapped', async () => {
    render(<PermissionsCard status='denied' onRequest={jest.fn()} />);

    const settingsLink = screen.getByText('Open Settings');
    fireEvent.press(settingsLink);

    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it('renders the title "Permissions"', () => {
    render(<PermissionsCard status='undetermined' onRequest={jest.fn()} />);

    expect(screen.getByText('Permissions')).toBeTruthy();
  });
});
