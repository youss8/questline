package com.youssef.questline;

import android.content.Context;
import android.widget.RemoteViews;
import org.json.JSONObject;

/** Calories and protein left today. */
public class FuelWidget extends WidgetBase {
    @Override
    RemoteViews build(Context c, JSONObject s, boolean fresh) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_fuel);
        v.setOnClickPendingIntent(R.id.root, openApp(c));
        JSONObject cal = s.optJSONObject("cal");
        if (!fresh || cal == null) {
            v.setTextViewText(R.id.big, "—");
            v.setTextViewText(R.id.sub, fresh ? "Set up Fuel in the app" : "Open Questline to load today");
            v.setProgressBar(R.id.bar, 100, 0, false);
            v.setTextViewText(R.id.prot, "");
            return v;
        }
        int tgt = cal.optInt("target"), eaten = cal.optInt("eaten"), left = tgt - eaten;
        v.setTextViewText(R.id.big, left >= 0 ? String.valueOf(left) : "+" + (-left));
        v.setTextViewText(R.id.sub, left >= 0 ? "kcal left of " + tgt : "kcal over " + tgt);
        v.setProgressBar(R.id.bar, Math.max(1, tgt), Math.min(eaten, tgt), false);
        v.setTextViewText(R.id.prot, "Protein " + cal.optInt("protein") + " / " + cal.optInt("proteinTarget") + " g");
        return v;
    }
}
