package com.gpldroid.wow;

import android.os.Handler;
import android.os.Looper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class DynamicConfigHandler {
    private DynamicConfigHandler() {}

    public static final class Config {
        public String googleAnalyticsId;
        public String primaryColor;
        public String secondaryColor;
        public String backgroundColor;
        public String surfaceColor;
        public String font;
        public String radius;
        public boolean maintenanceMode;
        public String maintenanceMessage;
        public String minRequiredVersion;
        public String appUpdateUrl;
        public boolean adsEnabled = true;
        public String admobBannerId;
        public String admobInterstitialId;
        public final List<AdConfig> ads = new ArrayList<>();
    }

    public static final class AdConfig {
        public String placement;
        public String adCode;
        public boolean active;
        public String targetPlatform;
    }

    public interface Callback {
        void onSuccess(Config config);
        void onError(Exception error);
    }

    public static void fetch(Callback callback) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler main = new Handler(Looper.getMainLooper());
        executor.execute(() -> {
            try {
                String base = BuildConfig.SUPABASE_URL;
                String key = BuildConfig.SUPABASE_ANON_KEY;
                if (base == null || base.trim().isEmpty() || key == null || key.trim().isEmpty()) {
                    throw new IllegalStateException("Supabase configuration is missing");
                }

                Config config = new Config();
                String settingsJson = get(
                    base + "/rest/v1/app_settings?select=google_analytics_id,theme_config,primary_color,app_dark_mode,maintenance_mode,maintenance_message,min_required_version,app_update_url,is_ads_enabled,admob_banner_id,admob_interstitial_id&id=eq.1&limit=1",
                    key
                );
                JSONArray settingsRows = new JSONArray(settingsJson);
                if (settingsRows.length() > 0) {
                    JSONObject row = settingsRows.getJSONObject(0);
                    config.googleAnalyticsId = row.optString("google_analytics_id", null);
                    config.maintenanceMode = row.optBoolean("maintenance_mode", false);
                    config.maintenanceMessage = row.optString("maintenance_message", null);
                    config.minRequiredVersion = row.optString("min_required_version", "1.0.0");
                    config.appUpdateUrl = row.optString("app_update_url", null);
                    config.adsEnabled = row.optBoolean("is_ads_enabled", true);
                    config.admobBannerId = row.optString("admob_banner_id", null);
                    config.admobInterstitialId = row.optString("admob_interstitial_id", null);

                    String directPrimary = row.optString("primary_color", null);
                    JSONObject theme = row.optJSONObject("theme_config");
                    if (theme != null) {
                        config.primaryColor = theme.optString("primary", theme.optString("primaryColor", directPrimary));
                        config.secondaryColor = theme.optString("secondary", theme.optString("secondaryColor", null));
                        config.backgroundColor = theme.optString("background", theme.optString("backgroundColor", null));
                        config.surfaceColor = theme.optString("surface", null);
                        config.font = theme.optString("font", theme.optString("fontFamily", null));
                        config.radius = theme.optString("radius", null);
                    }
                }

                String adsJson = get(
                    base + "/rest/v1/ads_management?select=placement,ad_code,is_active,target_platform&is_active=eq.true&target_platform=in.(android,both)&order=placement",
                    key
                );
                JSONArray ads = new JSONArray(adsJson);
                for (int i = 0; i < ads.length(); i++) {
                    JSONObject item = ads.getJSONObject(i);
                    AdConfig ad = new AdConfig();
                    ad.placement = item.optString("placement", "");
                    ad.adCode = item.optString("ad_code", "");
                    ad.active = item.optBoolean("is_active", false);
                    ad.targetPlatform = item.optString("target_platform", "android");
                    config.ads.add(ad);
                }

                main.post(() -> callback.onSuccess(config));
            } catch (Exception error) {
                main.post(() -> callback.onError(error));
            } finally {
                executor.shutdown();
            }
        });
    }

    private static String get(String endpoint, String anonKey) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        connection.setRequestProperty("apikey", anonKey);
        connection.setRequestProperty("Authorization", "Bearer " + anonKey);
        connection.setRequestProperty("Accept", "application/json");

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            connection.disconnect();
            throw new IllegalStateException("Supabase request failed: HTTP " + status);
        }

        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        } finally {
            connection.disconnect();
        }
        return result.toString();
    }
}
