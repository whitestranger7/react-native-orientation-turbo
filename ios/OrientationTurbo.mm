#import "OrientationTurbo.h"
#import "OrientationTurboImpl-Interface.h"

@implementation OrientationTurbo
RCT_EXPORT_MODULE()

- (instancetype)init {
    self = [super init];
    if (self) {
        __weak __typeof(self) weakSelf = self;
        [[OrientationTurboImpl shared] setOnOrientationChange:^(NSString *orientation) {
            __strong __typeof(weakSelf) strongSelf = weakSelf;
            if (strongSelf) {
                [strongSelf emitOrientationChangeEvent:orientation];
            }
        }];
    }
    return self;
}

- (void)emitOrientationChangeEvent:(NSString *)orientation {
    NSDictionary *eventData = @{
        @"orientation": orientation
    };
    
    [self emitOnOrientationChange:eventData];
}

- (void)emitLockOrientationChangeEvent {
  NSString *currentOrientation = [[OrientationTurboImpl shared] getCurrentOrientation];
  BOOL isLocked = [[OrientationTurboImpl shared] isLocked];
  
  NSDictionary *eventData = @{
    @"orientation": currentOrientation,
    @"isLocked": @(isLocked)
  };
  
  [self emitOnLockOrientationChange:eventData];
}

- (void)startOrientationTracking {
    [[OrientationTurboImpl shared] startOrientationTracking];
}

- (void)stopOrientationTracking {
    [[OrientationTurboImpl shared] stopOrientationTracking];
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
  [self emitLockOrientationChangeEvent];
}

- (void)lockToPortrait {
  [[OrientationTurboImpl shared] lockToPortrait];
  [self emitLockOrientationChangeEvent];
}

- (void)lockToPortrait:(NSString *)direction {
  [[OrientationTurboImpl shared] lockToPortrait:direction];
  [self emitLockOrientationChangeEvent];
}

- (void)unlockAllOrientations {
  [[OrientationTurboImpl shared] unlockAllOrientations];
  [self emitLockOrientationChangeEvent];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeOrientationTurboSpecJSI>(params);
}

@end
