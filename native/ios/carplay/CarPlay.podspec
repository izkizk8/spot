require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'CarPlay'
  s.version        = '1.0.0'
  s.summary        = 'Expo Module scaffolding a CarPlay scene delegate for the CarPlay Lab.'
  s.description    = 'Feature 045 — bridges CarPlay (CPTemplateApplicationScene) into JS via the Expo Modules API. The bridge throws CarPlayNotEntitled until Apple issues the matching entitlement.'
  s.author         = 'Spot'
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.license        = 'MIT'
  s.platform       = :ios, '13.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.swift'
  s.frameworks = 'CarPlay'
end
