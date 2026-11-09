package com.youssef.questline;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import org.json.JSONObject;

/** Common code: every widget opens the app when tapped and redraws from the shared snapshot. */
public abstract class WidgetBase extends AppWidgetProvider {
    abstract RemoteViews build(Context c, JSONObject s, boolean fresh);

    static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        JSONObject s = WidgetStore.snapshot(c);
        boolean fresh = WidgetStore.fresh(s);
        for (int id : ids) m.updateAppWidget(id, build(c, s, fresh));
    }
}
