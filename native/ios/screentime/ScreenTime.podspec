Pod::Spec.new do |s|
  s.name           = 'SpotScreenTime'
  s.version        = '1.0.0'
  s.summary        = 'ScreenTime / FamilyControls showcase native module (feature 015)'
  s.description    = 'Bridges Apple FamilyControls / ManagedSettings / DeviceActivity APIs into the Spot Expo module system.'
  s.author         = ''
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.platforms      = { :ios => '16.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.license        = 'MIT'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE'         => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = '**/*.{h,m,swift}'
  s.exclude_files = 'DeviceActivityMonitorExtension.swift'
end
