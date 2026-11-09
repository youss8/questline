package com.youssef.questline;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/** Today's habits: tap a row to tick it (counts go up by one) without opening the app. */
public class TodayWidget extends WidgetBase {
    static final String TOGGLE = "com.youssef.questline.TOGGLE";
    static final int ROWS = 6;
    static final int[] ROW = { R.id.row0, R.id.row1, R.id.row2, R.id.row3, R.id.row4, R.id.row5 };
    static final int[] BOX = { R.id.box0, R.id.box1, R.id.box2, R.id.box3, R.id.box4, R.id.box5 };
    static final int[] NAME = { R.id.name0, R.id.name1, R.id.name2, R.id.name3, R.id.name4, R.id.name5 };

    @Override
    RemoteViews build(Context c, JSONObject s, boolean fresh) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_today);
        v.setOnClickPendingIntent(R.id.header, openApp(c));
        if (!fresh || !s.optBoolean("started", true)) {
            v.setTextViewText(R.id.title, "Ember");
            v.setTextViewText(R.id.sub, fresh ? "Day 1 is " + s.optString("start") : "Open Ember to load today");
            for (int i = 0; i < ROWS; i++) v.setViewVisibility(ROW[i], View.GONE);
            v.setOnClickPendingIntent(R.id.root, openApp(c));
            return v;
        }
        JSONArray hs = s.optJSONArray("habits");
        int n = hs == null ? 0 : hs.length(), done = 0;
        for (int i = 0; i < n; i++) if (hs.optJSONObject(i).optBoolean("done")) done++;
        v.setTextViewText(R.id.title, "Today  " + done + "/" + n);
        int st = s.optInt("streak"); v.setTextViewText(R.id.sub, st > 0 ? "🔥 " + st + "-day fire" : "Light it today");
        for (int i = 0; i < ROWS; i++) {
            if (i >= n) { v.setViewVisibility(ROW[i], View.GONE); continue; }
            JSONObject h = hs.optJSONObject(i);
            boolean d = h.optBoolean("done");
            String label = h.optString("name");
            if ("count".equals(h.optString("type")) && !d) label += "  " + h.optInt("count") + "/" + h.optInt("target");
            v.setViewVisibility(ROW[i], View.VISIBLE);
            v.setTextViewText(NAME[i], label);
            v.setTextViewText(BOX[i], d ? "✓" : "");
            v.setInt(BOX[i], "setBackgroundResource", d ? R.drawable.w_box_on : R.drawable.w_box);
            v.setTextColor(NAME[i], d ? 0xFF6F685D : 0xFFF1EBE0);
            Intent t = new Intent(c, TodayWidget.class).setAction(TOGGLE).putExtra("id", h.optString("id"));
            v.setOnClickPendingIntent(ROW[i], PendingIntent.getBroadcast(c, 100 + i, t, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        return v;
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (!TOGGLE.equals(intent.getAction())) return;
        String id = intent.getStringExtra("id");
        JSONObject s = WidgetStore.snapshot(c);
        if (id == null || !WidgetStore.fresh(s)) return;
        try {
            JSONArray hs = s.getJSONArray("habits");
            int done = 0;
            for (int i = 0; i < hs.length(); i++) {
                JSONObject h = hs.getJSONObject(i);
                if (id.equals(h.optString("id"))) {
                    JSONObject tick = new JSONObject().put("id", id).put("date", s.optString("date"));
                    if ("count".equals(h.optString("type"))) {
                        int cnt = h.optInt("count"), tgt = Math.max(1, h.optInt("target", 1));
                        int step = Math.max(1, h.optInt("step", 1)); int next = cnt >= tgt ? 0 : Math.min(tgt, cnt + step);   // full counter wraps back to zero
                        h.put("count", next).put("done", next >= tgt);
                        tick.put("delta", next - cnt);
                    } else {
                        boolean d = !h.optBoolean("done");
                        h.put("done", d);
                        tick.put("done", d);
                    }
                    WidgetStore.addTick(c, tick);
                }
                if (h.optBoolean("done")) done++;
            }
            s.put("done", done);
            WidgetStore.saveSnapshot(c, s);
            WidgetStore.refreshAll(c);
        } catch (Exception ignored) {}
    }
}
