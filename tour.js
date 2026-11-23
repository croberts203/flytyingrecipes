/* First-time tips: a short step-by-step walkthrough that dims the screen, highlights one thing at a time and points at it.
   Tour.run(id, steps, {force})  steps: [{ el: "css selector" | Element | null, title, text, place: "auto"|"above"|"below" }]
     • Runs once per id (remembered on this device) unless force is true. Steps whose element isn't on screen are skipped;
       a step with no el shows as a centered card.
   Tour.reset()   forget which tours were seen, so every tip shows again.
   Tour.seen(id)  true if that tour already ran.
   Shared by fishforecast.net and Fly Bench — keep the two copies identical. */
(function () {
  if (window.Tour) return;
  var KEY = "tour.seen.", active = null;
  function seen(id) { try { return !!localStorage.getItem(KEY + id); } catch (e) { return false; } }
  function mark(id) { try { localStorage.setItem(KEY + id, String(Date.now())); } catch (e) { } }
  function reset() { try { Object.keys(localStorage).filter(function (k) { return k.indexOf(KEY) === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { } }
  function css() {
    if (document.getElementById("tour-css")) return;
    var s = document.createElement("style"); s.id = "tour-css";
    s.textContent = ".tour-hole{position:fixed;z-index:9998;border-radius:12px;box-shadow:0 0 0 9999px rgba(5,12,22,.62),0 0 0 3px #f2b84b;transition:all .25s ease;pointer-events:none}"
      + ".tour-hole.none{box-shadow:0 0 0 9999px rgba(5,12,22,.62);width:0!important;height:0!important}"
      + ".tour-tip{position:fixed;z-index:9999;max-width:min(330px,calc(100vw - 24px));background:#fffdf7;color:#14202e;border-radius:14px;padding:14px 16px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;transition:top .25s ease,left .25s ease}"
      + ".tour-tip h4{margin:0 0 4px;font-size:16px}.tour-tip p{margin:0}.tour-tip .tour-n{font-size:12px;color:#6b7785;margin-bottom:4px}"
      + ".tour-tip .tour-b{display:flex;gap:8px;margin-top:12px;align-items:center}.tour-tip button{font:600 14px system-ui,sans-serif;border:0;border-radius:999px;padding:8px 14px;cursor:pointer}"
      + ".tour-tip .tour-next{background:#14202e;color:#fff;margin-left:auto}.tour-tip .tour-back{background:#e9e4d8;color:#14202e}.tour-tip .tour-skip{background:none;color:#6b7785;padding:8px 4px}"
      + ".tour-tip .tour-arrow{position:absolute;width:16px;height:16px;background:#fffdf7;transform:rotate(45deg)}"
      + ".tour-catch{position:fixed;inset:0;z-index:9997}";
    document.head.appendChild(s);
  }
  function find(el) { if (!el) return null; var e = typeof el === "string" ? document.querySelector(el) : el; if (!e) return null; var r = e.getBoundingClientRect(); return (r.width || r.height) && getComputedStyle(e).visibility !== "hidden" ? e : null; }
  function run(id, steps, opt) {
    opt = opt || {};
    if (active || (!opt.force && seen(id))) return false;
    css();
    var list = steps.filter(function (s) { return !s.el || find(s.el); });
    if (!list.length) return false;
    var i = 0, hole = document.createElement("div"), tip = document.createElement("div"), cat = document.createElement("div");
    hole.className = "tour-hole"; tip.className = "tour-tip"; cat.className = "tour-catch"; tip.setAttribute("role", "dialog");
    document.body.appendChild(cat); document.body.appendChild(hole); document.body.appendChild(tip);
    active = { id: id };
    function end(done) {
      mark(id); active = null; [cat, hole, tip].forEach(function (x) { x.remove(); });
      window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); document.removeEventListener("keydown", key);
      if (opt.onEnd) try { opt.onEnd(done); } catch (e) { }
    }
    function key(e) { if (e.key === "Escape") end(false); else if (e.key === "ArrowRight" || e.key === "Enter") go(1); else if (e.key === "ArrowLeft") go(-1); }
    function go(d) { i += d; if (i >= list.length) return end(true); if (i < 0) i = 0; show(); }
    function place() {
      var st = list[i], e = find(st.el), vw = innerWidth, vh = innerHeight, pad = 6;
      var old = tip.querySelector(".tour-arrow"); if (old) old.remove();
      if (!e) { hole.className = "tour-hole none"; hole.style.left = vw / 2 + "px"; hole.style.top = vh / 2 + "px"; tip.style.left = Math.max(12, (vw - tip.offsetWidth) / 2) + "px"; tip.style.top = Math.max(12, (vh - tip.offsetHeight) / 2) + "px"; return; }
      var r = e.getBoundingClientRect();
      hole.className = "tour-hole";
      hole.style.left = r.left - pad + "px"; hole.style.top = r.top - pad + "px"; hole.style.width = r.width + pad * 2 + "px"; hole.style.height = r.height + pad * 2 + "px";
      var tw = tip.offsetWidth, th = tip.offsetHeight, below = st.place === "below" || (st.place !== "above" && r.bottom + th + 24 < vh) || r.top < th + 24;
      var top = below ? r.bottom + pad + 14 : r.top - pad - 14 - th;
      top = Math.max(8, Math.min(vh - th - 8, top));
      var left = Math.max(12, Math.min(vw - tw - 12, r.left + r.width / 2 - tw / 2));
      tip.style.top = top + "px"; tip.style.left = left + "px";
      var a = document.createElement("div"); a.className = "tour-arrow";
      var ax = Math.max(14, Math.min(tw - 30, r.left + r.width / 2 - left - 8));
      a.style.left = ax + "px"; if (below) a.style.top = "-7px"; else a.style.bottom = "-7px";
      tip.appendChild(a);
    }
    function show() {
      var st = list[i], e = find(st.el);
      tip.innerHTML = '<div class="tour-n">' + (list.length > 1 ? "Step " + (i + 1) + " of " + list.length : "Tip") + '</div>' + (st.title ? "<h4>" + st.title + "</h4>" : "") + "<p>" + st.text + "</p>"
        + '<div class="tour-b"><button class="tour-skip">' + (i < list.length - 1 ? "Skip tips" : "") + '</button>' + (i ? '<button class="tour-back">Back</button>' : "") + '<button class="tour-next">' + (i < list.length - 1 ? "Next" : "Got it") + "</button></div>";
      tip.querySelector(".tour-next").onclick = function () { go(1); };
      var b = tip.querySelector(".tour-back"); if (b) b.onclick = function () { go(-1); };
      tip.querySelector(".tour-skip").onclick = function () { end(false); };
      if (!tip.querySelector(".tour-skip").textContent) tip.querySelector(".tour-skip").style.display = "none";
      if (e) { var r = e.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 90) e.scrollIntoView({ block: "center", behavior: "instant" in document.documentElement.style ? "instant" : "auto" }); }
      requestAnimationFrame(place); setTimeout(place, 60);
      tip.querySelector(".tour-next").focus({ preventScroll: true });
    }
    cat.onclick = function () { go(1); };
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true); document.addEventListener("keydown", key);
    show();
    return true;
  }
  // run a tour a moment after a screen draws, once the elements exist
  function later(id, steps, opt) { if (seen(id) && !(opt && opt.force)) return; setTimeout(function () { run(id, steps, opt); }, (opt && opt.delay) || 450); }
  window.Tour = { run: run, later: later, reset: reset, seen: seen, active: function () { return !!active; } };
})();
