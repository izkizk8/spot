Pod::Spec.new do |s|
  s.name           = 'Arkit'
  s.version        = '1.0.0'
  s.summary        = 'ARKit Basics module for spot showcase'
  s.description    = 'Thin Swift wrapper for ARWorldTrackingConfiguration + RealityKit ARView'
  s.author         = 'izkizk8'
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.platform       = :ios, '11.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '*.swift'
  s.resource_bundles = {
    'Arkit' => ['Resources/cube-texture.png']
  }
end
