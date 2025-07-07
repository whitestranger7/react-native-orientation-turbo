#import <Foundation/Foundation.h>

@interface OrientationTurboImpl : NSObject

+ (OrientationTurboImpl * _Nonnull)shared;
- (void)startOrientationTracking;
- (void)stopOrientationTracking;
- (void)lockToPortrait;
- (void)lockToPortrait:(NSString * _Nullable)direction;
- (void)lockToLandscape:(NSString * _Nonnull)direction;
- (void)unlockAllOrientations;
- (NSString * _Nonnull)getCurrentOrientation;
- (BOOL)isLocked;
- (void)setOnOrientationChange:(void (^_Nullable)(NSString * _Nonnull))callback;

@end
