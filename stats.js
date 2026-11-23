/* Privacy-friendly usage counting, shared by fishforecast.net and Fly Bench (keep both copies identical).
   • A random device id lives in this browser only. No names, emails, IP addresses or locations are sent.
   • Browsers with "Do Not Track" or Global Privacy Control turned on send nothing.
   • Invite links (?r=shop-name) are remembered on first visit so a shop, club or creator gets credit.
   Stats.init(app, url, key)  — call once; records one "visit" per day.   Stats.track("event_name") — a feature was used. */
(function () {
  if (window.Stats) return;
  var APP = null, URL_ = null, KEY = null, off = false, recent = {};
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function rid() { var a = new Uint8Array(10); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.from(a, function (b) { return (b % 36).toString(36); }).join(""); }
  function device() { var d = ls("stats.device"); if (!d || !/^[a-z0-9]{8,32}$/.test(d)) { d = rid() + rid(); d = d.slice(0, 16); ls("stats.device", d); } return d; }
  function platform() { var u = navigator.userAgent; return /iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(u) ? "android" : /Windows/.test(u) ? "windows" : /Mac OS X/.test(u) ? "mac" : "other"; }
  function installed() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  function ref() {
    try {
      var p = new URLSearchParams(location.search), r = (p.get("r") || p.get("ref") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
      if (r.length >= 2) {
        if (!ls("stats.ref")) ls("stats.ref", r);
        p.delete("r"); p.delete("ref"); var q = p.toString();
        history.replaceState(history.state, "", location.pathname + (q ? "?" + q : "") + location.hash);
      }
    } catch (e) { }
    var v = ls("stats.ref"); return v && /^[a-z0-9-]{2,32}$/.test(v) ? v : null;
  }
  function send(event) {
    if (off || !APP) return;
    var body = JSON.stringify({ app: APP, device: device(), event: event, ref: ref(), platform: platform(), installed: installed() });
    try { fetch(URL_ + "/rest/v1/app_events", { method: "POST", keepalive: true, headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: body }).catch(function () { }); } catch (e) { }
  }
  function track(event) {
    event = String(event || "").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 32); if (event.length < 2) return;
    var now = Date.now(); if (recent[event] && now - recent[event] < 30000) return; recent[event] = now;
    send(event);
  }
  function init(app, url, key) {
    APP = app; URL_ = url; KEY = key;
    off = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true || /[?&]demo\b/.test(location.search) || /^(localhost|127\.)/.test(location.hostname);
    ref();
    var today = new Date().toISOString().slice(0, 10);
    if (ls("stats.visit." + app) !== today) { ls("stats.visit." + app, today); send("visit"); }
  }
  window.Stats = { init: init, track: track, off: function () { return off; } };
})();
