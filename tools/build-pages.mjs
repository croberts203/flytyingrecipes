// Builds the public, search-engine-friendly recipe pages from the shared recipes in Supabase.
//   node tools/build-pages.mjs            -> fetches live data (publishable key, public rows only)
//   node tools/build-pages.mjs data.json  -> uses a saved copy (for testing)
// Writes: fly/index.html, fly/<slug>/index.html, fish/<slug>/index.html, sitemap.xml, robots.txt
import fs from "node:fs";
import path from "node:path";

const SITE = "https://app.flytyingrecipes.org";
const SUPABASE_URL = "https://rkxzfzzjzrnkiyopbdke.supabase.co";
const SUPABASE_KEY = "sb_publishable_ypQ91HrykMCwgI59OCRFYg_MFGOgzi9";
const FORECAST = "https://fishforecast.net";
const FC_SP = {1:"redfish",2:"trout",3:"flounder",4:"blackdrum",5:"sheepshead",6:"pompano",7:"whiting",8:"snook",9:"tarpon",10:"cobia",11:"jack",13:"spanish",14:"bluefish",15:"bass",16:"bream",17:"redear",18:"bream",19:"crappie",20:"catfish",21:"rainbow",22:"brown",23:"brook",25:"pike",26:"smallmouth",27:"carp",28:"shad",29:"striper",30:"bonefish",31:"permit"};
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = s => String(s || "").replace(/ \(.+\)/, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const short = n => String(n || "").replace(/ \(.+\)/, "");

async function getData() {
  if (process.argv[2]) return JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const q = async (p) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${p}`, { headers: h }); if (!r.ok) throw new Error(`${p}: ${r.status} ${await r.text()}`); return r.json(); };
  const flies = await q("flies?is_public=eq.true&select=id,name,fly_type,water_type,hook_sizes,difficulty,description,fishing_tips,imitates,hatch,youtube_url,photo_url,photo_credit,photo_source_url,photo_license_url,creator_name,creator_url,updated_at,cover_photo_path,is_starter,author_id,fly_materials(part,material_text,sort),fly_steps(step_no,instruction,youtube_url,photo_path),fly_species(species_id)&order=id");
  const species = await q("species?select=id,common_name,scientific_name,water_type,group_name,sort_order&order=sort_order");
  return { flies, species };
}

const ytId = u => { try { const x = new URL(u); if (x.hostname.includes("youtu.be")) return x.pathname.slice(1); return x.searchParams.get("v") || (x.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/) || [])[2] || null; } catch { return null; } };
const storage = p => `${SUPABASE_URL}/storage/v1/object/public/fly-photos/${p.split("/").map(encodeURIComponent).join("/")}`;
function photo(f) {
  if (f.cover_photo_path) return { url: storage(f.cover_photo_path), credit: "" };
  if (f.photo_url) {
    const url = f.photo_url.replace(/width=\d+/, "width=1200");
    if (/^Illustration/i.test(f.photo_credit || "")) return { url, credit: "Illustration by Fly Bench showing the general look of the pattern." };
    const who = esc((f.photo_credit || "").replace(/, (CC .*|public domain)$/i, "")), lic = esc(((f.photo_credit || "").match(/CC [^,]+$/) || ["public domain"])[0]);
    return { url, credit: `Photo: ${f.photo_source_url ? `<a href="${esc(f.photo_source_url)}" rel="noopener">${who}</a>` : who}, ${f.photo_license_url ? `<a href="${esc(f.photo_license_url)}" rel="noopener">${lic}</a>` : lic}, via Wikimedia Commons. Example of the pattern, not tied by Fly Bench.` };
  }
  const id = ytId(f.youtube_url) || ytId((f.fly_steps || []).find(s => s.youtube_url)?.youtube_url);
  if (id) return { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, credit: "Video thumbnail from YouTube." };
  return null;
}

const CSS = `:root{--navy:#182241;--slate:#536c7c;--sea:#7b949c;--cream:#fff5d9;--paper:#f7f3e8;--line:#e3ddcc;--muted:#5b6b78}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--navy);font:16.5px/1.6 "Nunito Sans",system-ui,sans-serif}
a{color:var(--slate)}h1,h2,h3{font-family:Manrope,system-ui,sans-serif;letter-spacing:-.015em;line-height:1.2}
header{background:var(--navy);color:#fff;padding:14px 20px}header .in{max-width:860px;margin:0 auto;display:flex;align-items:center;gap:12px}
header a.brand{color:#fff;text-decoration:none;display:flex;align-items:center;gap:10px;font:800 1.1rem Manrope,sans-serif}header a.brand img{width:34px;height:34px;border-radius:9px}
header .sp{flex:1}header a.open{background:var(--cream);color:var(--navy);text-decoration:none;font-weight:800;padding:8px 16px;border-radius:999px;font-size:.9rem}
main{max-width:860px;margin:0 auto;padding:18px 20px 60px}.crumbs{font-size:.85rem;color:var(--muted);margin-bottom:6px}.crumbs a{color:var(--muted)}
h1{font-size:2.1rem;margin:4px 0 6px}.meta{color:var(--muted);margin:0 0 14px}
.hero{width:100%;height:auto;aspect-ratio:16/9;object-fit:contain;background:#111;border-radius:20px;display:block}.credit{font-size:.8rem;color:var(--muted);margin:6px 0 16px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 16px}.tag{background:var(--cream);color:var(--slate);border-radius:999px;padding:4px 12px;font-weight:700;font-size:.88rem;text-decoration:none}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px 20px;margin:16px 0}.card h2{font-size:1.25rem;margin:0 0 10px}
ul.mats{list-style:none;padding:0;margin:0}ul.mats li{padding:8px 0;border-bottom:1px solid var(--line)}ul.mats li:last-child{border:0}
ol.steps{padding-left:22px;margin:0}ol.steps li{margin:0 0 12px;padding-left:4px}ol.steps img{display:block;max-width:100%;border-radius:12px;margin-top:8px}
.cta{background:var(--navy);color:#fff;border-radius:22px;padding:22px;margin:22px 0;display:flex;gap:18px;align-items:center;flex-wrap:wrap}.cta h2{color:#fff;margin:0 0 4px;font-size:1.25rem}.cta p{margin:0;color:#dfe5ee}
.btn{display:inline-block;background:var(--cream);color:var(--navy);font-weight:800;text-decoration:none;padding:12px 20px;border-radius:999px}.btn.alt{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.5)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:14px 0}.fly{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none;color:var(--navy)}
.fly .pic{aspect-ratio:16/9;background:#1b2440 center/cover no-repeat}.fly .b{padding:10px 14px 14px}.fly h3{margin:0 0 2px;font-size:1.05rem}.fly .m{font-size:.85rem;color:var(--muted)}
.fc{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 16px;text-decoration:none;color:var(--navy);margin:16px 0}.fc b{display:block}.fc span{color:var(--muted);font-size:.9rem}.fc i{margin-left:auto;font-style:normal;font-size:1.6rem;color:var(--sea)}
footer{text-align:center;color:var(--muted);font-size:.85rem;padding:20px}footer a{color:var(--muted)}`;

const shell = ({ title, desc, canon, img, body, ld }) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canon}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}">${img ? `<meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image">` : ""}
<meta name="theme-color" content="#182241"><link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Nunito+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}</style>${(ld || []).map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("")}</head><body>
<header><div class="in"><a class="brand" href="/fly/"><img src="/icon-192.png" alt="">Fly Bench</a><span class="sp"></span><a class="open" href="/">Open the app</a></div></header>
<main>${body}</main>
<footer>Fly Bench by <a href="https://www.flytyingrecipes.org">Fly Tying Recipes</a> · <a href="/fly/">All recipes</a> · <a href="/privacy.html">Privacy</a></footer></body></html>`;

const flyCard = (f) => { const p = photo(f); return `<a class="fly" href="/fly/${f.slug}/"><div class="pic" style="${p ? `background-image:url('${esc(p.url)}')` : ""}"></div><div class="b"><h3>${esc(f.name)}</h3><div class="m">${esc([f.fly_type, f.difficulty].filter(Boolean).join(" · "))}</div></div></a>`; };
const fcLink = sp => FC_SP[sp.id] ? `<a class="fc" href="${FORECAST}/#bite=${FC_SP[sp.id]}"><div><b>Are ${esc(short(sp.common_name).toLowerCase())} biting near you?</b><span>Tides, weather and the best times to fish on Fish Bite Forecast</span></div><i>›</i></a>` : "";
const cta = (f) => `<div class="cta"><div style="flex:1;min-width:220px"><h2>Tie it with Fly Bench</h2><p>Free app: check this recipe against the materials on your bench, follow it step by step at the vise, and log what you catch.</p></div><div><a class="btn" href="/#${f ? `fly=${f.id}` : ""}">${f ? "Open in Fly Bench" : "Open Fly Bench"}</a></div></div>`;

function write(rel, html) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html); }

const { flies, species } = await getData();
const spById = new Map(species.map(s => [s.id, s]));
const used = new Set();
for (const f of flies) { let s = slug(f.name) || `fly-${f.id}`; if (used.has(s)) s += `-${f.id}`; used.add(s); f.slug = s; }
for (const s of species) s.slug = slug(s.common_name);

// clean old generated pages so deleted recipes disappear
for (const d of ["fly", "fish"]) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });

const urls = [`${SITE}/fly/`];
for (const f of flies) {
  const canon = `${SITE}/fly/${f.slug}/`;
  const sp = (f.fly_species || []).map(x => spById.get(x.species_id)).filter(Boolean);
  const mats = [...(f.fly_materials || [])].sort((a, b) => a.sort - b.sort);
  const steps = [...(f.fly_steps || [])].sort((a, b) => a.step_no - b.step_no);
  const p = photo(f);
  const spNames = sp.map(s => short(s.common_name));
  const desc = `${f.name} fly tying recipe: ${mats.length} materials and ${steps.length} steps.${spNames.length ? ` A ${String(f.fly_type || "fly").toLowerCase()} for ${spNames.slice(0, 4).join(", ")}.` : ""} ${f.description || ""}`.slice(0, 300).trim();
  const ld = [{
    "@context": "https://schema.org", "@type": "HowTo", name: `How to tie the ${f.name}`, description: f.description || desc, url: canon,
    ...(p ? { image: p.url } : {}), dateModified: f.updated_at,
    supply: mats.map(m => ({ "@type": "HowToSupply", name: `${m.part ? m.part + ": " : ""}${m.material_text}` })),
    tool: [{ "@type": "HowToTool", name: "Fly tying vise" }, { "@type": "HowToTool", name: "Bobbin" }, { "@type": "HowToTool", name: "Scissors" }],
    step: steps.map(s => ({ "@type": "HowToStep", position: s.step_no, text: s.instruction, url: `${canon}#step-${s.step_no}` })),
    ...(f.creator_name ? { author: { "@type": "Person", name: f.creator_name, ...(f.creator_url ? { url: f.creator_url } : {}) } } : {}),
    publisher: { "@type": "Organization", name: "Fly Tying Recipes", url: "https://www.flytyingrecipes.org" }
  }, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Fly recipes", item: `${SITE}/fly/` },
    { "@type": "ListItem", position: 2, name: f.name, item: canon }] }];
  const yt = f.youtube_url ? `<p><a href="${esc(f.youtube_url)}" rel="noopener">▶ Watch it tied on YouTube</a></p>` : "";
  const body = `<div class="crumbs"><a href="/fly/">Fly recipes</a> › ${esc(f.name)}</div>
<h1>${esc(f.name)}</h1><p class="meta">${esc([f.fly_type, f.difficulty, f.hook_sizes && `Hooks ${f.hook_sizes}`, { salt: "Saltwater", fresh: "Freshwater", both: "Salt and fresh water" }[f.water_type]].filter(Boolean).join(" · "))}${f.creator_name ? ` · Pattern by ${f.creator_url ? `<a href="${esc(f.creator_url)}" rel="noopener">${esc(f.creator_name)}</a>` : esc(f.creator_name)}` : ""}</p>
${p ? `<img class="hero" src="${esc(p.url)}" alt="${esc(f.name)} fly" width="1200" height="675"><p class="credit">${p.credit}</p>` : ""}
${sp.length ? `<div class="tags">${sp.map(s => `<a class="tag" href="/fish/${s.slug}/">${esc(short(s.common_name))}</a>`).join("")}</div>` : ""}
${f.description ? `<p>${esc(f.description)}</p>` : ""}${yt}
${f.imitates || f.hatch ? `<div class="card"><h2>Hatch &amp; entomology</h2>${f.imitates ? `<p style="margin:0 0 6px"><b>Imitates:</b> ${esc(f.imitates)}</p>` : ""}${f.hatch ? `<p style="margin:0"><b>When:</b> ${esc(f.hatch)}</p>` : ""}</div>` : ""}
${f.fishing_tips ? `<div class="card"><h2>How to fish it</h2><p style="margin:0">${esc(f.fishing_tips)}</p></div>` : ""}
<div class="card"><h2>Materials</h2><ul class="mats">${mats.map(m => `<li>${m.part ? `<b>${esc(m.part)}:</b> ` : ""}${esc(m.material_text)}</li>`).join("")}</ul></div>
<div class="card"><h2>Step by step</h2><ol class="steps">${steps.map(s => `<li id="step-${s.step_no}">${esc(s.instruction)}${s.photo_path ? `<img src="${esc(storage(s.photo_path))}" alt="Step ${s.step_no}" loading="lazy">` : ""}${s.youtube_url ? ` <a href="${esc(s.youtube_url)}" rel="noopener">▶ Watch this step</a>` : ""}</li>`).join("")}</ol></div>
${cta(f)}${sp[0] ? fcLink(sp[0]) : ""}`;
  write(`fly/${f.slug}/index.html`, shell({ title: `${f.name} Fly Tying Recipe: Materials and Steps | Fly Bench`, desc, canon, img: p?.url, body, ld }));
  urls.push(canon);
}

// species pages
const bySp = new Map();
for (const f of flies) for (const x of f.fly_species || []) { if (!bySp.has(x.species_id)) bySp.set(x.species_id, []); bySp.get(x.species_id).push(f); }
for (const s of species) {
  const list = bySp.get(s.id); if (!list?.length) continue;
  const canon = `${SITE}/fish/${s.slug}/`, n = short(s.common_name);
  const body = `<div class="crumbs"><a href="/fly/">Fly recipes</a> › ${esc(n)}</div><h1>Flies for ${esc(n)}</h1>
<p class="meta">${list.length} fly tying ${list.length === 1 ? "recipe" : "recipes"} for ${esc(s.common_name)}${s.scientific_name ? ` (<i>${esc(s.scientific_name)}</i>)` : ""}, each with a materials list and step-by-step instructions.</p>
${fcLink(s)}<div class="grid">${list.map(flyCard).join("")}</div>${cta(null)}`;
  write(`fish/${s.slug}/index.html`, shell({ title: `Best Flies for ${n}: ${list.length} Fly Tying Recipes | Fly Bench`, desc: `Fly tying recipes for ${n}: ${list.slice(0, 5).map(f => f.name).join(", ")}${list.length > 5 ? " and more" : ""}. Materials lists and step-by-step instructions.`, canon, img: photo(list[0])?.url, body,
    ld: [{ "@context": "https://schema.org", "@type": "ItemList", name: `Flies for ${n}`, itemListElement: list.map((f, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/fly/${f.slug}/`, name: f.name })) }] }));
  urls.push(canon);
}

// index
const salt = flies.filter(f => f.water_type !== "fresh"), fresh = flies.filter(f => f.water_type !== "salt");
const spLinks = species.filter(s => bySp.get(s.id)?.length).map(s => `<a class="tag" href="/fish/${s.slug}/">${esc(short(s.common_name))}</a>`).join("");
write("fly/index.html", shell({ title: "Fly Tying Recipes by Species: Materials and Step-by-Step | Fly Bench", desc: `${flies.length} free fly tying recipes sorted by the fish they catch: redfish, seatrout, snook, tarpon, bass, bream and more. Each has a materials list and step-by-step instructions.`, canon: `${SITE}/fly/`, img: `${SITE}/img/flies/merkin-crab.jpg`,
  body: `<h1>Fly tying recipes</h1><p class="meta">${flies.length} free recipes with materials lists and step-by-step instructions, sorted by the fish they catch.</p>
<h2 style="font-size:1.1rem">Browse by fish</h2><div class="tags">${spLinks}</div>
<h2>Saltwater flies</h2><div class="grid">${salt.map(flyCard).join("")}</div><h2>Freshwater flies</h2><div class="grid">${fresh.map(flyCard).join("")}</div>${cta(null)}`,
  ld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Fly tying recipes", url: `${SITE}/fly/` }] }));

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[`${SITE}/`, ...urls].map(u => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /mobile/\nDisallow: /tools/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${flies.length} recipe pages, ${urls.length - flies.length - 1} species pages.`);
