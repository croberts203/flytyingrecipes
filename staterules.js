/* Fly Bench – fishing rules for where you are.
   Shared by the app (index.html) and the website (through fishtails.js).
   window.FBRules.locate() asks the device for its GPS position, turns a rounded (~1 km) copy of it
   into a state/province with BigDataCloud's free client-side lookup, and returns links to that
   place's official fishing rules. Nothing is stored here. */
(function () {
  if (window.FBRules) return;
  /* Every state + DC. Coastal states: NOAA Fisheries' list of state recreational fishing websites. */
  var SITES = {
    "US-AK": "https://www.adfg.alaska.gov/index.cfm?adfg=fishingSport.main", "US-AL": "https://www.outdooralabama.com/fishing",
    "US-CA": "https://www.wildlife.ca.gov/Fishing", "US-CT": "https://portal.ct.gov/deep/fishing/regulations/fishing-regulations",
    "US-DE": "https://dnrec.alpha.delaware.gov/fish-wildlife/licenses/", "US-FL": "https://myfwc.com/fishing/",
    "US-GA": "https://coastalgadnr.org/RecreationalFishing", "US-HI": "https://dlnr.hawaii.gov/dar/fishing/",
    "US-ID": "https://idfg.idaho.gov/fish", "US-LA": "https://www.wlf.louisiana.gov/fishing/recreational-fishing",
    "US-MA": "https://www.mass.gov/eea/agencies/dfg/dmf/recreational-fishing/", "US-MD": "https://dnr.maryland.gov/Fisheries/Pages/default.aspx",
    "US-ME": "https://www.maine.gov/IFW/fishing-boating/fishing/laws-rules/index.html", "US-MS": "https://www.dmr.ms.gov/recreational-fishing",
    "US-NC": "https://deq.nc.gov/about/divisions/marine-fisheries", "US-NH": "https://www.wildlife.nh.gov/saltwater-fisheries-new-hampshire/recreational-saltwater-fishing",
    "US-NY": "https://www.dec.ny.gov/outdoor/fishing.html", "US-OR": "https://myodfw.com/fishing", "US-PA": "https://www.fishandboat.com/Pages/default.aspx",
    "US-SC": "https://www.dnr.sc.gov/fishing.html", "US-TX": "https://tpwd.texas.gov/regulations/outdoor-annual/fishing/fishing",
    "US-WA": "https://wdfw.wa.gov/fishing/", "US-WV": "https://wvdnr.gov/2025-fishing-regulations-guide",
    /* Inland states: the official fish & wildlife agency home page */
    "US-AR": "https://www.agfc.com/", "US-CO": "https://cpw.state.co.us/", "US-DC": "https://doee.dc.gov/",
    "US-IL": "https://www.ifishillinois.org/", "US-IN": "https://www.in.gov/dnr/fish-and-wildlife/", "US-IA": "https://www.iowadnr.gov/",
    "US-KS": "https://ksoutdoors.com/", "US-KY": "https://fw.ky.gov/", "US-MI": "https://www.michigan.gov/dnr", "US-MN": "https://www.dnr.state.mn.us/fishing/index.html",
    "US-MO": "https://mdc.mo.gov/fishing", "US-MT": "https://fwp.mt.gov/", "US-NV": "https://www.ndow.org/",
    "US-NJ": "https://dep.nj.gov/njfw/", "US-NM": "https://wildlife.dgf.nm.gov/", "US-ND": "https://gf.nd.gov/", "US-OH": "https://ohiodnr.gov/",
    "US-OK": "https://www.wildlifedepartment.com/", "US-RI": "https://dem.ri.gov/", "US-SD": "https://gfp.sd.gov/", "US-TN": "https://www.tn.gov/twra.html",
    "US-UT": "https://wildlife.utah.gov/", "US-VT": "https://vtfishandwildlife.com/", "US-VA": "https://dwr.virginia.gov/", "US-WI": "https://dnr.wisconsin.gov/topic/Fishing",
    "US-WY": "https://wgfd.wyo.gov/"
  };
  /* Second official link for states where fresh and salt water are run by different agencies */
  var EXTRA = {
    "US-GA": { label: "Georgia freshwater fishing (Wildlife Resources)", url: "https://georgiawildlife.com/" },
    "US-NC": { label: "NC Wildlife (inland fishing)", url: "https://www.ncwildlife.org/" },
    "US-MS": { label: "Mississippi Wildlife, Fisheries & Parks (freshwater)", url: "https://www.mdwfp.com/" },
    "US-VA": { label: "Virginia Marine Resources (saltwater)", url: "https://mrc.virginia.gov/" },
    "US-MA": { label: "Massachusetts freshwater fishing (MassWildlife)", url: "https://www.mass.gov/orgs/masswildlife" },
    "US-ME": { label: "Maine saltwater fishing (Marine Resources)", url: "https://www.maine.gov/dmr/" },
    "US-NH": { label: "New Hampshire Fish and Game (freshwater)", url: "https://www.wildlife.nh.gov/" },
    "US-NJ": { label: "NJ Fish & Wildlife (marine and freshwater)", url: "https://dep.nj.gov/njfw/" }
  };
  var NOAA = "https://www.fisheries.noaa.gov/recreational-fishing/state-recreational-fishing-websites";

  function lookup(lat, lng) {
    var u = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat.toFixed(2) + "&longitude=" + lng.toFixed(2) + "&localityLanguage=en";
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { ctl && ctl.abort(); }, 8000);
    return fetch(u, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.lookupSource !== "reverseGeocoding" || !d.principalSubdivision) return null;
      return { region_code: (d.principalSubdivisionCode || "").slice(0, 10) || null, region_name: String(d.principalSubdivision).slice(0, 80),
               country_code: (d.countryCode || "").slice(0, 3) || null, country_name: d.countryName || "" };
    }).catch(function () { return null; }).then(function (r) { clearTimeout(t); return r; });
  }
  function position() {
    return new Promise(function (ok, no) {
      if (!navigator.geolocation) return no(new Error("This device can't share its location."));
      navigator.geolocation.getCurrentPosition(function (p) { ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); },
        function () { no(new Error("Location is off. Allow location access for this site and try again.")); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
    });
  }
  function locate() { return position().then(function (p) { return lookup(p.lat, p.lng).then(function (r) { p.region = r; return p; }); }); }

  /* The links for a region: [{label, url, primary}] */
  var WARN_ONLY = { "US-AZ": "Arizona Game and Fish Department", "US-NE": "Nebraska Game and Parks Commission" };
  function links(r) {
    if (!r || !r.region_name) return [{ label: "State fishing websites (NOAA)", url: NOAA, primary: true }];
    if (WARN_ONLY[r.region_code]) return [];
    var isUS = (r.country_code || "").toUpperCase() === "US", out = [];
    if (r.region_code === "US-FL") {
      out.push({ label: "FWC saltwater rules", url: "https://myfwc.com/fishing/saltwater/recreational/", primary: true });
      out.push({ label: "FWC freshwater rules", url: "https://myfwc.com/fishing/freshwater/regulations/", primary: true });
    } else if (SITES[r.region_code]) out.push({ label: "Official " + r.region_name + " fishing site", url: SITES[r.region_code], primary: true });
    if (EXTRA[r.region_code] && EXTRA[r.region_code].url !== SITES[r.region_code]) out.push({ label: EXTRA[r.region_code].label, url: EXTRA[r.region_code].url, primary: true });
    var q = encodeURIComponent(r.region_name + " fishing regulations official") + (isUS ? "+site%3A.gov" : "");
    out.push({ label: out.length ? "Search current rules" : "Find " + r.region_name + " fishing rules", url: "https://www.google.com/search?q=" + q, primary: !out.length });
    return out;
  }
  /* A caution when there is no checked official link for the place (Arizona, Nebraska, outside the US…) */
  function warning(r) {
    if (!r || !r.region_name) return "";
    if (WARN_ONLY[r.region_code]) return "We can't link " + r.region_name + "'s fishing rules right now. Check the " + WARN_ONLY[r.region_code] + " for current rules before you keep a fish.";
    if (r.region_code === "US-FL" || SITES[r.region_code]) return "";
    return "We don't have a checked official link for " + r.region_name + " yet. Use the search, and make sure the page you land on belongs to the official state or government fishing agency before you rely on it.";
  }
  function placeName(r) { return !r ? "" : r.region_name + ((r.country_code || "").toUpperCase() !== "US" && r.country_name ? ", " + r.country_name : ""); }
  window.FBRules = { SITES: SITES, NOAA: NOAA, lookup: lookup, position: position, locate: locate, links: links, warning: warning, placeName: placeName };
})();
