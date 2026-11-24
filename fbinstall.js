/* "Put Fly Bench on your home screen" — shown on a second visit (phones only), with iPhone or Android steps.
   Installed apps open full-screen, work offline, and people come back to them far more often. */
(function () {
  var evt = null, KEY = "fb_install_later";
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); evt = e; });
  window.addEventListener("appinstalled", function () { try { localStorage.setItem(KEY, String(Date.now() + 3650 * 864e5)); } catch (e) { } if (window.Stats) Stats.track("installed"); var c = document.querySelector(".fbinstall"); if (c) c.remove(); });
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), mobile = ios || /Android/.test(ua);
  function installed() { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
  var days = 1; try { var v = JSON.parse(ls("fb_visitdays") || "{}"), today = new Date().toISOString().slice(0, 10); if (v.last !== today) { v = { n: (v.n || 0) + 1, last: today }; ls("fb_visitdays", JSON.stringify(v)); } days = v.n; } catch (e) { }
  function steps() {
    var list = ios ? [["Tap the Share button", "The square with an arrow ⬆️ — at the bottom of Safari (top right on iPad, or in Chrome)."], ["Choose “Add to Home Screen”", "Scroll down the list if you don't see it."], ["Tap “Add”", "Open Fly Bench from your home screen from now on."]]
      : [["Open the browser menu", "The ⋮ at the top right in Chrome."], ["Tap “Install app” or “Add to Home screen”", ""], ["Tap “Install”", "Open Fly Bench from your home screen from now on."]];
    var s = document.createElement("div"); s.className = "sheet";
    s.innerHTML = '<div><div class="grab"></div><h2>Add Fly Bench to your home screen</h2>' + list.map(function (x, i) { return '<div class="row" style="gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line,#e5dfd0)"><span style="width:28px;height:28px;border-radius:50%;background:var(--brass,#c9973b);color:#fff;display:grid;place-items:center;font-weight:700;flex:0 0 auto">' + (i + 1) + '</span><div><b>' + x[0] + '</b>' + (x[1] ? '<div class="small muted">' + x[1] + "</div>" : "") + "</div></div>"; }).join("") + '<button class="btn" style="width:100%;margin-top:10px" id="fbiOk">Got it</button></div>';
    s.addEventListener("click", function (e) { if (e.target === s || e.target.id === "fbiOk") s.remove(); });
    document.body.appendChild(s);
  }
  function decorate() {
    if (installed() || !mobile || days < 2 || (+ls(KEY) || 0) > Date.now()) return;
    var view = document.getElementById("view"), tab = document.querySelector("#tabs button.on");
    if (!view || !tab || tab.dataset.tab !== "flies" || view.querySelector(".fbinstall") || view.querySelector(".fxprompt") || !view.querySelector("#fsp")) return;
    var c = document.createElement("div"); c.className = "card row fbinstall"; c.style.cssText = "gap:8px;align-items:center;padding:12px 14px;margin-bottom:10px;border-left:4px solid var(--brass,#c9973b)";
    c.innerHTML = '<div class="grow"><b>📲 Put Fly Bench on your home screen</b><div class="small muted">Opens like an app and works at the bench with no signal.</div></div><button class="btn sm" id="fbiGo">' + (evt ? "Install" : "Show me") + '</button><button class="btn sm alt" id="fbiLater">Later</button>';
    view.insertBefore(c, view.firstChild);
    c.querySelector("#fbiLater").onclick = function () { ls(KEY, String(Date.now() + 21 * 864e5)); c.remove(); };
    c.querySelector("#fbiGo").onclick = function () {
      if (window.Stats) Stats.track("install_prompt");
      if (evt) { evt.prompt(); evt.userChoice.then(function (r) { if (r && r.outcome === "accepted") { ls(KEY, String(Date.now() + 3650 * 864e5)); c.remove(); } }); evt = null; }
      else steps();
    };
  }
  var t = null;
  new MutationObserver(function () { if (!t) t = setTimeout(function () { t = null; decorate(); }, 300); }).observe(document.documentElement, { childList: true, subtree: true });
})();
