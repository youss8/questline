package com.youssef.questline;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Shared storage between the app (through WidgetBridgePlugin) and the home-screen widgets. */
public final class WidgetStore {
    private static final String PREFS = "questline_widgets";
    private WidgetStore() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    static JSONObject snapshot(Context c) {
        try { return new JSONObject(prefs(c).getString("snap", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    static void saveSnapshot(Context c, JSONObject s) { prefs(c).edit().putString("snap", s.toString()).apply(); }

    static boolean fresh(JSONObject s) { return today().equals(s.optString("date")); }

    static synchronized void addTick(Context c, JSONObject tick) {
        try {
            JSONArray a = new JSONArray(prefs(c).getString("ticks", "[]"));
            a.put(tick);
            prefs(c).edit().putString("ticks", a.toString()).apply();
        } catch (Exception ignored) {}
    }

    static synchronized JSONArray takeTicks(Context c) {
        JSONArray a;
        try { a = new JSONArray(prefs(c).getString("ticks", "[]")); } catch (Exception e) { a = new JSONArray(); }
        prefs(c).edit().putString("ticks", "[]").apply();
        return a;
    }

    /** Ask every Questline widget to redraw. */
    static void refreshAll(Context c) {
        Class<?>[] all = { TodayWidget.class, FuelWidget.class, NextWidget.class, QuoteWidget.class };
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (Class<?> k : all) {
            int[] ids = m.getAppWidgetIds(new ComponentName(c, k));
            if (ids.length == 0) continue;
            Intent i = new Intent(c, k).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            c.sendBroadcast(i);
        }
    }
}
