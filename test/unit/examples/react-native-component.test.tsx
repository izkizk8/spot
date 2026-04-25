import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { HintRow } from '@/components/hint-row';

describe('HintRow', () => {
  it('renders project themed components with React Native Testing Library', () => {
    render(<HintRow title="Open file" hint="src/app/index.tsx" />);

    expect(screen.getByText('Open file')).toBeTruthy();
    expect(screen.getByText('src/app/index.tsx')).toBeTruthy();
  });
});
