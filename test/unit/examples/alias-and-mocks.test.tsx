import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import * as Font from 'expo-font';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'dark',
}));

describe('aliases and shared test setup', () => {
  it('resolves project aliases and uses shared Expo mocks', () => {
    expect(Font.isLoaded('Inter')).toBe(true);

    render(<ThemedText themeColor='text'>Alias import works</ThemedText>);

    expect(screen.getByText('Alias import works').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: Colors.dark.text })]),
    );
  });
});
