package com.youssef.questline;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        try {
            WidgetStore.saveSnapshot(getContext(), new JSONObject(call.getString("data", "{}")));
            WidgetStore.refreshAll(getContext());
            call.resolve();
        } catch (Exception e) { call.reject("bad widget data"); }
    }

    @PluginMethod
    public void pullTicks(PluginCall call) {
        JSObject r = new JSObject();
        try { r.put("ticks", new JSArray(WidgetStore.takeTicks(getContext()).toString())); }
        catch (Exception e) { r.put("ticks", new JSArray()); }
        call.resolve(r);
    }
}
