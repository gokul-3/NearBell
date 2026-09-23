package com.nearbell.app.location

/** Mirrors src/domain/permissions/permissionStatus.ts's PermissionState union. */
object PermissionState {
    const val UNKNOWN = "unknown"
    const val GRANTED = "granted"
    const val DENIED = "denied"
    const val RESTRICTED = "restricted"
}
