/* FlyDiagram: original step-by-step drawings of a fly being tied.
   FlyDiagram.svg(fly, stepIndex) → SVG string showing the fly after that step,
   with the part added in that step highlighted. Built from the recipe itself
   (fly type, materials and step text); nothing is copied from photos or videos.
   fly = { fly_type, fly_materials:[{part, material_text, category}], fly_steps:[{step_no, instruction}] } */
(function (root) {
  "use strict";

  // ---------- colours ----------
  const C = (re, c) => [new RegExp("\\b(" + re + ")\\b"), c];
  const COLORS = [
    C("hot pink|fl\\.? pink|fluo pink", "#ff4f9a"), C("hot orange|fl\\.? orange|fluo orange", "#ff7a1a"), C("chartreuse", "#b8d82c"),
    C("peacock", "#2f5f50"), C("olive", "#6f7a2c"), C("pearl", "#e3ebee"), C("silver", "#c8ccd0"), C("gold", "#d4a72c"),
    C("copper", "#b8693a"), C("black", "#1f1f22"), C("white", "#f4f1ea"), C("cream", "#efe2bf"), C("grizzly", "#9a9a9a"),
    C("claret", "#7c1f3a"), C("rust|ginger", "#b3622c"), C("hare'?s? ?ear|hare's|hares", "#8a6a45"), C("pheasant", "#8a4f2a"),
    C("partridge", "#8b7356"), C("tan|sand|khaki|camel|elk|deer", "#c8a36a"), C("brown|mink|mahogany|squirrel|moose", "#6f4a2b"),
    C("red", "#c0302e"), C("orange", "#e3801f"), C("yellow|sulphur|sulfur", "#e8c53a"), C("pink", "#e88cb0"), C("purple|violet", "#6e3f92"),
    C("blue", "#2f62a6"), C("green", "#3d8a49"), C("grey|gray|dun|adams|smoke", "#8e9093"), C("clear|translucent|mono", "#dbe6ea"),
  ];
  const DEFAULT = { thread: "#2a2a2a", body: "#7b6040", tail: "#8a6a45", wing: "#d9d3c4", hackle: "#7a5230", rib: "#d4a72c",
    bead: "#d4a72c", eyes: "#c8ccd0", legs: "#2a2a2a", thorax: "#5d4630", wingcase: "#3b2d1f", flash: "#e3ebee",
    head: "#2a2a2a", tag: "#c8ccd0", butt: "#2f5f50", post: "#f4f1ea", belly: "#f4f1ea", cheeks: "#f1e7cf",
    antennae: "#6f4a2b", claws: "#7a5230", weight: "#8e9093", foam: "#e8c53a", gills: "#c0302e", weedguard: "#888" };

  function colorOf(text) {
    const t = String(text || "").toLowerCase();
    let best = null, at = 1e9;
    for (const [re, c] of COLORS) { const m = t.match(re); if (m && m.index < at) { at = m.index; best = c; } }
    return best;
  }

  // ---------- which drawing part a recipe "part" maps to ----------
  function compOf(part, category, text) {
    const p = String(part || "").toLowerCase();
    const tx = String(text || "").toLowerCase();
    if (/head|bead|cone|weight/.test(p) && /\b(bead|cone)\b/.test(tx) && !/resin|cement/.test(tx)) return "bead";
    const table = [
      [/^hooks?$|shank|connection|front hook|rear hook/, null], [/pincer|claw/, "claws"], [/thread/, "thread"], [/bead|cone/, "bead"],
      [/eye/, "eyes"], [/weight|underbody/, "weight"], [/tag and rib/, "rib"], [/^tag|^tip$/, "tag"], [/butt/, "butt"],
      [/shuck|tail/, "tail"], [/rib/, "rib"], [/thorax cover|wing ?case|shell|back|casing/, "wingcase"],
      [/thorax/, "thorax"], [/hackle|collar|throat|beard/, "hackle"], [/post|indicator/, "post"],
      [/belly/, "belly"], [/flash/, "flash"], [/wing|topping/, "wing"], [/leg/, "legs"], [/cheek|side/, "cheeks"],
      [/antenna|whisker|horn/, "antennae"], [/claw/, "claws"], [/weed/, "weedguard"], [/gill/, "gills"],
      [/head|glue|coat|resin|finish|varnish|cement/, "head"], [/foam/, "foam"], [/body|abdomen|colour|color/, "body"],
    ];
    for (const [re, c] of table) if (re.test(p)) return c;
    if (category === "glue") return "head";
    if (category === "eyes") return "eyes";
    if (category === "hook") return null;
    return "body";
  }

  // Material nouns we look for in step text.
  const NOUNS = /\b(foam|chenille|estaz|marabou|bucktail|hackles?|herl|dubbing|dub|wire|tinsel|biots?|elk|deer|calf|moose|floss|flash|flashabou|krystal|rabbit|zonker|fur|squirrel|partridge|hen|cock|cdc|quill|antron|zelon|poly|yarn|thin ?skin|scud ?back|legs|lead|tungsten|eyes|bead|cone|craft fur|ep fibers?|ep fibres?|polar|saddle|schlappen|ostrich|pheasant|mylar|tubing|braid|vinyl|ribbing|swiss straw|raffia|latex|mallard|teal|turkey|tippets?|sword|mohair|seal|beaver|microfibbets?|mono|body wrap|super hair|pseudo hackle|ice dub|sparkle|peacock|wool|crystal|chain)\b/g;
  const keyWords = (text) => {
    const t = String(text || "").toLowerCase().replace(/\(.*?\)/g, " ");
    const nouns = [...new Set((t.match(NOUNS) || []).map((w) => w.replace(/s$/, "")))];
    return nouns;
  };

  // ---------- style of the fly ----------
  function styleOf(fly) {
    const t = String(fly.fly_type || "").toLowerCase();
    const mats = (fly.fly_materials || []).map((m) => String(m.material_text || "").toLowerCase()).join(" ");
    const s = {
      dry: /dry|dun|spinner|hopper|terrestrial|stillwater dry|daddy|mayfly/.test(t) && !/wet|sunk/.test(t),
      streamer: /streamer|baitfish|pike|bucktail|clouser|tarpon|leech|lure|fry|bass streamer|rope/.test(t),
      salmon: /salmon|steelhead|spey|shad/.test(t),
      wet: /wet|spider|loch|lough|soft hackle/.test(t),
      nymph: /nymph|scud|sowbug|larva|pupa|buzzer|midge|emerger|caddis|shrimp|crab|crayfish|egg|worm|booby|carp/.test(t),
      popper: /popper|bass bug|slider|diver|topwater/.test(t),
      caddisWing: /elk|deer/.test(mats) && /dry|caddis|hopper|stimulator/.test(t + mats),
    };
    s.L = s.streamer || s.salmon ? 270 : s.dry ? 200 : s.popper ? 210 : 220;
    s.thick = s.streamer ? 15 : s.dry ? 9 : s.popper ? 26 : 12;
    return s;
  }

  // ---------- read the steps into a build-up of parts ----------
  const WOUND = /\b(wrap|wraps|wrapping|wind|winding|wound|palmer|palmered|spiral|forward|turns?|dub|dubbed|dubbing loop|build|form|counter-?wrap|rib (it|them|with)|pull|fold|bring|spin|spun|clip|clipping|glue|fluff)\b/;
  const TIE = /\b(tie|ties|tied|attach|secure|catch|mount|add|lash|stack|measure|slide|thread on|put)\b/;

  function plan(fly) {
    const mats = (fly.fly_materials || []).map((m) => ({ ...m, comp: compOf(m.part, m.category, m.material_text), kw: keyWords(m.material_text), color: colorOf(m.material_text) }));
    const hasMat = (c) => mats.some((m) => m.comp === c);
    if (!hasMat("body")) mats.forEach((m) => { if (/underbody/i.test(m.part || "")) m.comp = "body"; });
    const steps = [...(fly.fly_steps || [])].sort((a, b) => a.step_no - b.step_no);
    const state = {};
    const frames = [];
    steps.forEach((st, i) => {
      const full = " " + String(st.instruction || "").toLowerCase() + " ";
      const active = new Set();
      const set = (comp, how, mat) => {
        if (!comp) return;
        const prev = state[comp];
        if (prev && (prev.done || how === "tied")) return; // already there: no change, no highlight
        state[comp] = { done: how !== "tied", how, mat: mat || (prev && prev.mat) || mats.find((m) => m.comp === comp) || null };
        active.add(comp);
      };
      // Work clause by clause so "tie in the wire and dub a body" ties the wire but dubs the body.
      const clauses = full.replace(/\(.*?\)/g, " ").split(/[,;.:]| and then | then | and (?=[a-z]+ (?:in|on|a|the|it|them|some|two|three)\b)/);
      let verb = null, lastHits = [];
      for (const c of clauses) {
        const t = " " + c + " ";
        const local = WOUND.test(t) ? "done" : TIE.test(t) ? "tied" : null;
        const listItem = /^\s*(and |or )?(the|a|an|some|two|three|four|\d)\b/.test(c);
        if (local) verb = local; else if (!listItem) verb = null;
        const hits = [];
        for (const m of mats) {
          if (!m.comp || m.comp === "head" || m.comp === "thread") continue;
          const pw = String(m.part || "").toLowerCase().replace(/[^a-z ]/g, " ").trim().split(/\s+/)[0];
          let score = 0;
          if (pw && new RegExp(`\\b${pw}s?\\b`).test(t) && !(pw === "wing" && /wing ?case/.test(t))) score += 2;
          if (m.kw.some((w) => new RegExp(`\\b${w.replace(/ /g, " ?")}`).test(t))) score += 1;
          if (score && m.color && t.match(COLORS.find(([, col]) => col === m.color)[0])) score += 0.5;
          if (score >= 1) hits.push({ score, m });
        }
        // Two materials sharing a word (white and chartreuse bucktail): keep the better match, then the one not used yet.
        hits.sort((a, b) => b.score - a.score || (state[a.m.comp] ? 1 : 0) - (state[b.m.comp] ? 1 : 0));
        const used = new Set();
        const picked = [];
        for (const h of hits) {
          const words = h.m.kw.filter((w) => t.includes(w));
          if (h.score < 2 && words.length && words.every((w) => used.has(w))) continue;
          words.forEach((w) => used.add(w));
          picked.push(h.m);
        }
        const pron = /\b(wind|wrap|palmer|rib|tie|pull|fold|bring|secure)\s+(it|them)\b/.test(t);
        const targets = !verb ? [] : picked.length ? picked : pron ? lastHits : [];
        for (const m of targets) {
          const winds = /body|rib|hackle|wingcase/.test(m.comp);
          set(m.comp, winds && verb !== "done" ? "tied" : "done", m);
        }
        if (picked.length) lastHits = picked;
      }
      const t = full;
      // Plain keyword fallbacks.
      if (/start (the )?thread|thread base|attach (the )?thread|lay (down )?a thread|start the tying thread/.test(t)) set("thread", "done");
      if (/\b(bead|cone)\b/.test(t) && /slide|thread on|put on|add|push/.test(t)) set("bead", "done");
      if (/dumbbell|bead.?chain|lead eyes|\beyes\b/.test(t) && /tie|lash|mount|figure|glue|stick/.test(t)) set("eyes", "done");
      if (hasMat("tail") && /\btail\b/.test(t) && /tie|mount|measure/.test(t) && !/pheasant tail|tail fib/.test(t)) set("tail", "done");
      if (hasMat("claws") && /\b(claws?|pincers?|chelae)\b/.test(t) && TIE.test(t)) set("claws", "done");
      if (hasMat("legs") && /\blegs?\b/.test(t) && (TIE.test(t) || /pick out/.test(t))) set("legs", "done");
      if (hasMat("weight") && /\b(weight|lead|non-?lead|lead-?free)\b/.test(t) && /wrap|weight|turns|add/.test(t)) set("weight", "done");
      if (/thorax/.test(t) && /dub|wrap|build|form|wind/.test(t)) set("thorax", "done");
      if (hasMat("hackle") && /collar|hackle/.test(t) && /wind|wrap|turns|palmer/.test(t)) set("hackle", "done");
      if (/\b(body|abdomen)\b/.test(t) && /wrap|wind|dub|build|form/.test(t)) set("body", "done");
      if (hasMat("wing") && /\bwings?\b(?! ?case)/.test(t) && /tie|mount|add|set|divide/.test(t)) set("wing", "done");
      if (hasMat("rib") && /\brib\b|ribbing/.test(t)) set("rib", /\brib (it|them|with)|wind|wrap|spiral/.test(t) ? "done" : "tied");
      if (hasMat("wingcase") && /wing ?case|shellback|back over|pull .*(over|forward)/.test(t) && /pull|fold|bring/.test(t)) set("wingcase", "done");
      if (/whip.?finish|head cement|varnish|uv resin|build (a |the )?(neat |small |tapered )*head|form (a |the )?(neat |small )*head/.test(t)) set("head", "done");
      // Nothing matched clause by clause: fall back to the whole step.
      if (!active.size && (TIE.test(t) || WOUND.test(t))) {
        for (const m of mats) {
          if (!m.comp || state[m.comp] || /head|thread|eyes|bead/.test(m.comp)) continue;
          if (m.kw.some((w) => new RegExp(`\\b${w}`).test(t))) set(m.comp, /body|rib|hackle|wingcase/.test(m.comp) && !WOUND.test(t) ? "tied" : "done", m);
        }
      }
      if (i === steps.length - 1) {
        if (!state.head) set("head", "done");
        for (const k in state) if (!state[k].done) { state[k].done = true; active.add(k); }
      }
      if (!state.thread) state.thread = { done: true, mat: mats.find((m) => m.comp === "thread") || null };
      frames.push({ state: JSON.parse(JSON.stringify(state)), active: [...active] });
    });
    return { frames, mats };
  }

  // ---------- drawing ----------
  const W = 480, H = 270, Y = 128;
  const f1 = (n) => Math.round(n * 10) / 10;

  function svg(fly, stepIndex, opts) {
    opts = opts || {};
    const s = styleOf(fly);
    const { frames, mats } = plan(fly);
    const fr = frames[Math.max(0, Math.min(stepIndex, frames.length - 1))] || { state: {}, active: [] };
    const st = fr.state;
    const has = (c) => st[c] && st[c].done;
    const tied = (c) => st[c] && !st[c].done;
    const matCol = (c) => (st[c] && st[c].mat && st[c].mat.color) || (mats.find((m) => m.comp === c) || {}).color;
    const col = (c) => matCol(c) || (c === "body" && !mats.some((m) => m.comp === "body") ? matCol("thread") : null)
      || (c === "thorax" ? matCol("body") : null) || (c === "head" ? matCol("thread") : null) || DEFAULT[c];
    const txt = (c) => String((st[c] && st[c].mat && st[c].mat.material_text) || "").toLowerCase();

    const xe = 410, L = s.L, xb = xe - L;
    const X = (t) => xb + t * L;
    const tailLen = Math.min(s.dry ? L * 0.85 : s.streamer ? L * 0.95 : L * 0.45, xb - 22);
    const thoraxOn = has("thorax") || mats.some((m) => m.comp === "thorax");
    const postT = 0.68;
    const bodyEnd = thoraxOn ? 0.62 : mats.some((m) => m.comp === "post") ? postT - 0.02 : has("bead") || has("eyes") ? 0.8 : 0.86;
    const bodyStart = (has("tag") ? 0.05 : 0) + (has("butt") ? 0.06 : 0);
    const th = s.thick;
    const parts = [];
    const uid = "fd" + Math.random().toString(36).slice(2, 8);
    const glow = (c, g) => (fr.active.includes(c) ? `<g filter="url(#${uid}h)">${g}</g>` : g);
    const light = (hex) => { const n = parseInt(String(hex).slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) > 200; };
    const edge = (color) => (light(color) ? ` stroke="#a89f8e" stroke-width="1"` : ` stroke="rgba(0,0,0,.22)" stroke-width=".8"`);

    // body silhouette between t0..t1 with a gentle taper
    const sil = (t0, t1, h0, h1) => {
      const a = X(t0), b = X(t1);
      return `M${f1(a)},${f1(Y - h0)} C${f1(a + (b - a) * 0.4)},${f1(Y - h1 * 1.05)} ${f1(b - 10)},${f1(Y - h1)} ${f1(b)},${f1(Y - h1 * 0.6)} L${f1(b)},${f1(Y + h1 * 0.6)} C${f1(b - 10)},${f1(Y + h1)} ${f1(a + (b - a) * 0.4)},${f1(Y + h1 * 1.05)} ${f1(a)},${f1(Y + h0)} Z`;
    };
    const fibres = (x0, y0, len, angle, spread, n, color, w = 1.4, curl = 0) => {
      let out = "";
      const under = light(color);
      for (let i = 0; i < n; i++) {
        const a = (angle + (i / Math.max(1, n - 1) - 0.5) * spread) * Math.PI / 180;
        const l = len * (0.82 + 0.18 * Math.sin(i * 2.3));
        const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l;
        const cx = (x0 + x1) / 2 + curl * Math.sin(i), cy = (y0 + y1) / 2 + curl * Math.cos(i * 1.7);
        const d = `M${f1(x0)},${f1(y0)} Q${f1(cx)},${f1(cy)} ${f1(x1)},${f1(y1)}`;
        if (under) out += `<path d="${d}" stroke="#a89f8e" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round"/>`;
        out += `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      }
      return out;
    };
    // A solid bunch of hair or fibres from (x0,y0) back to x1, bulging up (dir -1) or down (dir 1).
    const bundle = (x0, y0, x1, h, dir, color, n = 9) => {
      const mid = x0 + (x1 - x0) * 0.45;
      let g = `<path d="M${f1(x0)},${f1(y0 - dir * 2)} C${f1(mid)},${f1(y0 + dir * h)} ${f1(x1 + (x0 - x1) * 0.12)},${f1(y0 + dir * h * 0.7)} ${f1(x1)},${f1(y0 + dir * h * 0.25)} C${f1(x1 + (x0 - x1) * 0.2)},${f1(y0 + dir * h * 0.15)} ${f1(mid)},${f1(y0 + dir * h * 0.15)} ${f1(x0)},${f1(y0 + dir * 3)} Z" fill="${color}"${edge(color)}/>`;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1), yy = y0 + dir * h * (0.15 + 0.55 * k);
        g += `<path d="M${f1(x0 - 4)},${f1(y0 + dir * 2)} Q${f1(mid)},${f1(yy)} ${f1(x1 + (x0 - x1) * 0.03 * i)},${f1(y0 + dir * h * (0.2 + 0.3 * k))}" stroke="rgba(0,0,0,.13)" stroke-width=".8" fill="none"/>`;
      }
      return g;
    };
    const strand = (c, i) => {
      const color = col(c);
      const x0 = X(bodyStart + 0.01), y1 = Y + 70 + i * 6, x1 = x0 - 30 - i * 26;
      const w = c === "body" ? 6 : c === "hackle" ? 3 : c === "wingcase" ? 8 : 2;
      let g = `<path d="M${f1(x0)},${Y} C${f1(x0 - 4)},${Y + 30} ${f1(x1 + 10)},${f1(y1 - 20)} ${f1(x1)},${f1(y1)}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      if (c === "hackle") g += fibres(x1 + 6, y1 - 12, 9, 200, 140, 7, color, 1);
      return glow(c, g);
    };

    // hook (drawn first, under everything)
    const R = 34;
    const hook = `<path d="M${xe},${Y} L${xb},${Y} A${R},${R} 0 0 0 ${xb},${Y + 2 * R} Q${xb + 34},${Y + 2 * R} ${xb + 42},${Y + R * 0.75}" stroke="#7d8389" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M${xb + 42},${Y + R * 0.75} l-9,6" stroke="#7d8389" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${xe + 9}" cy="${Y}" r="7" stroke="#7d8389" stroke-width="3.5" fill="none"/>`;
    parts.push(hook);

    if (has("thread")) parts.push(glow("thread", `<line x1="${X(0)}" y1="${Y}" x2="${X(0.92)}" y2="${Y}" stroke="${col("thread")}" stroke-width="3.5"/>`));
    if (has("weight")) {
      let g = "";
      for (let t = 0.25; t <= 0.7; t += 0.035) g += `<line x1="${f1(X(t))}" y1="${Y - 6}" x2="${f1(X(t) + 4)}" y2="${Y + 6}" stroke="${col("weight")}" stroke-width="3"/>`;
      parts.push(glow("weight", g));
    }

    // tail (behind the body)
    if (has("tail")) {
      const c = col("tail"), m = txt("tail");
      let g;
      if (/bucktail|calf|moose|elk|deer|squirrel|hair/.test(m) && !/marabou/.test(m)) {
        g = s.dry ? fibres(X(0.02), Y - 1, tailLen, 182, 8, 10, c, 1.3) : bundle(X(0.04), Y - 1, X(0) - tailLen, 10, 1, c) + bundle(X(0.04), Y + 1, X(0) - tailLen, 8, -1, c);
      } else if (/saddle hackles|hackles, |splayed|deceiver/.test(m) || (s.streamer && /hackle/.test(m))) {
        g = `<path d="M${X(0.04)},${Y} C${X(0) - tailLen * 0.4},${Y - 16} ${X(0) - tailLen * 0.85},${Y - 12} ${X(0) - tailLen},${Y - 2} C${X(0) - tailLen * 0.8},${Y + 2} ${X(0) - tailLen * 0.4},${Y + 8} ${X(0.04)},${Y + 3} Z" fill="${c}"${edge(c)}/>`
          + `<path d="M${X(0.04)},${Y + 1} C${X(0) - tailLen * 0.4},${Y + 14} ${X(0) - tailLen * 0.85},${Y + 12} ${X(0) - tailLen * 0.97},${Y + 4}" stroke="${light(c) ? "#a89f8e" : "rgba(0,0,0,.3)"}" fill="none"/>`;
      } else if (/marabou|rabbit|zonker|craft fur|arctic fox/.test(m) || (s.streamer && !/fib|biot|hackle/.test(m))) {
        g = `<path d="M${X(0.04)},${Y - 5} C${X(0) - tailLen * 0.4},${Y - 22} ${X(0) - tailLen * 0.8},${Y - 18} ${X(0) - tailLen},${Y - 4} C${X(0) - tailLen * 0.85},${Y + 4} ${X(0) - tailLen * 0.85},${Y + 6} ${X(0) - tailLen},${Y + 14} C${X(0) - tailLen * 0.6},${Y + 20} ${X(0) - tailLen * 0.3},${Y + 14} ${X(0.04)},${Y + 5} Z" fill="${c}" opacity=".95"${edge(c)}/>`
          + fibres(X(0.02), Y, tailLen * 0.95, 180, 14, 7, c, 1.2, 6);
      } else if (/biot/.test(m)) {
        g = fibres(X(0.02), Y, tailLen * 0.6, 180, 50, 2, c, 3);
      } else if (/shuck|sparkle|antron|zelon/.test(m)) {
        g = fibres(X(0.02), Y + 2, tailLen * 0.5, 178, 26, 9, c, 1.6, 4);
      } else {
        g = fibres(X(0.02), Y - 1, tailLen, 182, 12, s.dry ? 9 : 8, c, 1.2);
      }
      if (has("flash") && /tail/.test(String((st.flash.mat || {}).part || "") + " " + txt("tail"))) g += fibres(X(0.02), Y, tailLen * 0.9, 180, 8, 3, col("flash"), 1);
      parts.push(glow("tail", g));
    }
    if (has("tag")) parts.push(glow("tag", `<rect x="${X(0)}" y="${Y - th * 0.5}" width="${L * 0.05}" height="${th}" rx="2" fill="${col("tag")}"/>`));
    if (has("butt")) parts.push(glow("butt", `<ellipse cx="${X(bodyStart - 0.03)}" cy="${Y}" rx="${L * 0.035}" ry="${th * 0.75}" fill="${col("butt")}"/>`));

    // belly (under the shank, streamers / Clousers)
    if (has("belly")) parts.push(glow("belly", bundle(X(0.84), Y + 3, X(0) - tailLen * (s.streamer ? 1 : 0.6), th + 4, 1, col("belly"))));

    // body
    if (has("body") && /egg/.test(String(fly.fly_type || "").toLowerCase())) {
      const c = col("body");
      parts.push(glow("body", `<circle cx="${X(0.5)}" cy="${Y - 4}" r="${L * 0.2}" fill="${c}"${edge(c)}/><circle cx="${X(0.5) - L * 0.06}" cy="${Y - 4 - L * 0.07}" r="${L * 0.05}" fill="#fff" opacity=".35"/>`));
    } else if (has("body")) {
      const c = col("body"), m = txt("body");
      let g = `<path d="${sil(bodyStart, bodyEnd, th * 0.55, th)}" fill="${c}"/>`;
      if (/chenille|estaz|cactus|ice chenille/.test(m)) {
        for (let t = bodyStart + 0.02; t < bodyEnd; t += 0.05) g += `<ellipse cx="${f1(X(t))}" cy="${Y}" rx="${f1(L * 0.026)}" ry="${f1(th * (0.7 + 0.3 * (t / bodyEnd)))}" fill="${c}" stroke="rgba(0,0,0,.18)"/>`;
      } else if (/dub|hare|fur|squirrel|seal|antron/.test(m) || (!/floss|thread|quill|tinsel|mylar|foam|wire|herl|biot|stripped/.test(m))) {
        for (let t = bodyStart; t < bodyEnd; t += 0.012) {
          const h = th * (0.6 + 0.5 * (t - bodyStart) / (bodyEnd - bodyStart));
          g += `<line x1="${f1(X(t))}" y1="${f1(Y - h)}" x2="${f1(X(t) + 3 * Math.sin(t * 90))}" y2="${f1(Y - h - 3)}" stroke="${c}" stroke-width="1.2"/><line x1="${f1(X(t))}" y1="${f1(Y + h)}" x2="${f1(X(t) - 2 * Math.cos(t * 70))}" y2="${f1(Y + h + 3)}" stroke="${c}" stroke-width="1.2"/>`;
        }
      } else if (/herl/.test(m)) {
        for (let t = bodyStart; t < bodyEnd; t += 0.03) g += fibres(X(t), Y, th * 1.1, 270, 50, 3, c, 1) + fibres(X(t), Y, th * 1.1, 90, 50, 3, c, 1);
      } else if (/tinsel|mylar|flash/.test(m)) {
        g = `<path d="${sil(bodyStart, bodyEnd, th * 0.5, th * 0.8)}" fill="url(#${uid}m)"/>` + `<path d="${sil(bodyStart, bodyEnd, th * 0.5, th * 0.8)}" fill="${c}" opacity=".55"/>`;
      } else {
        for (let t = bodyStart + 0.04; t < bodyEnd; t += 0.045) g += `<line x1="${f1(X(t))}" y1="${f1(Y - th * 0.9)}" x2="${f1(X(t) - 4)}" y2="${f1(Y + th * 0.9)}" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>`;
      }
      parts.push(glow("body", g));
    }
    // rib
    if (has("rib") && has("body")) {
      let g = "";
      for (let t = bodyStart + 0.05; t < bodyEnd - 0.02; t += 0.075) g += `<line x1="${f1(X(t))}" y1="${f1(Y - th * 0.95)}" x2="${f1(X(t) - 9)}" y2="${f1(Y + th * 0.95)}" stroke="${col("rib")}" stroke-width="2.2"/>`;
      parts.push(glow("rib", g));
    }
    // palmered hackle along the body
    const hStyle = (() => {
      const p = String((st.hackle && st.hackle.mat && st.hackle.mat.part) || "").toLowerCase() + " " + txt("hackle");
      if (/parachute/.test(p) || mats.some((m) => m.comp === "post")) return "para";
      if (/palmer|body hackle/.test(p)) return "palmer";
      if (/throat|beard/.test(p)) return "throat";
      return "collar";
    })();
    if (has("hackle") && hStyle === "palmer") {
      let g = "";
      for (let t = bodyStart + 0.04; t < bodyEnd; t += 0.06) g += fibres(X(t), Y, th + 8, 250, 40, 3, col("hackle"), 1.1) + fibres(X(t), Y, th + 8, 110, 40, 3, col("hackle"), 1.1);
      parts.push(glow("hackle", g));
    }
    // thorax and wing case
    if (has("thorax")) parts.push(glow("thorax", `<ellipse cx="${X(0.73)}" cy="${Y}" rx="${L * 0.12}" ry="${th * 1.35}" fill="${col("thorax")}"/>`));
    if (has("wingcase") && !thoraxOn) parts.push(glow("wingcase", `<path d="M${X(bodyStart)},${Y - th * 0.8} Q${X(0.5)},${Y - th * 1.6} ${X(0.97)},${Y - th * 0.9} L${X(1.04)},${Y - th * 0.7} L${X(0.97)},${Y - th * 0.3} Q${X(0.5)},${Y - th * 1.0} ${X(bodyStart)},${Y - th * 0.3} Z" fill="${col("wingcase")}"${edge(col("wingcase"))}/>`));
    else if (has("wingcase")) parts.push(glow("wingcase", `<path d="M${X(0.6)},${Y - th * 1.1} Q${X(0.73)},${Y - th * 1.9} ${X(0.86)},${Y - th * 0.9} L${X(0.86)},${Y - th * 0.4} Q${X(0.73)},${Y - th * 1.1} ${X(0.6)},${Y - th * 0.6} Z" fill="${col("wingcase")}"/>`));
    if (has("legs")) {
      const c = col("legs");
      parts.push(glow("legs", fibres(X(0.72), Y + th * 0.6, 34, 125, 50, 3, c, 2) + (s.streamer || s.popper ? fibres(X(0.5), Y, 46, 160, 30, 2, c, 2.2) : "")));
    }
    if (has("gills")) parts.push(glow("gills", fibres(X(0.82), Y + 4, 14, 120, 40, 5, col("gills"), 1.5)));

    // wings
    if (has("wing")) {
      const c = col("wing"), m = txt("wing");
      let g;
      if (s.caddisWing || (/elk|deer/.test(m) && s.dry)) {
        g = bundle(X(0.86), Y - th * 0.6, X(-0.05), th + 16, -1, c, 12)
          + `<path d="M${X(0.86)},${Y - th * 0.7} L${X(0.92)},${Y - th - 8} L${X(0.95)},${Y - th - 2} L${X(0.93)},${Y - 2} Z" fill="${c}"${edge(c)}/>`;
      } else if (s.dry && !s.popper) {
        g = fibres(X(0.72), Y - 4, 44, 262, 18, 7, c, 1.6) + fibres(X(0.72), Y - 4, 40, 278, 16, 6, c, 1.4);
      } else if (s.streamer || s.salmon || /bucktail|craft fur|ep fib|polar|synthetic|hair/.test(m)) {
        const len = L * 0.86 + tailLen * (s.streamer ? 0.95 : 0.5);
        g = bundle(X(0.88), Y - th * 0.4, X(0.88) - len, th + 12, -1, c, 11);
      } else {
        g = /biot/.test(m)
          ? `<path d="M${X(0.86)},${Y - th * 0.7} C${X(0.65)},${Y - th - 10} ${X(0.45)},${Y - th - 8} ${X(0.4)},${Y - th - 2} C${X(0.5)},${Y - th - 1} ${X(0.7)},${Y - th} ${X(0.84)},${Y - th * 0.3} Z" fill="${c}"${edge(c)}/>`
          : `<path d="M${X(0.86)},${Y - th * 0.6} C${X(0.55)},${Y - th - 22} ${X(0.15)},${Y - th - 16} ${X(0.02)},${Y - th - 6} C${X(0.2)},${Y - th - 2} ${X(0.55)},${Y - th - 2} ${X(0.84)},${Y - 2} Z" fill="${c}"${edge(c)}/>`;
      }
      if (has("flash") && !/tail/.test(String((st.flash.mat || {}).part || ""))) g += fibres(X(0.88), Y - 4, L * 0.8 + (s.streamer ? tailLen : 0), 182, 6, 4, col("flash"), 1);
      parts.push(glow("wing", g));
    } else if (has("flash") && !has("tail")) {
      parts.push(glow("flash", fibres(X(0.85), Y - 3, L * 0.8 + tailLen * 0.9, 181, 6, 6, col("flash"), 1)));
    } else if (has("flash") && fr.active.includes("flash")) {
      parts.push(glow("flash", fibres(X(0.85), Y - 3, L * 0.8 + tailLen * 0.9, 181, 6, 6, col("flash"), 1)));
    }
    if (has("cheeks")) parts.push(glow("cheeks", `<ellipse cx="${X(0.8)}" cy="${Y - 4}" rx="${L * 0.06}" ry="${th * 0.6}" fill="${col("cheeks")}" stroke="#222" stroke-width="1"/><circle cx="${X(0.83)}" cy="${Y - 4}" r="2.5" fill="#222"/>`));

    // post + parachute, collar and throat hackles
    if (has("post")) parts.push(glow("post", fibres(X(postT), Y - 4, 46, 270, 14, 7, col("post"), 1.8)));
    if (has("hackle") && hStyle === "para") {
      const cy = Y - 16;
      parts.push(glow("hackle", `<ellipse cx="${X(postT)}" cy="${cy}" rx="34" ry="5" fill="${col("hackle")}" opacity=".35"/>` + fibres(X(postT), cy, 34, 180, 24, 6, col("hackle"), 1.2) + fibres(X(postT), cy, 34, 0, 24, 6, col("hackle"), 1.2)));
    }
    if (has("hackle") && hStyle === "collar" && /hair|bucktail|calf|craft fur|fibre|fiber/.test(txt("hackle") + " " + String((st.hackle.mat || {}).category || ""))) {
      const x1 = X(0) - tailLen * (s.streamer ? 0.7 : 0.2), c = col("hackle");
      parts.push(glow("hackle", bundle(X(0.9), Y - 3, x1, th + 12, -1, c, 10) + bundle(X(0.9), Y + 3, x1, th + 10, 1, c, 10)));
    } else if (has("hackle") && hStyle === "collar") {
      const x = X(bodyEnd + 0.02);
      const g = s.dry ? fibres(x, Y, th + 22, 270, 40, 7, col("hackle"), 1.2) + fibres(x, Y, th + 22, 90, 40, 7, col("hackle"), 1.2)
        : fibres(x, Y, th + 24, 215, 70, 8, col("hackle"), 1.2, 3) + fibres(x, Y, th + 24, 145, 70, 8, col("hackle"), 1.2, 3);
      parts.push(glow("hackle", g));
    }
    if (has("hackle") && hStyle === "throat") parts.push(glow("hackle", fibres(X(bodyEnd + 0.02), Y + 4, th + 22, 145, 30, 7, col("hackle"), 1.2, 3)));
    if (has("antennae")) parts.push(glow("antennae", fibres(X(0.95), Y - 2, 60, -18, 18, 2, col("antennae"), 1.2)));
    if (has("claws")) parts.push(glow("claws", `<ellipse cx="${X(0) - 24}" cy="${Y - 8}" rx="24" ry="7" fill="${col("claws")}"/><ellipse cx="${X(0) - 22}" cy="${Y + 8}" rx="22" ry="6" fill="${col("claws")}"/>`));

    // foam / popper head
    if (has("foam") && s.popper) parts.push(glow("foam", `<path d="M${X(0.55)},${Y - 20} L${X(1.0)},${Y - 26} Q${X(1.04)},${Y} ${X(1.0)},${Y + 26} L${X(0.55)},${Y + 20} Z" fill="${col("foam")}" stroke="rgba(0,0,0,.25)"/>`));
    else if (has("foam")) parts.push(glow("foam", `<rect x="${X(0.1)}" y="${Y - th - 8}" width="${L * 0.75}" height="${th + 6}" rx="4" fill="${col("foam")}" stroke="rgba(0,0,0,.25)"/>`));

    // eyes and bead (front)
    if (has("eyes")) {
      const m = txt("eyes");
      const g = /stick|3d|holo|doll|tape/.test(m)
        ? `<circle cx="${X(0.86)}" cy="${Y - 3}" r="7" fill="#f2d33b" stroke="#222"/><circle cx="${X(0.865)}" cy="${Y - 3}" r="3.2" fill="#111"/>`
        : /chain/.test(m)
          ? `<circle cx="${X(0.88)}" cy="${Y - 9}" r="6" fill="${col("eyes")}" stroke="#555"/><circle cx="${X(0.88) + 3}" cy="${Y - 7}" r="5" fill="${col("eyes")}" stroke="#555"/>`
          : `<rect x="${X(0.87) - 3}" y="${Y - 17}" width="6" height="12" fill="#777"/><circle cx="${X(0.87)}" cy="${Y - 19}" r="8.5" fill="${col("eyes")}" stroke="#555"/><circle cx="${X(0.87)}" cy="${Y - 19}" r="4" fill="${/red|yellow/.test(m) ? col("eyes") : "#c0302e"}" opacity=".85"/>`;
      parts.push(glow("eyes", g));
    }
    if (has("head")) {
      const glossy = /resin|cement|varnish|uv|epoxy|coat/.test(txt("head") + " " + String((fly.fly_steps || []).map((x) => x.instruction).join(" ")).toLowerCase());
      const x0 = X(has("bead") ? 0.9 : 0.89), x1 = X(has("bead") ? 0.93 : 0.97);
      parts.push(glow("head", `<path d="M${x0},${Y - th * 0.55} L${x1},${Y - 4} L${x1},${Y + 4} L${x0},${Y + th * 0.55} Z" fill="${col("thread")}"/>` + (glossy ? `<path d="M${x0 + 2},${Y - th * 0.4} L${x1 - 2},${Y - 3}" stroke="#fff" stroke-width="1.5" opacity=".7"/>` : "")));
    }
    if (has("bead")) {
      const c = col("bead");
      parts.push(glow("bead", `<circle cx="${X(0.985)}" cy="${Y}" r="${s.streamer ? 14 : 10}" fill="${c}"/><circle cx="${X(0.985) - 3}" cy="${Y - 4}" r="3" fill="#fff" opacity=".55"/>`));
    }
    if (has("weedguard")) parts.push(glow("weedguard", `<path d="M${X(0.95)},${Y + 4} Q${X(0.55)},${Y + 30} ${xb + 46},${Y + R * 0.6}" stroke="${col("weedguard")}" stroke-width="2" fill="none"/>`));

    // materials tied in but not wrapped yet: hang off the back like on the vise
    ["body", "rib", "hackle", "wingcase"].filter((c) => tied(c) || (c === "rib" && has("rib") && !has("body"))).forEach((c, i) => parts.push(strand(c, i)));

    // Frame the whole finished fly (same framing on every step so it doesn't jump).
    const anyTail = mats.some((m) => /tail|claws|belly/.test(m.comp || "")) || mats.some((m) => m.comp === "wing") && (s.streamer || s.salmon);
    const left = Math.min(xb - R - 14, anyTail ? X(0) - tailLen - 12 : 1e9, mats.some((m) => /body|rib|hackle|wingcase/.test(m.comp || "")) ? X(bodyStart) - 150 : 1e9);
    const right = xe + (mats.some((m) => m.comp === "antennae") ? 70 : 26);
    const top = Y - 84, bottom = Y + 2 * R + 26 + (/(tie|catch) in (the )?(wire|tinsel|chenille|hackle|floss|herl|foam)/i.test((fly.fly_steps || []).map((x) => x.instruction).join(" ")) ? 30 : 0);
    const vw = right - left, vh = bottom - top;
    const label2 = opts.label === false ? "" : `<text x="${f1(right - 8)}" y="${f1(bottom - 8)}" text-anchor="end" font-size="${f1(vw / 52)}" fill="#8b8173" font-family="system-ui,sans-serif">Drawing · not to scale</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(left)} ${top} ${f1(vw)} ${vh}" role="img" aria-label="Drawing of the fly after step ${stepIndex + 1}" class="flydiagram">
<defs><filter id="${uid}h" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="#ffb000" flood-opacity=".95"/></filter>
<linearGradient id="${uid}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9aa0a6"/><stop offset="1" stop-color="#e8e8e8"/></linearGradient></defs>
<rect x="${f1(left)}" y="${top}" width="${f1(vw)}" height="${vh}" rx="${f1(vw / 40)}" fill="#f6f1e6"/>${parts.join("")}${label2}</svg>`;
  }

  const api = { svg, plan, colorOf, compOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FlyDiagram = api;
})(typeof window !== "undefined" ? window : globalThis);
