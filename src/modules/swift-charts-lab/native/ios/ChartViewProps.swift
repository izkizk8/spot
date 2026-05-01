/**
 * ChartViewProps.swift — Props structure for SwiftChartsLabChartView
 *
 * Per research.md Decision 1, this extends UIBaseViewProps to expose
 * the JS-passed props as observed Swift properties.
 *
 * On-device verification: specs/012-swift-charts-playground/quickstart.md §1
 */

import ExpoModulesCore
import SwiftUI

struct Datum: Decodable {
  let month: String
  let value: Double
}

class ChartViewProps: UIBaseViewProps {
  @Field var type: String = "line"
  @Field var data: [Datum] = []
  @Field var tint: String = "#007AFF"
  @Field var gradientEnabled: Bool = false
  @Field var selectedIndex: Int? = nil
}
