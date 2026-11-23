// Demo mode (app.flytyingrecipes.org/?demo): a signed-in look at Fly Bench with a sample bench and fish log,
// for screenshots and store listings. Recipes, species and rules come from the real database (read-only).
// Nothing is ever saved: every write in demo mode is ignored.
const now = Date.now(), day = 864e5;
const iso = d => new Date(now - d * day).toISOString();
const M = (id, name, category, color, brand) => ({ id: 90000 + id, name, category, color: color || null, brand: brand || null, size: null });
const mats = [
  M(1, "Saltwater stainless hook SC15", "hook", null, "Gamakatsu"), M(2, "Streamer hook 3XL", "hook", null, "Umpqua"),
  M(3, "Flat-waxed nylon thread", "thread", "white", "Danville"), M(4, "6/0 thread", "thread", "olive", "UTC"),
  M(5, "Dumbbell eyes", "eyes", "red", "Hareline"), M(6, "Bucktail", "hair", "white", "Hareline"),
  M(7, "Bucktail", "hair", "chartreuse", "Hareline"), M(8, "Krystal Flash", "flash", "pearl", "Hedron"),
  M(9, "UV resin", "glue", null, "Solarez"), M(10, "Marabou", "feather", "olive", "Hareline"),
  M(11, "Medium chenille", "body", "olive", "Danville"), M(12, "Saddle hackle", "feather", "grizzly", "Whiting"),
  M(13, "Fine wire", "wire", "copper", "UTC"), M(14, "EP Fibers", "synthetic", "tan", "Enrico Puglisi")
];
const qty = { 1: 25, 2: 12, 3: 2, 4: 1, 5: 30, 6: 1, 7: 0, 8: 1, 9: 1, 10: 2, 11: 1, 12: 3, 13: 1, 14: 0 };
const tables = {
  profiles: [{ id: "demo", display_name: "Demo Angler", is_admin: false }],
  inventory: mats.map((m, i) => ({ id: 80000 + i, user_id: "demo", material_id: m.id, quantity: qty[m.id - 90000], unit: "pack",
    low_stock_at: [3, 7, 14].includes(m.id - 90000) ? 2 : 0, storage_location: i < 5 ? "Bench drawer" : "Tying box", notes: null, updated_at: iso(i), photo_path: null, material: m })),
  catches: [
    { id: 70001, caught_at: iso(2), lat: 30.3949, lng: -81.4326, location_name: "Mayport flats", species_id: 1, species_confirmed: true, length_in: 24, weight_lb: 6.2, fly_id: 4, kept: false, notes: "Tailing on the incoming tide.", region_code: "US-FL", region_name: "Florida", country_code: "US" },
    { id: 70002, caught_at: iso(5), lat: 30.2669, lng: -81.3963, location_name: "Intracoastal, Palm Valley", species_id: 2, species_confirmed: true, length_in: 18, weight_lb: 2.1, fly_id: 1, kept: false, notes: null, region_code: "US-FL", region_name: "Florida", country_code: "US" },
    { id: 70003, caught_at: iso(9), lat: 30.3322, lng: -81.6557, location_name: "St. Johns River docks", species_id: 8, species_confirmed: true, length_in: 27, weight_lb: 5.5, fly_id: 2, kept: false, notes: "Dock lights after dark.", region_code: "US-FL", region_name: "Florida", country_code: "US" },
    { id: 70004, caught_at: iso(14), lat: 30.1898, lng: -81.7432, location_name: "Neighborhood pond", species_id: 16, species_confirmed: true, length_in: 8, weight_lb: 0.5, fly_id: 11, kept: false, notes: null, region_code: "US-FL", region_name: "Florida", country_code: "US" },
    { id: 70005, caught_at: iso(21), lat: 30.1898, lng: -81.7432, location_name: "Neighborhood pond", species_id: 15, species_confirmed: true, length_in: 16, weight_lb: 2.4, fly_id: 12, kept: false, notes: null, region_code: "US-FL", region_name: "Florida", country_code: "US" }
  ].map(c => ({ user_id: "demo", species_other: null, ai_guess: null, ai_confidence: null, photo_path: null, created_at: c.caught_at, ...c })),
  hidden_authors: [], ai_usage: [], inventory_events: []
};
const LOCAL = new Set(Object.keys(tables));

function local(table) {
  const st = { op: "select", filters: [] }, rows = () => {
    let r = tables[table] || [];
    for (const [k, v] of st.filters) r = r.filter(x => String(x[k]) === String(v));
    return r;
  };
  const done = d => Promise.resolve({ data: d, error: null, count: Array.isArray(d) ? d.length : 0 });
  const b = {
    select() { return b; }, order() { return b; }, limit() { return b; }, in() { return b; }, ilike() { return b; }, or() { return b; }, gt() { return b; },
    eq(k, v) { st.filters.push([k, v]); return b; },
    insert() { st.op = "write"; return b; }, update() { st.op = "write"; return b; }, upsert() { st.op = "write"; return b; }, delete() { st.op = "write"; return b; },
    single() { return done(st.op === "write" ? { id: Date.now() } : rows()[0] || null); },
    maybeSingle() { return done(st.op === "write" ? null : rows()[0] || null); },
    then(res, rej) { return done(st.op === "write" ? null : rows()).then(res, rej); }
  };
  return b;
}
// Shared data (recipes, species, rules, materials) is read from the real database; every write is a no-op.
function readOnly(real, t) {
  const noop = () => local("_none").insert();
  return { select: (...a) => real.from(t).select(...a), insert: noop, update: noop, upsert: noop, delete: noop };
}

export function demoClient(real) {
  const user = { id: "demo", email: "demo@flytyingrecipes.org", user_metadata: { display_name: "Demo Angler" } };
  return {
    from: t => LOCAL.has(t) ? local(t) : readOnly(real, t),
    rpc: async n => ({ data: n === "my_newsletter" ? true : n === "adjust_inventory" ? 1 : null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: { user } } }),
      getUser: async () => ({ data: { user } }),
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => { location.href = location.pathname; },
      signInWithPassword: async () => ({ error: { message: "Demo mode: sign in on the regular app." } }),
      signUp: async () => ({ error: { message: "Demo mode: sign up on the regular app." } }),
      resetPasswordForEmail: async () => ({ error: null })
    },
    storage: { from: bucket => ({
      getPublicUrl: p => real.storage.from(bucket).getPublicUrl(p),
      createSignedUrls: async () => ({ data: [] }),
      upload: async () => ({ error: null }), remove: async () => ({ error: null })
    }) },
    functions: real.functions
  };
}
