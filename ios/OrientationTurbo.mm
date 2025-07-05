#import "OrientationTurbo.h"
#import "OrientationTurboImpl-Interface.h"

@implementation OrientationTurbo
RCT_EXPORT_MODULE()

- (nonnull NSString *)getCurrentOrientation {
  return [[OrientationTurboImpl shared] getCurrentOrientation];
}

- (nonnull NSNumber *)isLocked {
  BOOL locked = [[OrientationTurboImpl shared] isLocked];
  return @(locked);
}

- (void)lockToLandscape:(nonnull NSString *)direction {
  [[OrientationTurboImpl shared] lockToLandscape:direction];
}

- (void)lockToPortrait {
  [[OrientationTurboImpl shared] lockToPortrait];
}

- (void)unlockAllOrientations {
  [[OrientationTurboImpl shared] unlockAllOrientations];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeOrientationTurboSpecJSI>(params);
}

@end
