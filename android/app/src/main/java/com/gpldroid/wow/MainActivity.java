package com.gpldroid.wow;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.webkit.ValueCallback;
import android.util.Log;
import kotlinx.coroutines.CoroutineScope;
import kotlinx.coroutines.Dispatchers;
import kotlinx.coroutines.SupervisorJob;

public class MainActivity extends Activity {
    private WebView webView;
    private CoroutineScope realtimeScope;
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

        realtimeScope = new CoroutineScope(Dispatchers.getMain().plus(new SupervisorJob()));
        realtimeEngine = new SupabaseRealtimeEngine(
            realtimeScope,
            () -> refreshRemoteConfig(),
            () -> refreshRemoteConfig()
        );

        realtimeScope.launch(new kotlin.jvm.functions.Function1<kotlin.coroutines.Continuation<? super kotlin.Unit>, Object>() {
            @Override
            public Object invoke(kotlin.coroutines.Continuation<? super kotlin.Unit> continuation) {
                return realtimeEngine.startListening(continuation);
            }
        });

        DynamicConfigHandler.fetch(new DynamicConfigHandler.Callback() {
            @Override
            public void onSuccess(DynamicConfigHandler.Config config) {
                if (config.backgroundColor != null) {
                    try {
                        webView.setBackgroundColor(Color.parseColor(config.backgroundColor));
                    } catch (IllegalArgumentException ignored) {
                    }
                }

                String primary = config.primaryColor;
                String secondary = config.secondaryColor;
                if (primary != null || secondary != null) {
                    String script =
                        "(function(){" +
                        "var r=document.documentElement;" +
                        (primary != null ? "r.style.setProperty('--wow-primary'," + JSONObjectQuote(primary) + ");" : "") +
                        (secondary != null ? "r.style.setProperty('--wow-secondary'," + JSONObjectQuote(secondary) + ");" : "") +
                        "})();";
                    webView.evaluateJavascript(script, null);
                }
            }

            @Override
            public void onError(Exception error) {
                // The bundled Quran experience remains fully usable when remote config is unavailable.
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

        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(
                "(function(){if(window.WOWSiteConfigEngine&&window.WOWSiteConfigEngine.load){window.WOWSiteConfigEngine.load('/');}})();",
                null
            ));
        }
    }

    private void applyRemoteConfig(DynamicConfigHandler.Config config) {
        if (webView == null) return;

        if (config.backgroundColor != null) {
            try {
                webView.setBackgroundColor(Color.parseColor(config.backgroundColor));
            } catch (IllegalArgumentException ignored) {
            }
        }

        String primary = config.primaryColor;
        String secondary = config.secondaryColor;
        if (primary != null || secondary != null) {
            String script =
                "(function(){" +
                "var r=document.documentElement;" +
                (primary != null ? "r.style.setProperty('--wow-primary'," + JSONObjectQuote(primary) + ");" : "") +
                (secondary != null ? "r.style.setProperty('--wow-secondary'," + JSONObjectQuote(secondary) + ");" : "") +
                "})();";
            webView.evaluateJavascript(script, null);
        }
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
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (realtimeEngine != null && realtimeScope != null) {
            realtimeScope.launch(new kotlin.jvm.functions.Function1<kotlin.coroutines.Continuation<? super kotlin.Unit>, Object>() {
                @Override
                public Object invoke(kotlin.coroutines.Continuation<? super kotlin.Unit> continuation) {
                    return realtimeEngine.stopListening(continuation);
                }
            });
        }
        if (realtimeScope != null) {
            realtimeScope.cancel(null);
        }
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
        }
        super.onDestroy();
    }
}
