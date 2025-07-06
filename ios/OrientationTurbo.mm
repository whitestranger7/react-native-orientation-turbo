#import "OrientationTurbo.h"
#import "OrientationTurboImpl-Interface.h"

@implementation OrientationTurbo
RCT_EXPORT_MODULE()

- (void)emitOrientationChangeEvent {
  NSString *currentOrientation = [[OrientationTurboImpl shared] getCurrentOrientation];
  BOOL isLocked = [[OrientationTurboImpl shared] isLocked];
  
  NSDictionary *eventData = @{
    @"orientation": currentOrientation,
    @"isLocked": @(isLocked)
  };
  
  [self emitOnOrientationChange:eventData];
}

- (nonnull NSString *)getCurrentOrientation {
  return [[OrientationTurboImpl shared] getCurrentOrientation];
}

- (nonnull NSNumber *)isLocked {
  BOOL locked = [[OrientationTurboImpl shared] isLocked];
  return @(locked);
}

- (void)lockToLandscape:(nonnull NSString *)direction {
  [[OrientationTurboImpl shared] lockToLandscape:direction];
  [self emitOrientationChangeEvent];
}

- (void)lockToPortrait {
  [[OrientationTurboImpl shared] lockToPortrait];
  [self emitOrientationChangeEvent];
}

- (void)unlockAllOrientations {
  [[OrientationTurboImpl shared] unlockAllOrientations];
  [self emitOrientationChangeEvent];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeOrientationTurboSpecJSI>(params);
}

@end
