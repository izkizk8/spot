/**
 * ChartViewModule.swift — Module definition for SwiftChartsLabChartView
 *
 * Registers the view as 'SwiftChartsLabChartView' so JS's
 * requireNativeViewManager('SwiftChartsLabChartView') resolves it.
 *
 * On-device verification: specs/012-swift-charts-playground/quickstart.md §1
 */

import ExpoModulesCore

public class ChartViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SwiftChartsLabChartView")
    
    View(ChartView.self) {
      Events("onSelect")
      
      Prop("type") { (view, type: String) in
        view.props.type = type
      }
      
      Prop("data") { (view, data: [[String: Any]]) in
        let decoder = JSONDecoder()
        view.props.data = data.compactMap { dict in
          guard let jsonData = try? JSONSerialization.data(withJSONObject: dict),
                let datum = try? decoder.decode(Datum.self, from: jsonData) else {
            return nil
          }
          return datum
        }
      }
      
      Prop("tint") { (view, tint: String) in
        view.props.tint = tint
      }
      
      Prop("gradientEnabled") { (view, enabled: Bool) in
        view.props.gradientEnabled = enabled
      }
      
      Prop("selectedIndex") { (view, index: Int?) in
        view.props.selectedIndex = index
      }
    }
  }
}
