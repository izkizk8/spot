/**
 * WeatherKitBridge.swift
 * Feature: 046-weatherkit
 *
 * Expo Module wrapping `WeatherService.shared`. JS surface mirrors
 * `src/native/weatherkit.ts`.
 *
 * NOTE: WeatherKit requires the Apple-issued
 * `com.apple.developer.weatherkit` entitlement. Without it, every
 * call resolves to a thrown `WeatherKitDisabled` error from the
 * underlying SDK. The bridge surfaces those errors as standard
 * JS rejections.
 */

import ExpoModulesCore
import CoreLocation
#if canImport(WeatherKit)
import WeatherKit
#endif

@available(iOS 16.0, *)
public class WeatherKitBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("WeatherKitBridge")

    Function("isAvailable") { () -> Bool in
      #if canImport(WeatherKit)
      return true
      #else
      return false
      #endif
    }

    AsyncFunction("getCurrent") { (lat: Double, lng: Double, _ units: String) -> [String: Any] in
      #if canImport(WeatherKit)
      let location = CLLocation(latitude: lat, longitude: lng)
      let weather = try await WeatherService.shared.weather(for: location)
      let current = weather.currentWeather
      return [
        "temperature": current.temperature.value,
        "apparentTemperature": current.apparentTemperature.value,
        "condition": String(describing: current.condition),
        "conditionLabel": current.condition.description,
        "humidity": current.humidity,
        "windSpeed": current.wind.speed.value,
        "windDirection": current.wind.direction.value,
        "uvIndex": Double(current.uvIndex.value),
        "isDaylight": current.isDaylight,
      ]
      #else
      throw NSError(domain: "WeatherKitBridge", code: -1)
      #endif
    }

    AsyncFunction("getHourly") { (lat: Double, lng: Double, _ units: String) -> [[String: Any]] in
      #if canImport(WeatherKit)
      let location = CLLocation(latitude: lat, longitude: lng)
      let weather = try await WeatherService.shared.weather(for: location)
      let hourly = Array(weather.hourlyForecast.forecast.prefix(24))
      let iso = ISO8601DateFormatter()
      return hourly.map { hour in
        [
          "date": iso.string(from: hour.date),
          "temperature": hour.temperature.value,
          "condition": String(describing: hour.condition),
          "precipitationChance": hour.precipitationChance,
        ]
      }
      #else
      throw NSError(domain: "WeatherKitBridge", code: -1)
      #endif
    }

    AsyncFunction("getDaily") { (lat: Double, lng: Double, _ units: String) -> [[String: Any]] in
      #if canImport(WeatherKit)
      let location = CLLocation(latitude: lat, longitude: lng)
      let weather = try await WeatherService.shared.weather(for: location)
      let daily = Array(weather.dailyForecast.forecast.prefix(10))
      let iso = ISO8601DateFormatter()
      return daily.map { day in
        [
          "date": iso.string(from: day.date),
          "highTemperature": day.highTemperature.value,
          "lowTemperature": day.lowTemperature.value,
          "condition": String(describing: day.condition),
          "precipitationChance": day.precipitationChance,
        ]
      }
      #else
      throw NSError(domain: "WeatherKitBridge", code: -1)
      #endif
    }

    AsyncFunction("getAlerts") { (lat: Double, lng: Double) -> [[String: Any]] in
      #if canImport(WeatherKit)
      let location = CLLocation(latitude: lat, longitude: lng)
      let weather = try await WeatherService.shared.weather(for: location)
      let alerts = weather.weatherAlerts ?? []
      let iso = ISO8601DateFormatter()
      return alerts.map { alert in
        [
          "id": alert.id,
          "title": alert.summary,
          "summary": alert.summary,
          "severity": String(describing: alert.severity),
          "source": alert.source,
          "issuedAt": iso.string(from: Date()),
          "expiresAt": NSNull(),
          "detailsUrl": alert.detailsURL.absoluteString,
        ]
      }
      #else
      throw NSError(domain: "WeatherKitBridge", code: -1)
      #endif
    }

    AsyncFunction("getAttribution") { () -> [String: String] in
      #if canImport(WeatherKit)
      let attribution = try await WeatherService.shared.attribution
      return [
        "serviceName": attribution.serviceName,
        "logoLightUrl": attribution.combinedMarkLightURL.absoluteString,
        "logoDarkUrl": attribution.combinedMarkDarkURL.absoluteString,
        "legalPageUrl": attribution.legalPageURL.absoluteString,
      ]
      #else
      throw NSError(domain: "WeatherKitBridge", code: -1)
      #endif
    }
  }
}
