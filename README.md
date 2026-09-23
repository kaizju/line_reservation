# ID Reserve

Online reservation & queueing app for valid‑ID applications (barangay ID,
voter's ID, postal ID, PhilSys, student ID, etc.). Built with Vite + React +
JavaScript, linted with ESLint, deployable to Vercel as-is.

## What it does

1. **Reservation form** — applicant fills in name, contact info, ID type,
   purpose, and a preferred date/time slot.
2. **QR pass** — on submit, they get a queue number and a QR code encoding
   that number plus a check token.
3. **Camera scanner** — staff open `/scan`, allow camera access, and point it
   at an applicant's pass to check them in.
4. **Confirmation notification** — on a successful scan, a browser
   notification fires on the scanning device and an in-app toast confirms
   the check-in.
5. **Queue list** (`/admin`) — a live list of today's reservations with
   status, so staff can call the next number and mark people done.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel
```

Framework preset: **Vite**. `vercel.json` is already set up to rewrite all
routes to `index.html` so `/pass/:id`, `/scan`, and `/admin` work on refresh.

The camera scanner requires **HTTPS** (or `localhost`) to get camera
permission — Vercel serves HTTPS by default, so this only matters for local
network testing on a phone.

## Current data model (important limitation)

Reservations are stored in the **browser's localStorage**, not a shared
database. That means:
- A pass created on the applicant's phone can only be verified by a scanner
  running in the *same browser* (or you rely on the QR payload itself,
  which this app does — the scanner reads and verifies the QR content
  directly, it doesn't need to "already know" the reservation).
- The `/admin` queue list only shows reservations created *on that device*.

This is fine for a single front-desk kiosk setup, but for a real multi-user
deployment you'll want a shared backend — see below.

## What I'd suggest adding next

- **A real backend** (Vercel Postgres/Neon, Supabase, or Firebase) so the
  reservation form, scanner, and admin list all read/write the same data
  instead of per-device localStorage. This is the single highest-impact
  change — everything else builds on it.
- **A signed QR token.** Right now the token is a simple checksum so a
  scanner can sanity-check a pass offline. Once you have a backend, sign
  the token server-side (HMAC or JWT) so it can't be forged, and verify it
  against the database on scan instead of trusting the QR payload alone.
- **Real off-device notifications.** The current notification is
  browser-only (fires on the scanning device, not the applicant's phone).
  For an actual SMS/email to the applicant, add a Vercel serverless
  function (`/api/notify`) calling a provider like Resend (email) or
  Semaphore/Twilio (SMS, since this is PH-focused) — `src/utils/notify.js`
  already has the hook point for this.
- **Slot capacity limits**, so a time slot stops accepting bookings once
  it's full — right now any number of people can book the same slot.
- **Admin authentication** for `/scan` and `/admin` — right now anyone with
  the link can access them.
- **Cancel / reschedule** flow for applicants, and a way to look up an
  existing pass by phone number if they lose the QR.
- **Offline queue for scans** — if you expect spotty connectivity at the
  venue, queue scan results locally and sync when back online.
- **Printable pass fallback** for applicants without a smartphone (a
  printed queue slip with the same QR).

Happy to build out any of these — the backend swap and the signed-token
change are the two I'd prioritize first since the notification and
multi-device features both depend on them.
