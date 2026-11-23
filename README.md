# Fly Bench — app.flytyingrecipes.org

Fly tying recipes sorted by fish species, a materials inventory with phone barcode scanning,
and a fish log with GPS, photo species ID and Florida (FWC) regulations.

- Static site for GitHub Pages; single `index.html`, no build step.
- **Scan with phone:** on a computer, Inventory → 📱 Scan with phone shows a QR code. A phone signed in to the same account
  sends each barcode it scans to the computer over a private Supabase Realtime channel (`fbscan:<user id>`, limited to that
  user's devices by policies on `realtime.messages`). The computer looks each code up, adds known items (or holds them in a
  review list), shows a form for new ones, and answers the phone with what it found. USB/Bluetooth barcode scanners work in the same panel.
- Backend: Supabase (database, sign-in, photo storage, and the `species-id` / `receipt-read` edge functions).
- Photo species ID and receipt reading need an `ANTHROPIC_API_KEY` secret in Supabase Edge Functions.
- Regulations summary checked 2026-11-19 against MyFWC.com; always confirm there before keeping a fish.
