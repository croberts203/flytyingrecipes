# Fly Bench — flytyingrecipes.org

Fly tying recipes sorted by fish species, a materials inventory with phone barcode scanning,
and a fish log with GPS, photo species ID and Florida (FWC) regulations.

- Static site for GitHub Pages; single `index.html`, no build step.
- Backend: Supabase (database, sign-in, photo storage, and the `species-id` / `receipt-read` edge functions).
- Photo species ID and receipt reading need an `ANTHROPIC_API_KEY` secret in Supabase Edge Functions.
- Regulations summary checked 2026-11-19 against MyFWC.com; always confirm there before keeping a fish.
