/**
 * ConflictDemo Test
 * Feature: 052-core-data-cloudkit
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import ConflictDemo from '@/modules/coredata-cloudkit-lab/components/ConflictDemo';

const note = {
  id: 'a',
  title: 't',
  body: 'b',
  createdAt: 1,
  updatedAt: 2,
};

describe('ConflictDemo', () => {
  it('renders the explanatory copy', () => {
    render(<ConflictDemo selected={null} onTrigger={jest.fn()} />);
    expect(screen.getByText(/last-write-wins/i)).toBeTruthy();
  });

  it('does not invoke onTrigger when no note is selected', () => {
    const onTrigger = jest.fn();
    render(<ConflictDemo selected={null} onTrigger={onTrigger} />);
    fireEvent.press(screen.getByText(/Simulate Conflict/i));
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('invokes onTrigger with the selected id', () => {
    const onTrigger = jest.fn();
    render(<ConflictDemo selected={note} onTrigger={onTrigger} />);
    fireEvent.press(screen.getByText(/Simulate Conflict/i));
    expect(onTrigger).toHaveBeenCalledWith('a');
  });
});
