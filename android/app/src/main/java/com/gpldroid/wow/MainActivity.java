package com.gpldroid.wow;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private SupabaseRealtimeEngine realtimeEngine;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 17, 31));
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDisplayZoomControls(false);
        webView.setWebChromeClient(new WebChromeClient());

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleLocalRoute(view, request.getUrl().toString());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleLocalRoute(view, url);
            }
        });

        webView.loadUrl("file:///android_asset/quran.html");

        realtimeEngine = new SupabaseRealtimeEngine(
            () -> refreshRemoteConfig(),
            () -> refreshRemoteConfig()
        );
        realtimeEngine.startListening();

        DynamicConfigHandler.fetch(new DynamicConfigHandler.Callback() {
            @Override
            public void onSuccess(DynamicConfigHandler.Config config) {
                applyRemoteConfig(config);
            }

            @Override
            public void onError(Exception error) {
                Log.w("MainActivity", "Initial remote config failed", error);
            }
        });
    }

    private void refreshRemoteConfig() {
        DynamicConfigHandler.fetch(new DynamicConfigHandler.Callback() {
            @Override
            public void onSuccess(DynamicConfigHandler.Config config) {
                applyRemoteConfig(config);
            }

            @Override
            public void onError(Exception error) {
                Log.w("MainActivity", "Remote config refresh failed", error);
            }
        });
    }

    private void applyRemoteConfig(DynamicConfigHandler.Config config) {
        if (webView == null) return;

        if (config.maintenanceMode) {
            showBlockingDialog(
                "التطبيق تحت الصيانة",
                config.maintenanceMessage != null && !config.maintenanceMessage.trim().isEmpty()
                    ? config.maintenanceMessage
                    : "نعمل على تحسين الخدمات، يرجى المحاولة لاحقاً.",
                "إغلاق",
                () -> finish()
            );
            return;
        }

        if (isVersionOutdated(BuildConfig.VERSION_NAME, config.minRequiredVersion)) {
            showBlockingDialog(
                "تحديث إجباري مطلوب",
                "هذا الإصدار لم يعد مدعوماً. حدّث التطبيق للمتابعة.",
                "تحديث الآن",
                () -> {
                    try {
                        if (config.appUpdateUrl != null && !config.appUpdateUrl.trim().isEmpty()) {
                            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(config.appUpdateUrl)));
                        }
                    } catch (Exception ignored) {
                    }
                    finish();
                }
            );
            return;
        }

        if (config.backgroundColor != null) {
            try {
                webView.setBackgroundColor(Color.parseColor(config.backgroundColor));
            } catch (IllegalArgumentException ignored) {
            }
        }

        String primary = config.primaryColor;
        String secondary = config.secondaryColor;
        String surface = config.surfaceColor;
        String font = config.font;
        String radius = config.radius;

        StringBuilder script = new StringBuilder("(function(){var r=document.documentElement;");
        if (primary != null) script.append("r.style.setProperty('--primary-color',").append(JSONObjectQuote(primary)).append(");");
        if (secondary != null) script.append("r.style.setProperty('--secondary-color',").append(JSONObjectQuote(secondary)).append(");");
        if (primary != null) script.append("r.style.setProperty('--wow-primary',").append(JSONObjectQuote(primary)).append(");");
        if (secondary != null) script.append("r.style.setProperty('--wow-secondary',").append(JSONObjectQuote(secondary)).append(");");
        if (config.backgroundColor != null) script.append("r.style.setProperty('--bg-color',").append(JSONObjectQuote(config.backgroundColor)).append(");");
        if (surface != null) script.append("r.style.setProperty('--dark-card',").append(JSONObjectQuote(surface)).append(");");
        if (font != null) script.append("document.body.style.fontFamily=").append(JSONObjectQuote(font)).append(";");
        if (radius != null) script.append("r.style.setProperty('--radius',").append(JSONObjectQuote(radius)).append(");");
        script.append("})();");
        webView.evaluateJavascript(script.toString(), null);

        injectAds(config);
    }

    private void injectAds(DynamicConfigHandler.Config config) {
        if (webView == null) return;

        StringBuilder script = new StringBuilder(
            "(function(){"
          + "function allowed(){try{var c=JSON.parse(localStorage.getItem('wow_privacy_consent_v1'));return !!(c&&c.version===1&&c.ads===true);}catch(e){return false;}}"
          + "function host(p){var h=document.querySelector('[data-ad-placement=\\\"'+p+'\\\"]');"
          + "if(!h){h=document.createElement('div');h.setAttribute('data-ad-placement',p);"
          + "h.style.cssText='margin:12px auto;max-width:100%;text-align:center;';"
          + "var q=document.getElementById('quran-container'),head=document.querySelector('header');"
          + "if(p==='body_top'&&q)q.parentNode.insertBefore(h,q);else if(p==='body_bottom'&&q)q.parentNode.insertBefore(h,q.nextSibling);"
          + "else if(p==='header'&&head)head.appendChild(h);else document.body.prepend(h);}return h;}"
          + "function setHtml(h,html){h.innerHTML='';var box=document.createElement('div');box.innerHTML=html;"
          + "Array.from(box.childNodes).forEach(function(n){if(n.tagName==='SCRIPT'){var s=document.createElement('script');"
          + "Array.from(n.attributes).forEach(function(a){s.setAttribute(a.name,a.value);});s.text=n.textContent||'';h.appendChild(s);}else{h.appendChild(n.cloneNode(true));}})}"
          + "function clear(){document.querySelectorAll('[data-ad-placement]').forEach(function(h){h.innerHTML='';h.hidden=true;});}"
          + "function render(){if(!allowed()){clear();return;}"
        );

        if (!config.adsEnabled) {
            script.append("clear();");
        } else {
            for (DynamicConfigHandler.AdConfig ad : config.ads) {
                if (ad == null || !ad.active || ad.adCode == null || ad.adCode.trim().isEmpty()) continue;
                script.append("setHtml(host(")
                    .append(JSONObjectQuote(ad.placement))
                    .append("),")
                    .append(JSONObjectQuote(ad.adCode))
                    .append(");");
            }
        }

        script.append("}"
            + "render();"
            + "window.addEventListener('wow:consent-changed',render);"
            + "})();");
        webView.evaluateJavascript(script.toString(), null);
    }

    private boolean isVersionOutdated(String current, String required) {
        if (required == null || required.trim().isEmpty()) return false;
        String[] a = current.split("\\.");
        String[] b = required.split("\\.");
        int n = Math.max(a.length, b.length);
        for (int i = 0; i < n; i++) {
            int av = i < a.length ? parseVersionPart(a[i]) : 0;
            int bv = i < b.length ? parseVersionPart(b[i]) : 0;
            if (av < bv) return true;
            if (av > bv) return false;
        }
        return false;
    }

    private int parseVersionPart(String value) {
        String digits = value.replaceAll("[^0-9].*$", "");
        try {
            return Integer.parseInt(digits.isEmpty() ? "0" : digits);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private void showBlockingDialog(String title, String message, String buttonText, Runnable action) {
        new AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton(buttonText, (dialog, which) -> action.run())
            .show();
    }

    private static String JSONObjectQuote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private boolean handleLocalRoute(WebView view, String url) {
        if ("file:///android_asset/index.html".equals(url) ||
            "file:///android_asset/".equals(url)) {
            view.loadUrl("file:///android_asset/quran.html");
            return true;
        }
        return false;
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (realtimeEngine != null) realtimeEngine.stopListening();
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
        }
        super.onDestroy();
    }
}
