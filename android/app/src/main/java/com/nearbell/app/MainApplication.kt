package com.nearbell.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.nearbell.app.alarm.NearBellAlarmPackage
import com.nearbell.app.location.NearBellLocationPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(NearBellLocationPackage())
          add(NearBellAlarmPackage())
        },
      // getDefaultReactHost() defaults this to RN's own internal
      // ReactBuildConfig.DEBUG, not this app's BuildConfig.DEBUG — that
      // default was found (via an on-device assembleRelease smoke test) to
      // evaluate true even in a release build, making release builds try
      // to load JS from the Metro dev server instead of the bundled
      // assets/index.android.bundle. Passing this app's own BuildConfig.DEBUG
      // explicitly is the fix.
      useDevSupport = BuildConfig.DEBUG,
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
