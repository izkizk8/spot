Pod::Spec.new do |s|
  s.name           = 'KeychainBridge'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for iOS Keychain Services'
  s.description    = 'Wraps Security.framework Keychain Services API for feature 023'
  s.author         = ''
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.platform       = :ios, '13.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
