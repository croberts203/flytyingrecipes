/* Fly Bench first-time tips: when a screen or feature appears for the first time, a short step-by-step walkthrough
   highlights each control and points at it (tour.js). Each runs once per device; Account → "Show tips again" resets them.
   Watches the page instead of hooking into index.html, so screens can change without breaking the tips. */
(function () {
  if (!window.Tour) return;
  var T = {
    flies: [
      { el: null, title: "Welcome to Fly Bench", text: "A quick tour of the recipes. Tap <b>Next</b>, or <b>Skip tips</b> anytime — you can see them again from your account." },
      { el: "#fsp", title: "Pick a fish", text: "Tap the fish you're after to see flies that catch it." },
      { el: "#fq", title: "Or search", text: "Search by fly name, material or style — Clouser, crab, EP fiber…" },
      { el: "#fcan", title: "What can I tie right now?", text: "Shows only flies you have every material for, from your bench inventory." },
      { el: "#fmine", title: "Your recipes", text: "Recipes you've added or saved." },
      { el: "#flist .flycard, .flycard", title: "Open a recipe", text: "Each recipe has the materials list, step-by-step photos or video, and tips." },
      { el: ".fab", title: "Share your own", text: "Add a recipe with photos or a YouTube link. Others can tie it too." },
      { el: "#tabs", title: "Bench, fish log & rules", text: "Your materials, your catches, and fishing regulations are down here. Each has a short tip the first time." },
    ],
    fly: [
      { el: "#tieF", title: "Tie it step by step", text: "Big photos, one step per screen, and your screen stays awake while you tie." },
      { el: "#copyNeed", title: "Missing something?", text: "Materials you don't have are marked — copy them as a shopping list, or tap Buy." },
      { el: "#tiedF", title: "Tied one?", text: "Tap here and Fly Bench takes the materials you used off your bench." },
    ],
    tie: [
      { el: "#tNext", title: "Next step", text: "Tap Next (or swipe) when a step is done. Back is beside it." },
      { el: "#tUse, #tLog", title: "When you finish", text: "Update your bench to subtract what you used, or log a fish you caught on it." },
    ],
    inventory: [
      { el: "#scanBtn", title: "Scan what you buy", text: "Point your phone at the barcode on a package — it's added to your bench. Bought or used up, one scan each." },
      { el: "#deskBtn", title: "At your computer?", text: "Scan with your phone and type the details here with a keyboard. A USB barcode scanner works too." },
      { el: "#rcptBtn", title: "Or read a receipt", text: "Snap a receipt or order email and Claude pulls out the tying materials." },
      { el: ".qty", title: "Adjust counts", text: "Tap − or + to change how many you have. Tap a material to set a low-stock warning or add your photo." },
      { el: "#lowI", title: "Running low?", text: "See what's low or out, then copy a shopping list." },
    ],
    scanner: [
      { el: "#scanner .frame, #nativeScan", title: "Line up the barcode", text: "Hold the package so the barcode sits in the box. It reads on its own — no button to press." },
      { el: "#scanner .modes", title: "What happened to it?", text: "<b>Bought</b> adds one, <b>Used up</b> takes one off, <b>Haul</b> collects a whole shopping bag and saves it at once." },
      { el: "#pairBar", title: "Sending to your computer", text: "Your computer's scan panel is open, so codes go there to check and edit. Untick to save on the phone instead." },
      { el: "#photoCode, #manualCode", title: "Won't read?", text: "Take a still photo of the barcode, or type the numbers." },
    ],
    desk: [
      { el: "#qrBox", title: "Connect your phone", text: "Scan this with your phone's camera. It opens Fly Bench's scanner, signed in as you." },
      { el: "#pairSt", title: "Wait for the green dot", text: "It turns green when your phone is connected. Then start scanning packages." },
      { el: "[data-dm=review]", title: "Add now or review first", text: "Known items go straight onto your bench — or turn on Review first to check everything, then Save all." },
      { el: "#deskCode", title: "Have a USB scanner?", text: "Plug it in and scan here — or type a code and press Enter." },
    ],
    log: [
      { el: ".fab", title: "Log a fish", text: "Your location, the fly you used, and a photo. Catch locations are private to you." },
    ],
    catch: [
      { el: "#cId", title: "Photo species ID", text: "Add a photo, then tap here — Claude identifies the fish and checks it against the rules." },
      { el: "#cGps", title: "Mark the spot", text: "Saves exactly where you caught it, for your private map." },
      { el: "#cFly", title: "Which fly?", text: "Pick the fly you caught it on — it builds a record of what works." },
    ],
    species: [
      { el: "#view .card, #view [data-sp]", title: "Rules for each fish", text: "Size and bag limits and seasons for the fish you're after. Always confirm with the state before you keep one." },
    ],
  };
  function tab() { var b = document.querySelector("#tabs button.on"); return b && b.dataset.tab; }
  function visible(sel) { var e = document.querySelector(sel); return e && e.getBoundingClientRect().height > 0; }
  var pending = null;
  function check() {
    pending = null;
    if (window.FBFeatures && !FBFeatures.isOn("tips")) return;
    if (Tour.active() || (/[?&]demo/.test(location.search) && !/[?&]tips/.test(location.search))) return;
    // features that open over the page come first
    if (visible("#scanner")) return Tour.later("fb.scanner", T.scanner, { delay: 700 });
    if (visible(".tie")) return Tour.later("fb.tie", T.tie, { delay: 600 });
    if (visible(".sheet.desk")) return Tour.later("fb.desk", T.desk, { delay: 600 });
    if (visible(".sheet #cGps")) return Tour.later("fb.catch", T.catch, { delay: 500 });
    if (visible(".sheet #tieF")) return Tour.later("fb.fly", T.fly, { delay: 500 });
    if (document.querySelector(".sheet")) return; // some other form is open
    var t = tab();
    if (t && T[t] && document.querySelector("#view") && !document.querySelector("#view .empty .spinner")) Tour.later("fb." + t, T[t], { delay: 900 });
  }
  new MutationObserver(function () { if (!pending) pending = setTimeout(check, 250); }).observe(document.body, { childList: true, subtree: true });
  // "Show tips again" in the account sheet
  new MutationObserver(function () {
    var del = document.getElementById("delAcct");
    if (del && !document.getElementById("tipsAgain")) {
      var b = document.createElement("button"); b.id = "tipsAgain"; b.className = "btn alt"; b.style.cssText = "width:100%;margin:10px 0"; b.textContent = "💡 Show tips again";
      b.onclick = function () { Tour.reset(); var s = b.closest(".sheet"); if (s) s.remove(); var f = document.querySelector('#tabs button[data-tab="flies"]'); if (f) f.click(); };
      del.parentNode.insertBefore(b, del);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
