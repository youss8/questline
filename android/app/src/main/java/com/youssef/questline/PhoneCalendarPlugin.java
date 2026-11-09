package com.youssef.questline;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.TimeZone;

/** Reads and writes the phone's calendar (which Google Calendar syncs), fully on-device. */
@CapacitorPlugin(name = "PhoneCalendar", permissions = {
    @Permission(alias = "calendar", strings = { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR })
})
public class PhoneCalendarPlugin extends Plugin {
    private SharedPreferences map() { return getContext().getSharedPreferences("questline_calmap", 0); }

    @PluginMethod
    public void access(PluginCall call) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) { granted(call, true); return; }
        requestPermissionForAlias("calendar", call, "permDone");
    }
    @PermissionCallback
    private void permDone(PluginCall call) { granted(call, getPermissionState("calendar") == PermissionState.GRANTED); }
    private void granted(PluginCall call, boolean ok) { JSObject r = new JSObject(); r.put("granted", ok); call.resolve(r); }

    private boolean ok(PluginCall call) {
        if (getPermissionState("calendar") != PermissionState.GRANTED) { call.reject("no calendar permission"); return false; }
        return true;
    }

    /** Pick the primary writable calendar, preferring a Google account. */
    private long calendarId() {
        ContentResolver cr = getContext().getContentResolver();
        String[] p = { CalendarContract.Calendars._ID, CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.Calendars.IS_PRIMARY, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL };
        long best = -1; int score = -1;
        try (Cursor c = cr.query(CalendarContract.Calendars.CONTENT_URI, p, null, null, null)) {
            while (c != null && c.moveToNext()) {
                if (c.getInt(3) < CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR) continue;
                int s = ("com.google".equals(c.getString(1)) ? 2 : 0) + (c.getInt(2) == 1 ? 1 : 0);
                if (s > score) { score = s; best = c.getLong(0); }
            }
        } catch (Exception ignored) {}
        return best;
    }

    @PluginMethod
    public void list(PluginCall call) {
        if (!ok(call)) return;
        long from = call.getLong("from", System.currentTimeMillis()), to = call.getLong("to", from + 14L * 86400000L);
        Uri.Builder b = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(b, from); ContentUris.appendId(b, to);
        String[] p = { CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN, CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY, CalendarContract.Instances.EVENT_ID };
        JSArray out = new JSArray();
        java.util.Set<String> mine = new java.util.HashSet<>();
        for (Object v : map().getAll().values()) mine.add(String.valueOf(v));
        try (Cursor c = getContext().getContentResolver().query(b.build(), p, null, null, CalendarContract.Instances.BEGIN + " ASC")) {
            while (c != null && c.moveToNext()) {
                if (mine.contains(String.valueOf(c.getLong(4)))) continue; // skip events Questline created
                JSObject e = new JSObject();
                e.put("title", c.getString(0)); e.put("begin", c.getLong(1)); e.put("end", c.getLong(2)); e.put("allDay", c.getInt(3) == 1);
                out.put(e);
            }
        } catch (Exception ex) { call.reject("read failed"); return; }
        JSObject r = new JSObject(); r.put("events", out); call.resolve(r);
    }

    @PluginMethod
    public void upsert(PluginCall call) {
        if (!ok(call)) return;
        String key = call.getString("key");
        long cal = calendarId();
        if (key == null || cal < 0) { call.reject("no calendar"); return; }
        boolean allDay = call.getBoolean("allDay", false);
        long start = call.getLong("start", 0L);
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Events.TITLE, call.getString("title", "Questline"));
        v.put(CalendarContract.Events.DESCRIPTION, call.getString("note", "") + "\n— from Questline");
        v.put(CalendarContract.Events.DTSTART, start);
        v.put(CalendarContract.Events.ALL_DAY, allDay ? 1 : 0);
        v.put(CalendarContract.Events.EVENT_TIMEZONE, allDay ? "UTC" : TimeZone.getDefault().getID());
        String rrule = call.getString("rrule");
        if (rrule != null && !rrule.isEmpty()) { v.put(CalendarContract.Events.RRULE, rrule); v.put(CalendarContract.Events.DURATION, allDay ? "P1D" : "PT1H"); v.putNull(CalendarContract.Events.DTEND); }
        else { v.put(CalendarContract.Events.DTEND, start + (allDay ? 86400000L : 3600000L)); v.putNull(CalendarContract.Events.RRULE); v.putNull(CalendarContract.Events.DURATION); }
        ContentResolver cr = getContext().getContentResolver();
        long id = map().getLong(key, -1);
        try {
            int n = id > 0 ? cr.update(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id), v, null, null) : 0;
            if (n == 0) {
                v.put(CalendarContract.Events.CALENDAR_ID, cal);
                Uri u = cr.insert(CalendarContract.Events.CONTENT_URI, v);
                if (u != null) map().edit().putLong(key, ContentUris.parseId(u)).apply();
            }
            call.resolve();
        } catch (Exception e) { call.reject("write failed"); }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        if (!ok(call)) return;
        String key = call.getString("key");
        long id = map().getLong(key, -1);
        if (id > 0) {
            try { getContext().getContentResolver().delete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id), null, null); } catch (Exception ignored) {}
            map().edit().remove(key).apply();
        }
        call.resolve();
    }
}
