package com.growsphere.crm;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

/** Feeds the widget's scrollable "Perlu disapa" list. */
public class SapaWidgetService extends RemoteViewsService {
    private static final int[] AVATARS = {
        R.drawable.widget_avatar_0, R.drawable.widget_avatar_1, R.drawable.widget_avatar_2, R.drawable.widget_avatar_3, R.drawable.widget_avatar_4,
    };
    private static final int[] AVATAR_TEXT = {0xFF5B3FC4, 0xFFC8344E, 0xFF1F78B4, 0xFF1F8A5F, 0xFFB26A00};

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    static class Factory implements RemoteViewsFactory {
        private final Context context;
        private SapaWidgetProvider.Data data = new SapaWidgetProvider.Data();
        private String today = SapaWidgetProvider.todayIso();

        Factory(Context context) {
            this.context = context;
        }

        @Override public void onCreate() {}
        @Override public void onDestroy() {}

        @Override
        public void onDataSetChanged() {
            data = SapaWidgetProvider.load(context);
            today = SapaWidgetProvider.todayIso();
        }

        @Override public int getCount() { return data.due.size(); }
        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 1; }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean hasStableIds() { return false; }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.sapa_widget_item);
            if (position >= data.due.size()) return row;
            SapaWidgetProvider.Entry e = data.due.get(position);

            int tone = Math.abs(e.name.hashCode() % AVATARS.length);
            row.setInt(R.id.item_avatar, "setBackgroundResource", AVATARS[tone]);
            row.setTextColor(R.id.item_avatar, AVATAR_TEXT[tone]);
            row.setTextViewText(R.id.item_avatar, initials(e.name));
            row.setTextViewText(R.id.item_name, e.name);
            row.setTextViewText(R.id.item_due, data.dueLabel(e, today));
            if (e.topic.isEmpty()) {
                row.setViewVisibility(R.id.item_topic, View.GONE);
            } else {
                row.setViewVisibility(R.id.item_topic, View.VISIBLE);
                row.setTextViewText(R.id.item_topic, e.topic);
            }

            row.setOnClickFillInIntent(R.id.item_root, fill("contact", e.id));
            row.setOnClickFillInIntent(R.id.item_done, fill("done", e.id));
            row.setOnClickFillInIntent(R.id.item_wa, fill("wa", e.phone));
            return row;
        }

        private static Intent fill(String action, String arg) {
            return new Intent().setData(new Uri.Builder().scheme("sapa").authority(action).appendPath(arg).build());
        }

        private static String initials(String name) {
            StringBuilder sb = new StringBuilder();
            for (String part : name.trim().split("\\s+")) {
                if (!part.isEmpty() && sb.length() < 2) sb.appendCodePoint(Character.toUpperCase(part.codePointAt(0)));
            }
            return sb.length() > 0 ? sb.toString() : "?";
        }
    }
}
