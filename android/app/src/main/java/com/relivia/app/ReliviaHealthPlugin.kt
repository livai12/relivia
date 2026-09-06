package com.relivia.app

import android.content.Intent
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Duration

/**
 * Capacitor bridge for the Next.js layer (PRD §7–§8).
 *
 * JS usage (see lib/nativeBridge.ts):
 *   ReliviaHealth.isAvailable()
 *   ReliviaHealth.requestPermissions()
 *   ReliviaHealth.readHealth({ daysBack })
 *   ReliviaHealth.enableBackgroundSync({ backendUrl, patientId, token })
 *   ReliviaHealth.notifyAgent({ type, sessionId })
 *
 * Native responsibilities end here: Health Connect, background worker,
 * notification, permissions, deep link. All UI stays in Next.js (PRD §33).
 */
@CapacitorPlugin(name = "ReliviaHealth")
class ReliviaHealthPlugin : Plugin() {

    private var pendingPermissionCall: PluginCall? = null

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val ret = JSObject()
        ret.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        ret.put("sdkStatus", status)
        call.resolve(ret)
    }

    /**
     * Opens the Health Connect permission screen. The result is delivered
     * to handleOnActivityResult; the JS promise resolves with granted set.
     */
    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("Activity unavailable")
            return
        }
        if (HealthConnectClient.getSdkStatus(context) !=
            HealthConnectClient.SDK_AVAILABLE
        ) {
            call.reject("HEALTH_CONNECT_UNAVAILABLE", "Health Connect is not available")
            return
        }
        pendingPermissionCall = call
        val requestContract =
            PermissionController.createRequestPermissionResultContract()
        val intent = requestContract.createIntent(
            activity,
            HealthConnectReader.READ_PERMISSIONS,
        )
        startActivityForResult(call, intent, REQUEST_HEALTH_PERMISSIONS)
    }

    @PluginMethod
    fun readHealth(call: PluginCall) {
        val daysBack = call.getInt("daysBack", 1) ?: 1
        Thread {
            try {
                val points = kotlinx.coroutines.runBlocking {
                    HealthConnectReader.readDaily(context, daysBack.coerceIn(1, 7))
                }
                val ret = JSObject()
                val arr = org.json.JSONArray()
                for (p in points) {
                    arr.put(
                        org.json.JSONObject()
                            .put("dataType", p.dataType)
                            .put("value", p.value)
                            .put("unit", p.unit)
                            .put("recordedAt", p.recordedAt)
                    )
                }
                ret.put("data", arr)
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("READ_FAILED", e.message, e)
            }
        }.start()
    }

    /**
     * Schedules the periodic WorkManager sync (every 6h, requires network).
     * Credentials are passed as Worker input (never persisted elsewhere,
     * PRD §35 — no Health Connect credential is stored).
     */
    @PluginMethod
    fun enableBackgroundSync(call: PluginCall) {
        val backendUrl = call.getString("backendUrl")
        val patientId = call.getString("patientId")
        val token = call.getString("token")
        if (backendUrl.isNullOrEmpty() || patientId.isNullOrEmpty() || token.isNullOrEmpty()) {
            call.reject("INVALID_ARGS", "backendUrl, patientId, token required")
            return
        }
        val request = PeriodicWorkRequestBuilder<HealthSyncWorker>(
            repeatInterval = Duration.ofHours(6),
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .setRequiresBatteryNotLow(true)
                    .build()
            )
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                Duration.ofMinutes(15),
            )
            .setInputData(
                workDataOf(
                    HealthSyncWorker.KEY_BACKEND_URL to backendUrl,
                    HealthSyncWorker.KEY_PATIENT_ID to patientId,
                    HealthSyncWorker.KEY_TOKEN to token,
                )
            )
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            HealthSyncWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
        val ret = JSObject()
        ret.put("scheduled", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun disableBackgroundSync(call: PluginCall) {
        WorkManager.getInstance(context)
            .cancelUniqueWork(HealthSyncWorker.WORK_NAME)
        val ret = JSObject()
        ret.put("scheduled", false)
        call.resolve(ret)
    }

    /** Shows the agent notification immediately (used after foreground sync). */
    @PluginMethod
    fun notifyAgent(call: PluginCall) {
        val type = call.getString("type") ?: "agent_question"
        val sessionId = call.getString("sessionId") ?: run {
            call.reject("INVALID_ARGS", "sessionId required")
            return
        }
        NotificationHelper.showAgentNotification(context, type, sessionId)
        val ret = JSObject()
        ret.put("notified", true)
        call.resolve(ret)
    }

    /**
     * Opens the Health Connect settings screen so the caregiver can manage
     * permissions manually (fallback when the inline permission flow fails).
     */
    @PluginMethod
    fun openHealthSettings(call: PluginCall) {
        try {
            val intent = Intent(
                HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS
            )
            activity?.startActivity(intent)
            val ret = JSObject()
            ret.put("opened", true)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("OPEN_FAILED", e.message, e)
        }
    }

    override fun handleOnActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        super.handleOnActivityResult(requestCode, resultCode, data)
        if (requestCode != REQUEST_HEALTH_PERMISSIONS) return
        val call = pendingPermissionCall ?: return
        pendingPermissionCall = null
        Thread {
            try {
                val granted = kotlinx.coroutines.runBlocking {
                    HealthConnectReader.grantedPermissions(context)
                }
                val ret = JSObject()
                ret.put("granted", org.json.JSONArray(granted.toList()))
                ret.put(
                    "allGranted",
                    granted.containsAll(HealthConnectReader.READ_PERMISSIONS),
                )
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject("PERMISSION_FAILED", e.message, e)
            }
        }.start()
    }

    companion object {
        private const val REQUEST_HEALTH_PERMISSIONS = 0xCA1A
    }
}
