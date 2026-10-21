# Verify the requested CocoaPods mode reached the library target.
require 'xcodeproj'

app_dir, linkage = ARGV
abort 'Usage: compat-ios-linkage.rb <consumer-directory> static|dynamic' unless app_dir && %w[static dynamic].include?(linkage)
project = Xcodeproj::Project.open(File.join(app_dir, 'ios/Pods/Pods.xcodeproj'))
target = project.targets.find { |item| item.name == 'OrientationTurbo' }
abort 'OrientationTurbo pod target is missing' unless target
abort 'OrientationTurbo is not a framework target' unless target.product_type == 'com.apple.product-type.framework'
expected = linkage == 'static' ? 'staticlib' : 'mh_dylib'
target.build_configurations.each do |configuration|
  # Dynamic frameworks use Xcode's default mh_dylib when this setting is omitted.
  actual = configuration.build_settings['MACH_O_TYPE'] || 'mh_dylib'
  abort "#{configuration.name}: expected #{expected}, found #{actual}" unless actual == expected
end
puts "OrientationTurbo: verified #{linkage} framework configuration"
