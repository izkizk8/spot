Pod::Spec.new do |s|
  s.name           = 'SpotMapKit'
  s.version        = '1.0.0'
  s.summary        = 'MapKit bridges for Spot: MKLocalSearch and Look Around'
  s.description    = 'In-tree native modules for MapKit Lab module (feature 024): MapKitSearchBridge and LookAroundBridge'
  s.author         = 'Spot Team'
  s.homepage       = 'https://github.com/izkizk8/spot'
  s.platforms      = { :ios => '13.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  
  s.dependency 'ExpoModulesCore'
  
  s.pod_target_xcconfig = {
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
