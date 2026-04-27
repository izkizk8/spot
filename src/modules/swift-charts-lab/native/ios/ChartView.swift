/**
 * ChartView.swift — Swift body for SwiftChartsLabChartView
 *
 * Per research.md Decision 1 and quickstart.md §1, this is a ChartView: ExpoView
 * whose body renders a SwiftUI Chart { ForEach ... LineMark / BarMark / AreaMark / PointMark }
 * driven by the observed props.
 *
 * On-device verification steps:
 *   - specs/012-swift-charts-playground/quickstart.md §1 (chart renders)
 *   - §2 (chart-type switching animates marks)
 *   - §3 (dataset mutations animate)
 *   - §5 (tint recolors marks < 300ms)
 *   - §6 (gradient applies to line/area, no-op on bar/point)
 */

import SwiftUI
import Charts
import ExpoModulesCore

@available(iOS 16.0, *)
class ChartView: ExpoView {
  let props = ChartViewProps()
  
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    
    let hostingController = UIHostingController(rootView: ChartBody(props: props))
    hostingController.view.backgroundColor = .clear
    addSubview(hostingController.view)
    
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      hostingController.view.topAnchor.constraint(equalTo: topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      hostingController.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
  }
}

@available(iOS 16.0, *)
struct ChartBody: View {
  @ObservedObject var props: ChartViewProps
  
  var tintColor: Color {
    Color(hex: props.tint) ?? .blue
  }
  
  var body: some View {
    Chart {
      ForEach(Array(props.data.enumerated()), id: \.offset) { index, point in
        switch props.type {
        case "bar":
          BarMark(
            x: .value("Month", point.month),
            y: .value("Value", point.value)
          )
        case "area":
          AreaMark(
            x: .value("Month", point.month),
            y: .value("Value", point.value)
          )
        case "point":
          PointMark(
            x: .value("Month", point.month),
            y: .value("Value", point.value)
          )
        default: // "line"
          LineMark(
            x: .value("Month", point.month),
            y: .value("Value", point.value)
          )
        }
      }
      .foregroundStyle(
        props.gradientEnabled && (props.type == "line" || props.type == "area")
          ? AnyShapeStyle(LinearGradient(
              colors: [tintColor, tintColor.opacity(0.2)],
              startPoint: .top,
              endPoint: .bottom
            ))
          : AnyShapeStyle(tintColor)
      )
    }
    .animation(.easeInOut(duration: 0.3), value: props.data.map(\.value))
    .animation(.easeInOut(duration: 0.3), value: props.type)
  }
}

extension Color {
  init?(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let a, r, g, b: UInt64
    switch hex.count {
    case 3: // RGB (12-bit)
      (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
    case 6: // RGB (24-bit)
      (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
    case 8: // ARGB (32-bit)
      (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
    default:
      return nil
    }
    self.init(
      .sRGB,
      red: Double(r) / 255,
      green: Double(g) / 255,
      blue: Double(b) / 255,
      opacity: Double(a) / 255
    )
  }
}
