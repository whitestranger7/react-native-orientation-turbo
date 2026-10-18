#import <Foundation/Foundation.h>
#import <OrientationTurboSpec/OrientationTurboSpec.h>
#import <React/RCTInvalidating.h>

// React Native module, exported to JS as "OrientationTurbo".
// Not to be confused with the Swift `OrientationTurbo` class, which is the public native API.
@interface OrientationTurboModule : NativeOrientationTurboSpecBase <NativeOrientationTurboSpec, RCTInvalidating>

@end
