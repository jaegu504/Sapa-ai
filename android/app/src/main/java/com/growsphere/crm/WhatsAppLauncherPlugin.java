package com.growsphere.crm;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.URLEncoder;
import java.util.ArrayList;

@CapacitorPlugin(name = "WhatsAppLauncher")
public class WhatsAppLauncherPlugin extends Plugin {

    // Uses the phone's own speech recognizer UI: free, no RECORD_AUDIO permission needed in Sapa.
    @PluginMethod
    public void recognizeSpeech(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "id-ID"));
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, call.getString("prompt", "Ceritakan kabarnya..."));
        try {
            startActivityForResult(call, intent, "speechResult");
        } catch (ActivityNotFoundException e) {
            call.reject("Speech recognition not available", "UNAVAILABLE");
        }
    }

    @ActivityCallback
    private void speechResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        ArrayList<String> matches =
            data != null ? data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS) : null;
        JSObject ret = new JSObject();
        ret.put("text", matches != null && !matches.isEmpty() ? matches.get(0) : "");
        call.resolve(ret);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Unable to open app settings", e);
        }
    }

    @PluginMethod
    public void openWhatsApp(PluginCall call) {
        String phone = call.getString("phone", "");
        String text = call.getString("text", "");
        String appType = call.getString("appType", "regular");

        if (phone == null || phone.trim().isEmpty()) {
            call.reject("Phone number is required");
            return;
        }

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        String pkg = "business".equalsIgnoreCase(appType) ? "com.whatsapp.w4b" : "com.whatsapp";

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            StringBuilder sb = new StringBuilder("https://api.whatsapp.com/send?phone=").append(cleanPhone);
            if (text != null && !text.trim().isEmpty()) {
                sb.append("&text=").append(URLEncoder.encode(text.trim(), "UTF-8"));
            }
            intent.setData(Uri.parse(sb.toString()));
            intent.setPackage(pkg);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            // Target package not found, attempt system fallback
            try {
                Intent fallback = new Intent(Intent.ACTION_VIEW);
                StringBuilder sb = new StringBuilder("https://api.whatsapp.com/send?phone=").append(cleanPhone);
                if (text != null && !text.trim().isEmpty()) {
                    sb.append("&text=").append(URLEncoder.encode(text.trim(), "UTF-8"));
                }
                fallback.setData(Uri.parse(sb.toString()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Could not open WhatsApp: " + ex.getMessage());
            }
        } catch (Exception e) {
            call.reject("Error launching WhatsApp: " + e.getMessage());
        }
    }
}
