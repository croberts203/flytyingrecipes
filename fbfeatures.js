/* Fly Bench "Choose your features": each person hides the parts they don't use. Stored on this device.
   Hiding works by a class on <body> (fx-off-<feature>) and CSS rules below, so screens don't need to know about it.
   Offered once after the welcome, and anytime from Account → "Choose features". */
(function () {
  var KEY = "fb_features", F = [
    { k: "inventory", name: "Materials bench", help: "Track what you have and see which flies you can tie", hide: '#tabs [data-tab="inventory"], #fcan' },
    { k: "scan", name: "Barcode scanning", help: "Scan packages to add or use up materials", hide: "#scanBtn, #emScan, #scanAddBtn" },
    { k: "deskscan", name: "Scan with phone (on a computer)", help: "Scan on your phone, type on your computer", hide: "#deskBtn" },
    { k: "receipt", name: "Read a receipt", help: "Snap a receipt to add what you bought", hide: "#rcptBtn" },
    { k: "buy", name: "Buy links & shopping lists", help: "Links to fly shops for missing materials", hide: "a.buy, [data-buy], #copyNeed, #copyLow, #pendC" },
    { k: "log", name: "Fish log", help: "Your catches with GPS, photos and the fly you used", hide: '#tabs [data-tab="log"], #tLog' },
    { k: "regs", name: "Fishing rules", help: "Size, bag limits and seasons for each fish", hide: '#tabs [data-tab="species"]' },
    { k: "forecast", name: "Bite forecast links", help: "When the fish you're tying for will bite (Fish Bite Forecast)", hide: ".fclink, .fcgo" },
    { k: "chat", name: "Fish Tails chat helper", help: "Ask questions about flies and the app", hide: "#ft-btn, .ft-btn, #ft-panel" },
    { k: "tips", name: "First-time tips", help: "Step-by-step pointers on each screen", hide: "#fxNone" },
  ];
  function off() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function apply() {
    var o = off(), b = document.body; if (!b) return;
    F.forEach(function (f) { b.classList.toggle("fx-off-" + f.k, o[f.k] === true); });
    var cur = document.querySelector("#tabs button.on");
    if (cur && getComputedStyle(cur).display === "none") { var fl = document.querySelector('#tabs [data-tab="flies"]'); if (fl) fl.click(); }
  }
  var css = document.createElement("style");
  css.textContent = F.map(function (f) { return f.hide.split(",").map(function (s) { return "body.fx-off-" + f.k + " " + s.trim(); }).join(",") + "{display:none!important}"; }).join("\n")
    + "\n.fxrow{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line,#e5dfd0);margin:0;font-weight:400}.fxrow input{width:auto;margin-top:3px}.fxrow span{display:flex;flex-direction:column}"
    + "\n.fxprompt{display:flex;gap:8px;align-items:center;padding:12px 14px;margin-bottom:10px;border-left:4px solid var(--brass,#c9973b)}";
  document.head.appendChild(css);

  function sheet(first) {
    var o = off(), s = document.createElement("div"); s.className = "sheet";
    s.innerHTML = '<div><div class="grab"></div><h2>' + (first ? "Make it yours" : "Choose your features") + '</h2>'
      + '<p class="small muted">Untick anything you don\'t use and it disappears. Change it anytime in Account.</p>'
      + '<div class="row" style="gap:6px;margin:6px 0"><button class="btn sm alt" id="fxAll">All on</button><button class="btn sm alt" id="fxBasic">Just recipes</button></div>'
      + F.map(function (f) { return '<label class="fxrow"><input type="checkbox" data-fx="' + f.k + '"' + (o[f.k] ? "" : " checked") + '><span><b>' + f.name + '</b><span class="small muted">' + f.help + "</span></span></label>"; }).join("")
      + '<button class="btn" id="fxSave" style="width:100%;margin-top:12px">Save</button></div>';
    s.addEventListener("click", function (e) { if (e.target === s) s.remove(); });
    document.body.appendChild(s);
    var boxes = s.querySelectorAll("[data-fx]");
    s.querySelector("#fxAll").onclick = function () { boxes.forEach(function (b) { b.checked = true; }); };
    s.querySelector("#fxBasic").onclick = function () { boxes.forEach(function (b) { b.checked = ["forecast", "tips"].indexOf(b.dataset.fx) >= 0; }); };
    s.querySelector("#fxSave").onclick = function () {
      var o2 = {}; boxes.forEach(function (b) { if (!b.checked) o2[b.dataset.fx] = true; });
      // scanning needs the bench
      if (o2.inventory) { o2.scan = o2.deskscan = o2.receipt = true; }
      try { localStorage.setItem(KEY, JSON.stringify(o2)); localStorage.setItem("fb_featprompted", "1"); } catch (e) { }
      s.remove(); apply(); var p = document.querySelector(".fxprompt"); if (p) p.remove();
      if (window.Stats) Stats.track("features_set");
    };
  }
  window.FBFeatures = { open: sheet, isOn: function (k) { return !off()[k]; } };

  function decorate() {
    apply();
    // "Choose features" in the Account sheet
    var del = document.getElementById("delAcct");
    if (del && !document.getElementById("fxOpen")) {
      var b = document.createElement("button"); b.id = "fxOpen"; b.className = "btn alt"; b.style.cssText = "width:100%;margin:10px 0 0"; b.textContent = "☑️ Choose features";
      b.onclick = function () { var s = b.closest(".sheet"); if (s) s.remove(); sheet(false); };
      var anchor = document.getElementById("tipsAgain") || del; anchor.parentNode.insertBefore(b, anchor);
    }
    // offered once, after the welcome, at the top of the recipes screen
    var seen = false, asked = true; try { seen = !!localStorage.getItem("fb_welcomed"); asked = !!localStorage.getItem("fb_featprompted"); } catch (e) { }
    var view = document.getElementById("view"), tab = document.querySelector("#tabs button.on");
    if (seen && !asked && view && tab && tab.dataset.tab === "flies" && !view.querySelector(".fxprompt") && view.querySelector("#fsp")) {
      var c = document.createElement("div"); c.className = "card fxprompt";
      c.style.display = "block";
      c.innerHTML = '<b>What do you want Fly Bench for?</b> <span class="small muted">Tap all that fit — the app sets itself up.</span>'
        + '<div class="chips" style="margin-top:8px"><span class="chip on" data-want="recipes">🪶 Fly recipes</span><span class="chip" data-want="inventory">🧰 Track my materials</span><span class="chip" data-want="log">🎣 Log my fish</span><span class="chip" data-want="regs">📏 Fishing rules</span></div>'
        + '<div class="row" style="gap:6px;margin-top:10px"><button class="btn sm" id="fxSet">Set it up</button><button class="btn sm alt" id="fxGo">Choose features myself</button><button class="btn sm alt" id="fxNo">Skip</button></div>';
      view.insertBefore(c, view.firstChild);
      c.querySelectorAll("[data-want]").forEach(function (x) { x.onclick = function () { if (x.dataset.want !== "recipes") x.classList.toggle("on"); }; });
      c.querySelector("#fxSet").onclick = function () {
        var want = {}; c.querySelectorAll("[data-want].on").forEach(function (x) { want[x.dataset.want] = 1; });
        var o2 = {};
        if (!want.inventory) { o2.inventory = o2.scan = o2.deskscan = o2.receipt = o2.buy = true; }
        if (!want.log) o2.log = true;
        if (!want.regs) o2.regs = true;
        try { localStorage.setItem(KEY, JSON.stringify(o2)); localStorage.setItem("fb_featprompted", "1"); } catch (e) { }
        c.remove(); apply();
        if (window.Stats) { Stats.track("howfish_set"); Object.keys(want).forEach(function (k) { Stats.track("want_" + k); }); }
      };
      c.querySelector("#fxGo").onclick = function () { sheet(true); };
      c.querySelector("#fxNo").onclick = function () { try { localStorage.setItem("fb_featprompted", "1"); } catch (e) { } c.remove(); };
    }
  }
  var t = null;
  new MutationObserver(function () { if (!t) t = setTimeout(function () { t = null; decorate(); }, 120); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.body) decorate(); else document.addEventListener("DOMContentLoaded", decorate);
})();
