#import <React/RCTBridgeModule.h>

// Exposes the Swift NearBellAlarmModule (see NearBellAlarmModule.swift) to
// React Native's bridge / New Architecture interop layer.
@interface RCT_EXTERN_MODULE(NearBellAlarmModule, NSObject)

RCT_EXTERN_METHOD(requestPermissions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(testAlarm:(BOOL)vibrationEnabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(triggerAlarm:(NSString *)tripId
                  destinationName:(NSString *)destinationName
                  vibrationEnabled:(BOOL)vibrationEnabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopAlarm:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
