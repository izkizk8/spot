Pod::Spec.new do |s|
  s.name             = 'Vision'
  s.version          = '1.0.0'
  s.summary          = 'spot 017 — Camera + Vision Live Frames bridge'
  s.description      = 'Native Swift module exposing Apple Vision framework to React Native via expo-modules-core'
  s.homepage         = 'https://github.com/izkizk8/spot'
  s.license          = 'MIT'
  s.author           = { 'izkizk8' => 'izkizk8@users.noreply.github.com' }
  s.platforms        = { :ios => '13.0' }
  s.source           = { :path => '.' }
  s.source_files     = '*.swift'
  s.dependency 'ExpoModulesCore'
  s.frameworks       = 'Vision', 'CoreImage'
  s.swift_version    = '5.9'
end
