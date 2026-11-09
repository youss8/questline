(function (Q) {
  'use strict';
  // Offline barcode scanning (ML Kit bundled model). A product is matched against your saved foods;
  // a new product asks for its label once and is remembered forever.
  const { esc, ic } = Q;
  const BS = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner;
  Q.canScan = () => !!BS();
  let live = null;
  const stop = async () => {
    document.body.classList.remove('scanning');
    const o = document.getElementById('scan-ui'); if (o) o.remove();
    const p = BS(); if (!p) return;
    try { if (live) await live.remove(); } catch (e) { /* ignore */ }
    live = null;
    try { await p.stopScan(); } catch (e) { /* ignore */ }
  };
  Q.ACTS['scan-stop'] = () => stop();
  Q.ACTS['scan-food'] = async el => {
    const p = BS(), slot = el.dataset.slot; if (!p) return;
    try {
      let perm = await p.checkPermissions();
      if (perm.camera !== 'granted') perm = await p.requestPermissions();
      if (perm.camera !== 'granted') { Q.toast('Camera permission is needed to scan'); return; }
    } catch (e) { Q.toast('Camera not available'); return; }
    Q.closeSheet();
    document.body.classList.add('scanning');
    document.body.insertAdjacentHTML('beforeend', `<div id="scan-ui"><div class="scan-frame"><i></i></div><p>Point at the barcode</p><button class="btn" data-act="scan-stop">${ic('x')} Cancel</button></div>`);
    live = await p.addListener('barcodeScanned', async r => {
      const code = r && r.barcode && (r.barcode.rawValue || r.barcode.displayValue); if (!code) return;
      await stop(); Q.buzz(40); Q.sfx('coin');
      const f = Q.foodByBarcode(code);
      if (f) { const t = document.createElement('i'); t.dataset.id = 'my:' + f.id; t.dataset.slot = slot; Q.ACTS['food-pick'](t); return; }
      Q.ui.barcode = code; Q.ui.scanSlot = slot; Q.ACTS['myfood-new']();
      Q.toast('New product. Enter its label once and it is saved.');
    });
    try { await p.startScan({ formats: ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'QR_CODE'] }); } catch (e) { await stop(); Q.toast('Could not open the camera'); }
  };
})(window.Q);
