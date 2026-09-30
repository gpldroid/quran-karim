package com.gpldroid.wow

import android.util.Log
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

/**
 * Keeps the Android client subscribed to Supabase database changes.
 *
 * After a database event we re-fetch the complete public configuration.
 * This keeps the WebView and native configuration in sync without coupling
 * the Android client to the exact JSON shape of theme_config/ad_code.
 */
class SupabaseRealtimeEngine(
    private val scope: CoroutineScope,
    private val onSettingsChanged: () -> Unit,
    private val onAdsChanged: () -> Unit
) {
    private val client = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Realtime)
    }

    private var started = false

    /**
     * Java-friendly lifecycle entry point.
     * The suspend work is launched in the Activity-owned scope.
     */
    fun startListening() {
        scope.launch {
            startListeningInternal()
        }
    }

    private suspend fun startListeningInternal() {
        if (started) return

        if (BuildConfig.SUPABASE_URL.isBlank() ||
            BuildConfig.SUPABASE_ANON_KEY.isBlank()
        ) {
            Log.w(TAG, "Supabase configuration is missing; Realtime disabled.")
            return
        }

        started = true

        try {
            client.realtime.connect()

            val settingsChannel = client.channel("wow-app-settings")
            settingsChannel
                .postgresChangeFlow<PostgresAction.Update>(schema = "public") {
                    table = "app_settings"
                }
                .onEach {
                    Log.d(TAG, "Realtime UPDATE: app_settings")
                    onSettingsChanged()
                }
                .launchIn(scope)

            val adsChannel = client.channel("wow-ads-management")
            adsChannel
                .postgresChangeFlow<PostgresAction>(schema = "public") {
                    table = "ads_management"
                }
                .onEach {
                    Log.d(TAG, "Realtime change: ads_management")
                    onAdsChanged()
                }
                .launchIn(scope)

            settingsChannel.subscribe()
            adsChannel.subscribe()

            Log.i(TAG, "Supabase Realtime subscriptions started.")
        } catch (error: Exception) {
            started = false
            Log.e(TAG, "Failed to start Supabase Realtime.", error)
        }
    }

    /**
     * Java-friendly lifecycle exit point.
     */
    fun stopListening() {
        scope.launch {
            stopListeningInternal()
        }
    }

    private suspend fun stopListeningInternal() {
        if (!started) return

        started = false

        try {
            client.realtime.disconnect()
        } catch (error: Exception) {
            Log.w(TAG, "Realtime disconnect failed.", error)
        }
    }

    companion object {
        private const val TAG = "SupabaseRealtime"
    }
}
