package com.youssef.questline;

import android.content.Context;
import android.widget.RemoteViews;
import org.json.JSONObject;

/** Quote of the day with level and streak. */
public class QuoteWidget extends WidgetBase {
    @Override
    RemoteViews build(Context c, JSONObject s, boolean fresh) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quote);
        v.setOnClickPendingIntent(R.id.root, openApp(c));
        String q = s.optString("quote");
        v.setTextViewText(R.id.quote, q.isEmpty() ? "Every completed quest is a vote for who you are." : "“" + q + "”");
        v.setTextViewText(R.id.cat, s.optString("quoteCat").toUpperCase());
        v.setTextViewText(R.id.lvl, "Lv " + s.optInt("level", 1) + "  ·  🔥 " + s.optInt("streak") + " day streak");
        v.setProgressBar(R.id.bar, 100, s.optInt("xpPct"), false);
        return v;
    }
}
