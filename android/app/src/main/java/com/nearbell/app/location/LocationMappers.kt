package com.nearbell.app.location

import android.location.Location
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/** Builds a WritableMap matching NativeLocationSample from src/infrastructure/location/specs. */
fun Location.toWritableMap(source: String = "fused"): WritableMap {
    val map = Arguments.createMap()
    map.putDouble("latitude", latitude)
    map.putDouble("longitude", longitude)
    map.putDouble("accuracyMeters", if (hasAccuracy()) accuracy.toDouble() else 0.0)
    map.putBoolean("hasAccuracy", hasAccuracy())
    map.putDouble("altitudeMeters", if (hasAltitude()) altitude else 0.0)
    map.putBoolean("hasAltitude", hasAltitude())
    map.putDouble("speedMps", if (hasSpeed()) speed.toDouble() else 0.0)
    map.putBoolean("hasSpeed", hasSpeed())
    map.putDouble("headingDegrees", if (hasBearing()) bearing.toDouble() else 0.0)
    map.putBoolean("hasHeading", hasBearing())
    map.putDouble("timestamp", time.toDouble())
    map.putString("source", source)
    return map
}
