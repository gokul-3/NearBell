# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native's ReactConfig reads this reflectively (by fully-qualified
# name, no direct code reference) to detect BuildConfig.DEBUG. Without this
# rule R8 strips the class as unused, ReactConfig fails to find it and logs
# "Could not find BuildConfig class", and the app falls back to dev mode
# (tries to load JS from the Metro dev server) instead of using the bundled
# assets/index.android.bundle — reproduced and confirmed via an on-device
# assembleRelease smoke test before this rule was added.
-keep class com.nearbell.app.BuildConfig { *; }
