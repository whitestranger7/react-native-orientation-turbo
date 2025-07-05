#import <Foundation/Foundation.h>

@interface OrientationTurboImpl : NSObject

+ (OrientationTurboImpl * _Nonnull)shared;
- (void)lockToPortrait;
- (void)lockToLandscape:(NSString * _Nonnull)direction;
- (void)unlockAllOrientations;
- (NSString * _Nonnull)getCurrentOrientation;
- (BOOL)isLocked;

@end
