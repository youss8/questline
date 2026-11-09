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
        v.setTextViewText(R.id.quote, q.isEmpty() ? "Small steps every day add up to a different life." : "“" + q + "”");
        v.setTextViewText(R.id.cat, s.optString("quoteCat").toUpperCase());
        int st = s.optInt("streak"), tot = Math.max(1, s.optInt("total")), dn = s.optInt("done");
        v.setTextViewText(R.id.lvl, (st > 0 ? "🔥 " + st + "-day fire" : "Keep it lit") + "  ·  " + dn + "/" + s.optInt("total") + " today");
        v.setProgressBar(R.id.bar, tot, Math.min(dn, tot), false);
        return v;
    }
}
