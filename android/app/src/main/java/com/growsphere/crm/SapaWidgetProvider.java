package com.growsphere.crm;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
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
 * Home-screen widget styled like Radar Sapa's "Perlu disapa" card: a scrollable list with a check
 * and a WhatsApp button on every row. The app saves every contact's next due date
 * (WhatsAppLauncherPlugin.updateWidget), so the list stays right on later days without opening Sapa.
 */
public class SapaWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sapa_widget";
    static final String KEY_DATA = "data";

    /** One overdue contact as the widget shows it. */
    static class Entry {
        String id, name, phone, topic, date;
        boolean never;
    }

    /** Texts and overdue entries read from the app's saved data. */
    static class Data {
        String title = "Perlu disapa";
        String empty = "Semua aman hari ini";
        String hint = "Buka Sapa untuk memulai";
        String overdue = "Lewat {n} hari";
        String today = "Hari ini";
        String never = "Belum disapa";
        boolean hasData = false;
        List<Entry> due = new ArrayList<>();

        String dueLabel(Entry e, String todayIso) {
            long days = daysBetween(e.date, todayIso);
            if (days > 0) return overdue.replace("{n}", String.valueOf(days));
            return e.never ? never : today;
        }
    }

    static String todayIso() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    static long daysBetween(String fromIso, String toIso) {
        try {
            SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            long diff = f.parse(toIso).getTime() - f.parse(fromIso).getTime();
            return Math.round(diff / 86400000.0);
        } catch (Exception e) {
            return 0;
        }
    }

    static Data load(Context context) {
        Data data = new Data();
        try {
            JSONObject json = new JSONObject(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DATA, "{}"));
            data.title = json.optString("title", data.title);
            data.empty = json.optString("empty", data.empty);
            data.overdue = json.optString("overdue", data.overdue);
            data.today = json.optString("today", data.today);
            data.never = json.optString("never", data.never);
            JSONArray items = json.optJSONArray("items");
            if (items != null) {
                data.hasData = true;
                String today = todayIso();
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    Entry e = new Entry();
                    e.date = item.optString("d");
                    // ISO dates compare correctly as strings.
                    if (e.date.isEmpty() || e.date.compareTo(today) > 0) continue;
                    e.id = item.optString("id");
                    e.name = item.optString("n");
                    e.phone = item.optString("p");
                    e.topic = item.optString("t");
                    e.never = item.optInt("nv", 0) == 1;
                    data.due.add(e);
                }
            }
        } catch (Exception ignored) {
            // Broken or missing data: the widget shows the hint.
        }
        // Longest overdue first, like Radar.
        Collections.sort(data.due, (a, b) -> a.date.compareTo(b.date));
        return data;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
    }

    /** Redraws every Sapa widget on the home screen, list included. */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, SapaWidgetProvider.class));
        if (ids.length > 0) render(context, manager, ids);
    }

    static void render(Context context, AppWidgetManager manager, int[] ids) {
        Data data = load(context);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openApp = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Rows fill in a sapa://<action>/<arg> URI; this activity carries it out.
        Intent action = new Intent(context, WidgetActionActivity.class);
        PendingIntent rowTemplate = PendingIntent.getActivity(context, 1, action, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sapa_widget);
            views.setTextViewText(R.id.widget_title, data.title);
            views.setTextViewText(R.id.widget_count, String.valueOf(data.due.size()));
            views.setTextViewText(R.id.widget_empty, data.hasData ? data.empty : data.hint);
            views.setOnClickPendingIntent(R.id.widget_header, openApp);
            views.setOnClickPendingIntent(R.id.widget_empty, openApp);

            Intent service = new Intent(context, SapaWidgetService.class);
            service.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
            service.setData(Uri.parse(service.toUri(Intent.URI_INTENT_SCHEME)));
            views.setRemoteAdapter(R.id.widget_list, service);
            views.setEmptyView(R.id.widget_list, R.id.widget_empty);
            views.setPendingIntentTemplate(R.id.widget_list, rowTemplate);

            manager.updateAppWidget(id, views);
        }
        manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_list);
    }
}
