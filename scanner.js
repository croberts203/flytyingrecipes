/* Fly Bench barcode reading, shared by the scanner screen.
   window.FBScan.start(video, onCode)  → reads barcodes from a playing <video>; returns stop()
   window.FBScan.decodeImage(file)     → reads a barcode from a photo (File/Blob); resolves code or null
   window.FBScan.normalize(code)       → one form per product (EAN-13 "0…" and UPC-A are the same code)
   Uses the browser's own BarcodeDetector where it exists (Chrome on Android, desktop Chrome) and the
   ZXing library everywhere else (iPhone/iPad Safari, Firefox). ZXing decodes still frames drawn to a canvas;
   it never attaches to the video itself, which is what stalled on iPhones before. */
(function () {
  if (window.FBScan) return;
  var FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];
  var ZXING_URLS = ["https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js",
                    "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js"];

  function normalize(code) {
    var d = String(code || "").trim();
    if (/^\d+$/.test(d) && d.length === 13 && d.charAt(0) === "0") d = d.slice(1); // EAN-13 with leading 0 = UPC-A
    return d;
  }

  var zx = null;
  function loadZXing() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (zx) return zx;
    zx = new Promise(function (ok, no) {
      var i = 0;
      (function next() {
        if (i >= ZXING_URLS.length) { zx = null; return no(new Error("Couldn't load the barcode reader. Check your connection, or type the code.")); }
        var s = document.createElement("script"); s.src = ZXING_URLS[i++]; s.async = true;
        s.onload = function () { window.ZXing ? ok(window.ZXing) : next(); };
        s.onerror = function () { s.remove(); next(); };
        document.head.appendChild(s);
      })();
    });
    return zx;
  }

  var reader = null;
  function zxReader(Z) {
    if (reader) return reader;
    var hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A,
      Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    reader = new Z.MultiFormatReader(); reader.setHints(hints);
    return reader;
  }
  function zxDecodeCanvas(Z, canvas) {
    try {
      var src = new Z.HTMLCanvasElementLuminanceSource(canvas);
      var r = zxReader(Z).decodeWithState(new Z.BinaryBitmap(new Z.HybridBinarizer(src)));
      return r ? r.getText() : null;
    } catch (e) { return null; } // NotFoundException etc. = nothing in this frame
  }

  // Draw a region of the source into a canvas, scaled so the long side is at most `max` px.
  function frame(canvas, srcEl, sw, sh, sx, sy, cw, ch, max) {
    var k = Math.min(1, max / Math.max(cw, ch));
    canvas.width = Math.round(cw * k); canvas.height = Math.round(ch * k);
    var g = canvas.getContext("2d", { willReadFrequently: true });
    g.drawImage(srcEl, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function start(video, onCode, onInfo) {
    var running = true, timer = null, frames = 0, lastInfo = 0;
    function info(extra) { var now = Date.now(); if (!onInfo || (now - lastInfo < 1200 && !extra)) return; lastInfo = now;
      try { onInfo({ mode: native ? "built-in reader" : (window.ZXing ? "ZXing reader" : "loading reader"), frames: frames, size: (video.videoWidth || 0) + "×" + (video.videoHeight || 0), note: extra || "" }); } catch (e) {} }
    var native = ("BarcodeDetector" in window) ? new window.BarcodeDetector({ formats: FORMATS }) : null;
    var canvas = document.createElement("canvas"), turn = 0;
    function emit(c) { c = normalize(c); if (c) onCode(c); }
    function schedule(ms) { if (running) timer = setTimeout(tick, ms); }
    function tick() {
      if (!running) return;
      if (video.readyState < 2 || !video.videoWidth) { info(); return schedule(200); }
      frames++; info();
      if (native) {
        native.detect(video).then(function (r) { if (running && r && r[0]) emit(r[0].rawValue); }).catch(function () {}).then(function () { schedule(250); });
        return;
      }
      loadZXing().then(function (Z) {
        if (!running) return;
        var vw = video.videoWidth, vh = video.videoHeight, code;
        // Alternate the middle band (where the on-screen frame is) and the whole picture.
        if (turn++ % 2 === 0) code = zxDecodeCanvas(Z, frame(canvas, video, vw, vh, 0, Math.round(vh * 0.25), vw, Math.round(vh * 0.5), 1280));
        else code = zxDecodeCanvas(Z, frame(canvas, video, vw, vh, 0, 0, vw, vh, 1024));
        if (code) emit(code);
        schedule(220);
      }, function (err) { running = false; onCode(null, err); });
    }
    tick();
    return function stop() { running = false; clearTimeout(timer); };
  }

  function decodeImage(file) {
    return new Promise(function (ok) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, canvas = document.createElement("canvas");
        var done = function (c) { URL.revokeObjectURL(url); ok(c ? normalize(c) : null); };
        var viaZX = function () {
          loadZXing().then(function (Z) {
            var c = zxDecodeCanvas(Z, frame(canvas, img, w, h, 0, 0, w, h, 1600)) ||
                    zxDecodeCanvas(Z, frame(canvas, img, w, h, 0, Math.round(h * 0.2), w, Math.round(h * 0.6), 1600)) ||
                    zxDecodeCanvas(Z, frame(canvas, img, w, h, 0, 0, w, h, 900));
            done(c);
          }, function () { done(null); });
        };
        if ("BarcodeDetector" in window) {
          new window.BarcodeDetector({ formats: FORMATS }).detect(img).then(function (r) { r && r[0] ? done(r[0].rawValue) : viaZX(); }, viaZX);
        } else viaZX();
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      img.src = url;
    });
  }

  window.FBScan = { start: start, decodeImage: decodeImage, normalize: normalize, loadZXing: loadZXing };
})();
