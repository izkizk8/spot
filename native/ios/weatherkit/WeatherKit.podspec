require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'WeatherKit'
  s.version        = '1.0.0'
  s.summary        = 'Expo Module wrapping WeatherService for the WeatherKit Lab.'
  s.description    = 'Feature 046 — bridges Apple WeatherKit (WeatherService.shared) into JS via the Expo Modules API.'
  s.author         = 'Spot'
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.license        = 'MIT'
  s.platform       = :ios, '16.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.swift'
  s.frameworks = 'WeatherKit', 'CoreLocation'
end
