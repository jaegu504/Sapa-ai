package com.growsphere.crm;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.URLEncoder;

@CapacitorPlugin(name = "WhatsAppLauncher")
public class WhatsAppLauncherPlugin extends Plugin {

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
