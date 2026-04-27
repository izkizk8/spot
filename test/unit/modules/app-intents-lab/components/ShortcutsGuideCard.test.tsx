import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { ShortcutsGuideCard } from '@/modules/app-intents-lab/components/ShortcutsGuideCard';

describe('ShortcutsGuideCard', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a heading mentioning Shortcuts integration', () => {
    const { getByText } = render(<ShortcutsGuideCard />);
    expect(getByText(/Shortcuts integration/i)).toBeTruthy();
  });

  it('renders a numbered step list naming each intent surface', () => {
    const { getByText, getAllByText } = render(<ShortcutsGuideCard />);
    // Numbered items 1, 2, 3, 4 visible
    expect(getByText(/^1\./)).toBeTruthy();
    expect(getByText(/^2\./)).toBeTruthy();
    expect(getByText(/^3\./)).toBeTruthy();
    expect(getByText(/^4\./)).toBeTruthy();
    // Mention each intent name somewhere
    expect(getAllByText(/Log mood/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Get last mood/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Greet user/i).length).toBeGreaterThan(0);
  });

  it('exposes a primary "Open Shortcuts app" button', () => {
    const { getByLabelText } = render(<ShortcutsGuideCard />);
    expect(getByLabelText('Open Shortcuts app')).toBeTruthy();
  });

  it('press invokes onOpenShortcuts when supplied', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = render(<ShortcutsGuideCard onOpenShortcuts={fn} />);
    fireEvent.press(getByLabelText('Open Shortcuts app'));
    // Allow microtasks to flush
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('with no onOpenShortcuts, press calls Linking.openURL("shortcuts://")', async () => {
    const { getByLabelText } = render(<ShortcutsGuideCard />);
    fireEvent.press(getByLabelText('Open Shortcuts app'));
    await Promise.resolve();
    await Promise.resolve();
    expect(Linking.openURL).toHaveBeenCalledWith('shortcuts://');
  });

  it('Linking.openURL rejection surfaces an inline error and does not crash', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no shortcuts'));
    const { getByLabelText, findByTestId } = render(<ShortcutsGuideCard />);
    fireEvent.press(getByLabelText('Open Shortcuts app'));
    const err = await findByTestId('shortcuts-error');
    expect(err).toBeTruthy();
  });
});
