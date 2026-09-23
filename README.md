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

## Set up Supabase (one-time)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In the Supabase dashboard, go to **SQL Editor → New query**, paste the
   entire contents of `supabase/schema.sql`, and run it. This creates the
   `reservations` table plus every function the app calls.
3. Go to **Settings → API** and copy the **Project URL** and the
   **anon public** key.

## Run locally

```bash
npm install
cp .env.example .env.local   # then paste in your Supabase URL + anon key
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel   # if you don't have it
vercel
```

Framework preset: **Vite**. In the Vercel project's **Settings →
Environment Variables**, add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` with the same values from `.env.local` (add them
for Production, Preview, and Development), then redeploy.

`vercel.json` is already set up to rewrite all routes to `index.html` so
`/pass/:id`, `/scan`, and `/admin` work on refresh.

The camera scanner requires **HTTPS** (or `localhost`) to get camera
permission — Vercel serves HTTPS by default, so this only matters for local
network testing on a phone.

## How the database is protected

The Supabase **anon key is public** — it ships inside the JS bundle, so
anyone can read it from the browser. To keep that safe, `reservations` has
Row Level Security turned on with **zero policies** — meaning the anon key
cannot `SELECT`/`INSERT`/`UPDATE` the table directly, full stop. Instead,
every operation goes through a `SECURITY DEFINER` Postgres function
(`create_reservation`, `check_in_reservation`, etc., all in
`supabase/schema.sql`) that does exactly one specific, safe thing — e.g.
`check_in_reservation` will only ever flip a *matching* id+token pair from
`pending` to `checked-in`, nothing else. Read `supabase/schema.sql` — it's
short and every function is commented.

## Before you launch this for real

- **`/scan` and `/admin` have no login.** Anyone with the URL can view
  today's applicant names/phone numbers and check people in. For a real
  deployment, add Supabase Auth (email/password or magic link) and gate
  those two routes behind a signed-in staff session — this is the next
  thing I'd build.
- **Real off-device notifications.** The current notification is
  browser-only (fires on the scanning device, not the applicant's phone).
  For an actual SMS/email to the applicant, add a Vercel serverless
  function (`/api/notify`) calling a provider like Resend (email) or
  Semaphore/Twilio (SMS, since this is PH-focused) — `src/utils/notify.js`
  already has the hook point for this.
- **Realtime instead of polling.** `/pass/:id` and `/admin` currently poll
  every few seconds. Supabase supports realtime subscriptions on table
  changes, which would make check-ins show up instantly and cut down on
  requests — a natural upgrade once you're comfortable with the schema.
- **Slot capacity limits**, so a time slot stops accepting bookings once
  it's full — right now any number of people can book the same slot.
- **Cancel / reschedule** flow for applicants, and a way to look up an
  existing pass by phone number if they lose the QR.
- **Printable pass fallback** for applicants without a smartphone (a
  printed queue slip with the same QR).

Happy to build out Supabase Auth for the staff pages next — that's the
one I'd prioritize given names and phone numbers are now shared across
every visitor to `/admin`.
