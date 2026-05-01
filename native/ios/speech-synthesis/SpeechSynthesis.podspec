Pod::Spec.new do |s|
  s.name             = 'SpeechSynthesis'
  s.version          = '1.0.0'
  s.summary          = 'spot 019 — Speech Synthesis (AVSpeechSynthesizer) bridge'
  s.description      = 'Native Swift module exposing AVFoundation speech synthesis to React Native via expo-modules-core'
  s.homepage         = 'https://github.com/izkizk8/spot'
  s.license          = 'MIT'
  s.author           = { 'izkizk8' => 'izkizk8@users.noreply.github.com' }
  s.platforms        = { :ios => '7.0' }
  s.source           = { :path => '.' }
  s.source_files     = '*.swift'
  s.dependency 'ExpoModulesCore'
  s.swift_version    = '5.9'
end
