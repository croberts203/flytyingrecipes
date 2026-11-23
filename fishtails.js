/* Fish Tails: chat helper bubble for Fly Tying Recipes and Fly Bench.
   Use: <script src="https://app.flytyingrecipes.org/fishtails.js" data-where="site" defer></script>
   Optional data-side="left|right" and data-bottom="80" (px). Conversations stay in this page only. */
(function () {
  if (window.__fishTails) return; window.__fishTails = true;
  var me = document.currentScript || document.querySelector('script[src*="fishtails.js"]');
  var where = (me && me.dataset.where) || "site";
  var side = (me && me.dataset.side) || "right";
  var bottom = parseInt((me && me.dataset.bottom) || "20", 10);
  var API = "https://rkxzfzzjzrnkiyopbdke.supabase.co/functions/v1/fishtails";
  var GREEN = "#1f4d3a", GOLD = "#b5832f", CREAM = "#fdf8ec";

  var css = "\
#ft-btn{position:fixed;" + side + ":18px;bottom:" + bottom + "px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:" + GREEN + ";color:#fff;border:0;border-radius:999px;padding:11px 16px 11px 12px;font:600 15px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer}\
#ft-btn:hover{filter:brightness(1.1)}#ft-btn .ft-ico{width:26px;height:26px;border-radius:50%;background:" + GOLD + ";display:grid;place-items:center;font-size:15px}\
#ft-panel{position:fixed;" + side + ":14px;bottom:" + (bottom + 58) + "px;z-index:2147483001;width:min(370px,calc(100vw - 28px));height:min(540px,calc(100vh - " + (bottom + 90) + "px));display:none;flex-direction:column;background:" + CREAM + ";border-radius:18px;box-shadow:0 14px 44px rgba(0,0,0,.32);overflow:hidden;font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#1c2b3a}\
#ft-panel.open{display:flex}\
#ft-head{background:" + GREEN + ";color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}\
#ft-head b{font:700 17px/1.1 Georgia,serif;display:block}#ft-head small{opacity:.8;font-size:12px}\
#ft-x{margin-left:auto;background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}\
#ft-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}\
.ft-m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}\
.ft-bot{background:#fff;border:1px solid #e8dfc9;align-self:flex-start;border-bottom-left-radius:4px}\
.ft-you{background:" + GREEN + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}\
.ft-m a{color:inherit;text-decoration:underline}\
.ft-links{display:flex;flex-direction:column;gap:6px;margin-top:8px}.ft-links a{display:block;background:" + GREEN + ";color:#fff!important;text-decoration:none;border-radius:10px;padding:8px 10px;font-weight:600}\
.ft-chips{display:flex;flex-wrap:wrap;gap:6px}.ft-chips button{border:1px solid " + GOLD + ";background:#fff;color:#5a4214;border-radius:999px;padding:6px 10px;font:13px system-ui,sans-serif;cursor:pointer}\
#ft-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e8dfc9;background:#fff}\
#ft-in{flex:1;border:1px solid #d9cfb6;border-radius:12px;padding:9px 11px;font:15px system-ui,sans-serif;resize:none;min-height:42px!important;height:42px;max-height:90px;margin:0;width:auto}\
#ft-send{background:" + GOLD + ";color:#fff;border:0;border-radius:12px;padding:0 14px;font-weight:700;cursor:pointer}#ft-send:disabled{opacity:.5}\
#ft-note{font-size:11px;color:#6b6250;padding:0 12px 8px;background:#fff}\
.ft-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:#9a8c6c;animation:ftb 1s infinite}.ft-dots span:nth-child(2){animation-delay:.15s}.ft-dots span:nth-child(3){animation-delay:.3s}\
@keyframes ftb{0%,80%,100%{opacity:.3}40%{opacity:1}}\
@media print{#ft-btn,#ft-panel{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement("button");
  btn.id = "ft-btn"; btn.type = "button"; btn.setAttribute("aria-label", "Open Fish Tails chat help");
  btn.innerHTML = '<span class="ft-ico" aria-hidden="true">🐟</span>Fish Tails';
  var panel = document.createElement("div");
  panel.id = "ft-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Fish Tails chat");
  panel.innerHTML = '<div id="ft-head"><span class="ft-ico" style="width:32px;height:32px;border-radius:50%;background:' + GOLD + ';display:grid;place-items:center">🐟</span><div><b>Fish Tails</b><small>Fly tying and app help</small></div><button id="ft-x" aria-label="Close">×</button></div>' +
    '<div id="ft-log" aria-live="polite"></div>' +
    '<form id="ft-form"><textarea id="ft-in" rows="1" maxlength="1500" placeholder="Ask about a fly or the app…" aria-label="Your question"></textarea><button id="ft-send" type="submit">Send</button></form>' +
    '<div id="ft-note">AI answers can be wrong. Check your state’s official fishing rules. Account help: support@flytyingrecipes.org</div>';
  document.body.appendChild(btn); document.body.appendChild(panel);

  var log = panel.querySelector("#ft-log"), form = panel.querySelector("#ft-form"), input = panel.querySelector("#ft-in"), send = panel.querySelector("#ft-send");
  var history = [], busy = false, started = false;

  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(t) {
    var h = esc(t);
    h = h.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/\b(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/(^|[\s(])((?:app\.|www\.)?flytyingrecipes\.org[^\s<)]*[^\s<).,])/g, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>');
    h = h.replace(/(^|[\s(])(myfwc\.com[^\s<)]*[^\s<).,]?)/g, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>');
    h = h.replace(/\b([\w.+-]+@flytyingrecipes\.org)\b/g, '<a href="mailto:$1">$1</a>');
    return h;
  }
  function add(role, text) {
    var d = document.createElement("div");
    d.className = "ft-m " + (role === "user" ? "ft-you" : "ft-bot");
    d.innerHTML = fmt(text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function chips() {
    var c = document.createElement("div"); c.className = "ft-chips";
    var nb = document.createElement("button"); nb.type = "button"; nb.textContent = "📍 Fishing rules near me";
    nb.onclick = function () { c.remove(); nearMe(); }; c.appendChild(nb);
    ["How do I scan a material?", "What fly for redfish?", "Thread size for a Clouser?", "How do I share a recipe?"].forEach(function (q) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = q;
      b.onclick = function () { c.remove(); ask(q); }; c.appendChild(b);
    });
    log.appendChild(c);
  }
  function open() {
    panel.classList.add("open"); btn.setAttribute("aria-expanded", "true");
    if (!started) { started = true; add("assistant", "Hi, I'm Fish Tails. Ask me about tying a fly, picking materials, or using Fly Bench."); chips(); }
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() { panel.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  btn.onclick = function () { panel.classList.contains("open") ? close() : open(); };
  panel.querySelector("#ft-x").onclick = close;
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); } });
  form.onsubmit = function (e) { e.preventDefault(); var q = input.value.trim(); if (q) { input.value = ""; ask(q); } };

  /* GPS → state → official rules links (staterules.js). Not sent to the AI. */
  var rulesSrc = (me && me.src || "https://app.flytyingrecipes.org/fishtails.js").replace(/fishtails\.js.*$/, "staterules.js");
  function loadRules() {
    return new Promise(function (ok) {
      if (window.FBRules) return ok(window.FBRules);
      var sc = document.createElement("script"); sc.src = rulesSrc; sc.onload = function () { ok(window.FBRules || null); }; sc.onerror = function () { ok(null); };
      document.head.appendChild(sc);
    });
  }
  function nearMe() {
    add("user", "Fishing rules near me");
    var wait = add("assistant", "Getting your location…");
    loadRules().then(function (R) {
      if (!R) { wait.innerHTML = fmt("I couldn't load the rules finder. Try again, or see state fishing websites at https://www.fisheries.noaa.gov/recreational-fishing/state-recreational-fishing-websites"); return; }
      return R.locate().then(function (p) {
        var r = p.region, ls = R.links(r);
        wait.innerHTML = (r ? "You're in <b>" + esc(R.placeName(r)) + "</b>." + (ls.length ? " Here are the official fishing rules:" : "") : "I couldn't work out your state. Try these:") +
          (ls.length ? '<div class="ft-links">' : '<div>') + ls.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + " \u2197</a>"; }).join("") + "</div>" +
          (R.warning && R.warning(r) ? '<small style="display:block;margin-top:8px;color:#8a3b12;font-weight:600">\u26a0\ufe0f ' + esc(R.warning(r)) + '</small>' : '') +
          '<small style="display:block;margin-top:6px;opacity:.75">Rules change. Check the agency before you keep a fish. Only a rounded location (about 1 km) is used, and nothing is saved.</small>';
        log.scrollTop = log.scrollHeight;
      }).catch(function (e) { wait.innerHTML = fmt(e.message + " You can also look up your state at https://www.fisheries.noaa.gov/recreational-fishing/state-recreational-fishing-websites"); });
    });
  }
  function ask(q) {
    if (busy) return; busy = true; send.disabled = true;
    var ch = log.querySelector(".ft-chips"); if (ch) ch.remove();
    add("user", q); history.push({ role: "user", content: q });
    var wait = document.createElement("div"); wait.className = "ft-m ft-bot ft-dots"; wait.innerHTML = "<span></span><span></span><span></span>"; log.appendChild(wait); log.scrollTop = log.scrollHeight;
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12), where: where }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { var t = (d && (d.reply || d.error)) || "Sorry, something went wrong."; history.push({ role: "assistant", content: t }); wait.remove(); add("assistant", t); })
      .catch(function () { wait.remove(); add("assistant", "I couldn't reach the server. Check your connection and try again, or email support@flytyingrecipes.org."); history.pop(); })
      .then(function () { busy = false; send.disabled = false; input.focus(); });
  }
  if (location.hash === "#fishtails") open();
})();
