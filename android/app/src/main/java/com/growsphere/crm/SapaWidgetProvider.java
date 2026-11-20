package com.growsphere.crm;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: who needs a greeting today. The app saves every contact's next due date
 * (WhatsAppLauncherPlugin.updateWidget), so the widget stays right on later days without opening Sapa.
 */
public class SapaWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sapa_widget";
    static final String KEY_DATA = "data";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
    }

    /** Redraws every Sapa widget on the home screen. */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, SapaWidgetProvider.class));
        if (ids.length > 0) render(context, manager, ids);
    }

    static void render(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String title = "Perlu disapa";
        String empty = "Semua aman hari ini";
        String hint = "Buka Sapa untuk memulai";
        List<String[]> due = new ArrayList<>();
        boolean hasData = false;
        try {
            JSONObject data = new JSONObject(prefs.getString(KEY_DATA, "{}"));
            title = data.optString("title", title);
            empty = data.optString("empty", empty);
            JSONArray items = data.optJSONArray("items");
            if (items != null) {
                hasData = true;
                String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    String d = item.optString("d");
                    // ISO dates compare correctly as strings.
                    if (!d.isEmpty() && d.compareTo(today) <= 0) due.add(new String[] {d, item.optString("n")});
                }
            }
        } catch (Exception ignored) {
            // Broken or missing data: show the hint.
        }
        Collections.sort(due, (a, b) -> a[0].compareTo(b[0]));

        StringBuilder names = new StringBuilder();
        for (int i = 0; i < Math.min(3, due.size()); i++) {
            if (i > 0) names.append('\n');
            names.append("• ").append(due.get(i)[1]);
        }
        if (due.size() > 3) names.append("\n+").append(due.size() - 3);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sapa_widget);
            views.setTextViewText(R.id.widget_title, title);
            views.setTextViewText(R.id.widget_count, String.valueOf(due.size()));
            views.setTextViewText(R.id.widget_names, !hasData ? hint : due.isEmpty() ? empty : names.toString());
            views.setOnClickPendingIntent(R.id.widget_root, pending);
            manager.updateAppWidget(id, views);
        }
    }
}
