package com.electrotransport.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int GPS_PERMISSION_CODE = 9001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestGpsPermissions();
        enableWebViewGps();
    }

    @Override
    public void onResume() {
        super.onResume();
        enableWebViewGps();
    }

    private void requestGpsPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean needFine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED;
            boolean needCoarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED;
            if (needFine || needCoarse) {
                ActivityCompat.requestPermissions(this,
                    new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    },
                    GPS_PERMISSION_CODE
                );
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == GPS_PERMISSION_CODE) {
            boolean granted = false;
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_GRANTED) {
                    granted = true;
                    break;
                }
            }
            if (granted) {
                enableWebViewGps();
            }
        }
    }

    private void enableWebViewGps() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) return;

            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setGeolocationEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);

            WebChromeClient currentClient = webView.getWebChromeClient();
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onGeolocationPermissionsShowPrompt(
                    String origin,
                    GeolocationPermissions.Callback callback
                ) {
                    boolean hasPermission = ContextCompat.checkSelfPermission(
                        MainActivity.this,
                        Manifest.permission.ACCESS_FINE_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED;

                    callback.invoke(origin, hasPermission, hasPermission);

                    if (!hasPermission) {
                        requestGpsPermissions();
                    }
                }

                // Delegate all other WebChromeClient calls to Capacitor's original client
                @Override
                public void onProgressChanged(WebView view, int newProgress) {
                    if (currentClient != null) {
                        currentClient.onProgressChanged(view, newProgress);
                    }
                }

                @Override
                public void onReceivedTitle(WebView view, String title) {
                    if (currentClient != null) {
                        currentClient.onReceivedTitle(view, title);
                    }
                }

                @Override
                public boolean onShowFileChooser(
                    WebView webView,
                    android.webkit.ValueCallback<android.net.Uri[]> filePathCallback,
                    WebChromeClient.FileChooserParams fileChooserParams) {
                    try {
                        if (currentClient != null) {
                            return currentClient.onShowFileChooser(webView, filePathCallback, fileChooserParams);
                        }
                    } catch (Exception ignored) {}
                    return false;
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
