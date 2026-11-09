package com.youssef.questline;

import android.content.Context;
import android.widget.RemoteViews;
import org.json.JSONObject;

/** The next habit, meal or commitment on today's plan. */
public class NextWidget extends WidgetBase {
    @Override
    RemoteViews build(Context c, JSONObject s, boolean fresh) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_next);
        v.setOnClickPendingIntent(R.id.root, openApp(c));
        JSONObject n = s.optJSONObject("next");
        if (!fresh) { v.setTextViewText(R.id.kind, "Next up"); v.setTextViewText(R.id.title, "Open Ember to load today"); v.setTextViewText(R.id.time, ""); return v; }
        if (n == null) { v.setTextViewText(R.id.kind, "Next up"); v.setTextViewText(R.id.title, "Nothing left today 🎉"); v.setTextViewText(R.id.time, s.optInt("done") + "/" + s.optInt("total") + " habits done"); return v; }
        v.setTextViewText(R.id.kind, "Next up · " + n.optString("kind"));
        v.setTextViewText(R.id.title, n.optString("title"));
        v.setTextViewText(R.id.time, n.optString("time"));
        return v;
    }
}
