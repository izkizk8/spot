/**
 * @file AnimatedSymbol.test.tsx
 * @description Tests for AnimatedSymbol wrapper component (T008)
 * Per contracts/animated-symbol.md and contracts/test-plan.md.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AnimatedSymbol } from '@/modules/sf-symbols-lab/components/AnimatedSymbol';

// Mock expo-symbols
jest.mock('expo-symbols', () => {
  const ReactLib = require('react');
  const SymbolView = jest.fn(({ name, tintColor, size, animationSpec }) =>
    ReactLib.createElement('View', {
      testID: 'symbol-view-mock',
      'data-name': name,
      'data-tint': String(tintColor),
      'data-size': size,
      'data-animation-spec': JSON.stringify(animationSpec ?? null),
    }),
  );
  return { SymbolView };
});

// Store mock reference for assertions
const { SymbolView: SymbolViewMock } = require('expo-symbols');

describe('AnimatedSymbol', () => {
  const defaultProps = {
    name: 'heart.fill',
    effect: 'bounce' as const,
    speed: 'normal' as const,
    repeat: 'once' as const,
    tintColor: '#FF0000',
    size: 24,
    playToken: 0,
  };

  beforeEach(() => {
    // Reset to iOS by default
    Platform.OS = 'ios';
  });

  describe('iOS platform - native effects', () => {
    beforeEach(() => {
      (SymbolViewMock as jest.Mock).mockClear();
    });

    it('passes undefined animationSpec when playToken is 0', () => {
      render(<AnimatedSymbol {...defaultProps} playToken={0} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toBeUndefined();
    });

    it('passes bounce animationSpec with normal speed and once repeat', () => {
      render(
        <AnimatedSymbol
          {...defaultProps}
          effect='bounce'
          speed='normal'
          repeat='once'
          playToken={1}
        />,
      );

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toEqual({
        effect: { type: 'bounce' },
        repeating: false,
        repeatCount: undefined,
        speed: 1.0,
      });
    });

    it('passes bounce animationSpec with fast speed and thrice repeat', () => {
      render(
        <AnimatedSymbol
          {...defaultProps}
          effect='bounce'
          speed='fast'
          repeat='thrice'
          playToken={1}
        />,
      );

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toEqual({
        effect: { type: 'bounce' },
        repeating: true,
        repeatCount: 3,
        speed: 2.0,
      });
    });

    it('passes bounce animationSpec with slow speed and indefinite repeat', () => {
      render(
        <AnimatedSymbol
          {...defaultProps}
          effect='bounce'
          speed='slow'
          repeat='indefinite'
          playToken={1}
        />,
      );

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toEqual({
        effect: { type: 'bounce' },
        repeating: true,
        repeatCount: undefined,
        speed: 0.5,
      });
    });

    it('passes pulse animationSpec', () => {
      render(<AnimatedSymbol {...defaultProps} effect='pulse' playToken={1} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec.effect.type).toBe('pulse');
      expect(callArgs.animationSpec.speed).toBe(1.0);
      expect(callArgs.animationSpec.repeating).toBe(false);
    });

    it('passes scale animationSpec', () => {
      render(<AnimatedSymbol {...defaultProps} effect='scale' playToken={1} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec.effect.type).toBe('scale');
    });

    it('passes variableAnimationSpec for variable-color effect', () => {
      render(<AnimatedSymbol {...defaultProps} effect='variable-color' playToken={1} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec.variableAnimationSpec).toEqual({
        iterative: true,
        reversing: true,
      });
      expect(callArgs.animationSpec.repeating).toBe(false);
      expect(callArgs.animationSpec.speed).toBe(1.0);
    });

    it('handles replace effect (emulated via wrapper)', () => {
      render(
        <AnimatedSymbol
          {...defaultProps}
          effect='replace'
          secondaryName='star.fill'
          playToken={1}
        />,
      );

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toBeUndefined();
    });

    it('handles appear effect (emulated via wrapper)', () => {
      render(<AnimatedSymbol {...defaultProps} effect='appear' playToken={1} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toBeUndefined();
    });

    it('handles disappear effect (emulated via wrapper)', () => {
      render(<AnimatedSymbol {...defaultProps} effect='disappear' playToken={1} />);

      expect(SymbolViewMock).toHaveBeenCalled();
      const callArgs = (SymbolViewMock as jest.Mock).mock.calls[0][0];
      expect(callArgs.animationSpec).toBeUndefined();
    });
  });

  describe('Non-iOS platform - plain text fallback', () => {
    beforeEach(() => {
      Platform.OS = 'web';
      (SymbolViewMock as jest.Mock).mockClear();
    });

    it('renders plain text glyph instead of SymbolView on web', () => {
      render(<AnimatedSymbol {...defaultProps} />);

      // Should show the symbol name as text
      expect(screen.getByText('heart.fill')).toBeTruthy();
      // Should not render SymbolView mock
      expect(SymbolViewMock).not.toHaveBeenCalled();
    });

    it('applies tintColor to the text fallback', () => {
      render(<AnimatedSymbol {...defaultProps} tintColor='#00FF00' />);

      const textElement = screen.getByText('heart.fill');
      const styles = textElement.props.style;
      // Check that color is applied (may be in array or object)
      const flatStyle = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;
      expect(flatStyle.color).toBe('#00FF00');
    });

    it('renders fallback on Android platform', () => {
      Platform.OS = 'android';
      render(<AnimatedSymbol {...defaultProps} />);

      expect(screen.getByText('heart.fill')).toBeTruthy();
      expect(SymbolViewMock).not.toHaveBeenCalled();
    });
  });
});
