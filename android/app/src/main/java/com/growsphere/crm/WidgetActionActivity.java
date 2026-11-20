package com.growsphere.crm;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/**
 * Invisible step between a widget tap and its target. sapa://wa/<phone> opens the WhatsApp chat
 * directly; sapa://contact/<id> and sapa://done/<id> open Sapa, which reads the URI (appUrlOpen).
 */
public class WidgetActionActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri uri = getIntent().getData();
        if (uri != null) {
            if ("wa".equals(uri.getHost())) {
                openWhatsApp(uri.getLastPathSegment());
            } else {
                Intent app = new Intent(this, MainActivity.class);
                app.setAction(Intent.ACTION_VIEW);
                app.setData(uri);
                app.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(app);
            }
        }
        finish();
    }

    private void openWhatsApp(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        Intent chat = new Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?phone=" + digits));
        chat.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        chat.setPackage("com.whatsapp");
        try {
            startActivity(chat);
        } catch (ActivityNotFoundException e) {
            chat.setPackage(null); // WhatsApp Business or the browser
            try {
                startActivity(chat);
            } catch (ActivityNotFoundException ignored) {
                // Nothing can open it.
            }
        }
    }
}
