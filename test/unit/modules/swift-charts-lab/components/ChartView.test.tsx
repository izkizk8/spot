/**
 * T006: ChartView.test.tsx — iOS variant test
 *
 * Tests the iOS ChartView wrapper that bridges @expo/ui/swift-ui Host
 * to the local Swift extension. Must FAIL before T009 implements it.
 */

import { render } from '@testing-library/react-native';
import { initialDataset, TINTS } from '@/modules/swift-charts-lab/data';

// Mock @expo/ui/swift-ui Host as a passthrough
jest.mock('@expo/ui/swift-ui', () => {
  return {
    Host: ({ children }: any) => children,
  };
});

// Mock the native view manager to return a recording View
jest.mock('expo-modules-core', () => {
  const ReactImpl = require('react');
  const { View: ViewImpl, StyleSheet } = require('react-native');
  const actual = jest.requireActual('expo-modules-core');
  return {
    ...actual,
    requireNativeViewManager: jest.fn(() => {
      return (props: any) => {
        // Flatten style array for test assertions
        const flatStyle = props.style ? StyleSheet.flatten(props.style) : {};
        return ReactImpl.createElement(ViewImpl, {
          ...props,
          style: flatStyle,
          testID: 'native-chart-view',
        });
      };
    }),
  };
});

// Import after mocks are set up
import { ChartView } from '@/modules/swift-charts-lab/components/ChartView';

describe('ChartView (iOS)', () => {
  it('renders the native view inside Host with correct props', () => {
    const data = initialDataset();
    const { getByTestId } = render(
      <ChartView
        type="line"
        data={data}
        tint={TINTS[0]}
        gradientEnabled={false}
        testID="chart-test"
      />,
    );

    const nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.type).toBe('line');
    expect(nativeView.props.data).toEqual(data);
    expect(nativeView.props.tint).toBe('#007AFF'); // TINTS[0].value
    expect(nativeView.props.gradientEnabled).toBe(false);
  });

  it('forwards tint.value (hex string) not the full Tint object', () => {
    const data = initialDataset();
    const { getByTestId } = render(
      <ChartView
        type="bar"
        data={data}
        tint={TINTS[1]} // green
        gradientEnabled={false}
      />,
    );

    const nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.tint).toBe('#34C759');
  });

  it('re-renders with new type when prop changes', () => {
    const data = initialDataset();
    const { getByTestId, rerender } = render(
      <ChartView type="line" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    let nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.type).toBe('line');

    rerender(<ChartView type="bar" data={data} tint={TINTS[0]} gradientEnabled={false} />);

    nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.type).toBe('bar');
  });

  it('forwards selectedIndex and onSelect to native view', () => {
    const data = initialDataset();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <ChartView
        type="line"
        data={data}
        tint={TINTS[0]}
        gradientEnabled={false}
        selectedIndex={3}
        onSelect={onSelect}
      />,
    );

    const nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.selectedIndex).toBe(3);

    // Simulate native event
    if (nativeView.props.onSelect) {
      nativeView.props.onSelect({ nativeEvent: { index: 5 } });
    }
    expect(onSelect).toHaveBeenCalledWith(5);
  });

  it('calls onSelect with null when native emits null', () => {
    const data = initialDataset();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <ChartView
        type="line"
        data={data}
        tint={TINTS[0]}
        gradientEnabled={false}
        selectedIndex={3}
        onSelect={onSelect}
      />,
    );

    const nativeView = getByTestId('native-chart-view');
    if (nativeView.props.onSelect) {
      nativeView.props.onSelect({ nativeEvent: { index: null } });
    }
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('honors minHeight prop (default 300)', () => {
    const data = initialDataset();
    const { getByTestId, rerender } = render(
      <ChartView type="line" data={data} tint={TINTS[0]} gradientEnabled={false} />,
    );

    let nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.style.minHeight).toBe(300);

    rerender(
      <ChartView type="line" data={data} tint={TINTS[0]} gradientEnabled={false} minHeight={400} />,
    );

    nativeView = getByTestId('native-chart-view');
    expect(nativeView.props.style.minHeight).toBe(400);
  });
});
