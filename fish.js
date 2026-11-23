/* Fly Bench fish silhouettes: small, recognizable side views for the species picker.
   window.FBFish.svg(commonName) -> SVG string (uses currentColor, so CSS sets the color).
   window.FBFish.short(commonName) -> short label ("Redfish (Red Drum)" -> "Redfish"). */
(function () {
  // Body outline from snout (x=4) to tail base (x=48), midline y=16. d = half depth, b = belly fullness,
  // h = head shape (0 pointed .. 1 blunt), up = mouth tilt.
  function body(d, h, b) {
    var top = 16 - d, bot = 16 + d * (b || 1);
    var hx = 4 + (1 - h) * 4;
    return "M" + hx + ",16 " +
      "C" + (hx + 2) + "," + (16 - d * (0.55 + h * 0.4)) + " 14," + top + " 24," + top + " " +
      "C34," + top + " 44," + (16 - d * 0.55) + " 48," + (16 - d * 0.28) + " " +
      "L48," + (16 + d * 0.28) + " " +
      "C44," + (16 + d * 0.6 * (b || 1)) + " 34," + bot + " 24," + bot + " " +
      "C14," + bot + " " + (hx + 2) + "," + (16 + d * (0.5 + h * 0.4)) + " " + hx + ",16Z";
  }
  var tails = {
    fork: "M47,16 L60,5 L56,16 L60,27 Z",
    deep: "M47,16 L61,3 L55,16 L61,29 Z",
    square: "M47,16 L58,8 L58,24 Z",
    round: "M47,16 C52,7 60,8 60,16 C60,24 52,25 47,16 Z",
    flat: "M46,16 C51,9 59,10 59,16 C59,22 51,23 46,16 Z"
  };
  function fins(d, kind) {
    var t = 16 - d;
    if (kind === "two") return "M20," + (t + 0.6) + " L25," + (t - 5) + " L30," + (t + 0.4) + "Z M33," + (t + 1) + " L37," + (t - 3.5) + " L42," + (t + 2) + "Z";
    if (kind === "long") return "M16," + (t + 0.4) + " C24," + (t - 5) + " 36," + (t - 5) + " 44," + (t + 2.5) + " L42," + (t + 2.5) + " C34," + (t - 1) + " 24," + (t - 1) + " 16," + (t + 0.4) + "Z";
    if (kind === "sail") return "M18," + (t + 0.4) + " L27," + (t - 7) + " L34," + (t + 0.4) + "Z";
    return "M19," + (t + 0.4) + " L26," + (t - 5) + " L35," + (t + 0.6) + "Z";
  }
  function eye(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 1.6) + '" fill="var(--fish-eye,#fff)"/>'; }
  function cut(path) { return '<path d="' + path + '" fill="none" stroke="var(--fish-eye,#fff)" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>'; }
  function dot(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="var(--fish-eye,#fff)" opacity=".9"/>'; }

  // Each shape: body depth, head, belly, tail, fin, plus distinguishing marks.
  var S = {
    redfish:   { d: 8,  h: .55, t: "square", f: "two",  m: function () { return dot(44, 13.5, 2.1) + eye(11, 14.5); } },
    drum:      { d: 10.5, h: .8, b: 1.05, t: "square", f: "two", m: function () { return cut("M22,9 L22,23 M29,8 L29,24 M36,9.5 L36,22.5") + cut("M8,20 l-1,3 M10,20.5 l-0.5,3") + eye(11, 13.5); } },
    seatrout:  { d: 6.5, h: .3, t: "square", f: "two",  m: function () { return dot(24, 12, .9) + dot(30, 11.5, .9) + dot(36, 12.5, .9) + dot(27, 15, .9) + dot(33, 15.5, .9) + dot(40, 14, .9) + eye(9.5, 15); } },
    flounder:  { d: 9, h: .95, t: "flat", f: "long", m: function () { return '<path d="M14,24.6 C22,30.5 36,30.5 45,23.5 L43,23.5 C35,26.5 24,26.5 14,24.6Z"/>' + dot(26, 13, 1.7) + dot(35, 18.5, 1.5) + dot(30, 20.5, 1) + eye(9, 11) + eye(12.5, 9.8, 1.3); } },
    sheepshead:{ d: 10, h: .85, t: "fork", f: "long", m: function () { return cut("M18,8 L18,24 M24,7 L24,25 M30,7 L30,25 M36,8 L36,24 M42,10 L42,22") + eye(10, 13.5); } },
    pompano:   { d: 11, h: .95, t: "deep", f: "sail", m: function () { return eye(10, 13.5); } },
    whiting:   { d: 5.5, h: .45, b: .9, t: "square", f: "two", m: function () { return cut("M7,19 l-1.5,3") + cut("M20,10 L18,21 M27,10 L25,21 M34,10.5 L32,21") + eye(9.5, 14.5); } },
    snook:     { d: 6,  h: .25, t: "fork",  f: "two",  m: function () { return cut("M10,16.5 C22,15 36,15.5 48,16") + eye(10, 13.5); } },
    tarpon:    { d: 8.5, h: .5, t: "deep", f: "sail", m: function () { return cut("M4.5,15.2 L9.5,12.6") + cut("M20,9.5 a4,4 0 0 1 0,8 M27,9 a4,4 0 0 1 0,8 M34,9.5 a4,4 0 0 1 0,8 M23.5,15 a4,4 0 0 1 0,8 M30.5,15 a4,4 0 0 1 0,8") + eye(11, 13); } },
    cobia:     { d: 6,  h: .95, b: .9, t: "fork", f: "long", m: function () { return cut("M10,15.5 C22,15 38,15.5 48,16") + eye(9, 13.5); } },
    jack:      { d: 10, h: 1, t: "deep", f: "two", m: function () { return dot(15, 13, 1.5) + eye(9.5, 12.5); } },
    ladyfish:  { d: 4.8, h: .2, t: "deep", f: "sail", m: function () { return eye(9, 15); } },
    mackerel:  { d: 5, h: .15, t: "deep", f: "two",  m: function () { return dot(20, 14, .9) + dot(26, 13, .9) + dot(32, 14, .9) + dot(38, 13.5, .9) + dot(23, 17, .8) + dot(30, 17, .8) + eye(9, 15); } },
    bluefish:  { d: 6.5, h: .45, t: "fork", f: "two", m: function () { return dot(19, 17.5, 1.6) + eye(10, 14); } },
    bass:      { d: 8,  h: .6, t: "square", f: "two",  m: function () { return cut("M5,17 L13,18") + cut("M13,16 C24,15 36,16 47,16") + eye(10, 13.5); } },
    sunfish:   { d: 12, h: .9, t: "round", f: "long", m: function () { return dot(15, 15, 2.2) + eye(9.5, 13); } },
    redbreast: { d: 11, h: .9, t: "round", f: "long", m: function () { return '<path d="M13,13.5 L19,14 L13,16.5 Z" fill="var(--fish-eye,#fff)"/>' + eye(9.5, 13); } },
    crappie:   { d: 11, h: .7, t: "round", f: "long", m: function () { return dot(22, 12, 1.2) + dot(30, 14, 1.4) + dot(25, 19, 1.1) + dot(37, 18, 1.2) + dot(34, 11, 1) + eye(9.5, 13.5); } },
    catfish:   { d: 6.5, h: 1, b: .9, t: "fork", f: "sail", m: function () { return '<path d="M5,16 C1,20 0,23 -1,26 M5,15 C2,13 0,12 -2,11 M6,17 C4,21 4,24 4,27" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>' + dot(28, 14, .8) + dot(34, 17, .8) + eye(9.5, 13.5); } },
    generic:   { d: 7.5, h: .5, t: "fork", f: "two", m: function () { return eye(10, 14); } }
  };
  var MATCH = [
    [/red ?fish|red drum/i, "redfish"], [/black drum/i, "drum"], [/sea ?trout|weakfish/i, "seatrout"],
    [/flounder|halibut|fluke/i, "flounder"], [/sheepshead/i, "sheepshead"], [/pompano|permit/i, "pompano"],
    [/whiting|kingfish/i, "whiting"], [/snook/i, "snook"], [/tarpon/i, "tarpon"], [/cobia/i, "cobia"],
    [/jack|crevalle|trevally/i, "jack"], [/lady ?fish/i, "ladyfish"], [/mackerel|bonito|tuna/i, "mackerel"],
    [/bluefish/i, "bluefish"], [/bass/i, "bass"], [/redbreast/i, "redbreast"], [/crappie|speckled perch/i, "crappie"],
    [/bluegill|sunfish|shellcracker|bream/i, "sunfish"], [/cat ?fish/i, "catfish"], [/drum/i, "drum"]
  ];
  function key(name) { for (var i = 0; i < MATCH.length; i++) if (MATCH[i][0].test(name || "")) return MATCH[i][1]; return "generic"; }
  function svg(name) {
    var s = S[key(name)];
    return '<svg viewBox="-3 0 66 32" aria-hidden="true" focusable="false" fill="currentColor">' +
      '<path d="' + tails[s.t] + '"/><path d="' + fins(s.d, s.f) + '"/><path d="' + body(s.d, s.h, s.b) + '"/>' + s.m() + "</svg>";
  }
  var SHORT = { "redfish (red drum)": "Redfish", "spotted seatrout": "Seatrout", "largemouth bass": "Bass",
    "redear sunfish (shellcracker)": "Redear", "redbreast sunfish": "Redbreast", "black crappie (speckled perch)": "Crappie",
    "whiting (southern kingfish)": "Whiting", "florida pompano": "Pompano", "jack crevalle": "Jack",
    "channel catfish": "Catfish", "spanish mackerel": "Mackerel" };
  function short(name) {
    var n = String(name || "");
    return SHORT[n.toLowerCase()] || n.replace(/\s*\(.*\)\s*$/, "");
  }
  window.FBFish = { svg: svg, short: short, key: key };
})();
