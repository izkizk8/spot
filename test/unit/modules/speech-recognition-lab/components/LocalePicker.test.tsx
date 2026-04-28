/**
 * T048: LocalePicker tests (US3).
 *
 * Coverage:
 *   - Renders the top-6 list filtered against `availableLocales`
 *   - Disabled chips for unsupported locales
 *   - Tapping enabled chip invokes onLocaleChange
 *   - Disabled prop renders all chips inert
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import LocalePicker from '@/modules/speech-recognition-lab/components/LocalePicker';
import { TOP_LOCALES } from '@/modules/speech-recognition-lab/speech-types';

function findChip(root: any, locale: string) {
  const buttons = root.findAll((n: any) => n.props && n.props.accessibilityRole === 'button');
  for (const b of buttons) {
    const al = String(b.props.accessibilityLabel ?? '');
    if (al.includes(locale)) return b;
  }
  return null;
}

describe('LocalePicker (US3)', () => {
  it('renders all top-6 locales by default', () => {
    const view = render(<LocalePicker locale="en-US" onLocaleChange={jest.fn()} />);
    for (const loc of TOP_LOCALES) {
      expect(findChip(view.UNSAFE_root, loc)).toBeTruthy();
    }
  });

  it('reflects the `locale` prop in the selected chip', () => {
    const view = render(<LocalePicker locale="ja-JP" onLocaleChange={jest.fn()} />);
    const ja = findChip(view.UNSAFE_root, 'ja-JP');
    expect(ja.props.accessibilityState).toMatchObject({ selected: true });
    const en = findChip(view.UNSAFE_root, 'en-US');
    expect(en.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('tapping an enabled chip invokes onLocaleChange exactly once', () => {
    const onLocaleChange = jest.fn();
    const view = render(<LocalePicker locale="en-US" onLocaleChange={onLocaleChange} />);
    const ja = findChip(view.UNSAFE_root, 'ja-JP');
    fireEvent.press(ja);
    expect(onLocaleChange).toHaveBeenCalledTimes(1);
    expect(onLocaleChange).toHaveBeenCalledWith('ja-JP');
  });

  describe('availableLocales filtering', () => {
    it('renders all top-6 locales but disables those not in availableLocales', () => {
      const view = render(
        <LocalePicker
          locale="en-US"
          availableLocales={['en-US', 'ja-JP']}
          onLocaleChange={jest.fn()}
        />,
      );
      // All top-6 chips still present, but unsupported ones are disabled.
      const chipStates = TOP_LOCALES.map((loc) => {
        const chip = findChip(view.UNSAFE_root, loc);
        return {
          locale: loc,
          disabled: chip?.props.accessibilityState?.disabled === true,
          expected: loc !== 'en-US' && loc !== 'ja-JP', // not available → disabled
        };
      });

      for (const { locale, disabled, expected } of chipStates) {
        expect(disabled).toBe(expected);
        void locale; // used for debugging context
      }
    });

    it('tapping a disabled (unsupported) chip is a no-op', () => {
      const onLocaleChange = jest.fn();
      const view = render(
        <LocalePicker
          locale="en-US"
          availableLocales={['en-US']}
          onLocaleChange={onLocaleChange}
        />,
      );
      const fr = findChip(view.UNSAFE_root, 'fr-FR');
      fireEvent.press(fr);
      expect(onLocaleChange).not.toHaveBeenCalled();
    });

    it('tapping a supported chip still invokes onLocaleChange', () => {
      const onLocaleChange = jest.fn();
      const view = render(
        <LocalePicker
          locale="en-US"
          availableLocales={['en-US', 'ja-JP']}
          onLocaleChange={onLocaleChange}
        />,
      );
      const ja = findChip(view.UNSAFE_root, 'ja-JP');
      fireEvent.press(ja);
      expect(onLocaleChange).toHaveBeenCalledWith('ja-JP');
    });
  });

  describe('disabled prop', () => {
    it('marks every chip as disabled when disabled=true', () => {
      const view = render(<LocalePicker locale="en-US" onLocaleChange={jest.fn()} disabled />);
      for (const loc of TOP_LOCALES) {
        const chip = findChip(view.UNSAFE_root, loc);
        expect(chip.props.accessibilityState).toMatchObject({ disabled: true });
      }
    });

    it('tapping any chip is a no-op when disabled=true', () => {
      const onLocaleChange = jest.fn();
      const view = render(<LocalePicker locale="en-US" onLocaleChange={onLocaleChange} disabled />);
      const ja = findChip(view.UNSAFE_root, 'ja-JP');
      fireEvent.press(ja);
      expect(onLocaleChange).not.toHaveBeenCalled();
    });
  });
});
