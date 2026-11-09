# FitCheck

A second opinion on your outfit before you head out. Snap a photo, pick the occasion (date, interview, work, casual, formal event or your own), and get honest, specific feedback on fit, colour and whether it suits where you're going. It's the "does this look okay?" text you'd send a friend, answered at 7am when nobody else is up.

No account needed to check an outfit. Sign in with Google only if you want to save checks to a private history.

## What it does

- **Snap or upload.** Take a photo on your phone or pick one from your camera roll (drag and drop on desktop). The photo is shrunk to about 1568px in the browser, which also strips location data, before anything is sent.
- **Pick the occasion.** Six chips plus an optional detail line ("rooftop bar, humid", "bank, client facing"). "Other" asks where you're going.
- **Get the verdict.** A 1 to 5 rating with a plain word ("Solid", "Looking good"), a one line bottom line written like a text back, what works (green), what to change ranked by impact and tagged fit, colour, shoes and so on (amber), a note on whether it suits the occasion, and anything Claude couldn't see (shoes out of frame, dark photo).
- **Occasion tips.** Two or three dress code notes for that kind of occasion, for next time.
- **History.** Signed in, tap "Save to history" and the check is kept with its photo. Delete one check or everything at any time. If you weren't signed in when you got a result you liked, "Sign in to save" carries it through the Google sign in so it isn't lost.

## Stack

Next.js 14 (App Router, installable PWA), TypeScript strict, Tailwind, Supabase (Postgres with RLS, Google auth, private storage), Claude vision via the Anthropic SDK, Vitest.

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in the keys
npm run dev
```

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor. It creates the tables, the policies and the private `outfit-photos` bucket.
2. Turn on the Google provider under Authentication and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect list.
3. Add your `ANTHROPIC_API_KEY`. `CLAUDE_MODEL` is optional and defaults to `claude-sonnet-5-5`.

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Plans and limits

The spec's free tier is 5 checks a month, with Pro (US$4 a month) adding unlimited checks, history and occasion tips. Billing isn't wired up yet, so those limits only switch on with `ENFORCE_PRO=true`. Until then everyone gets everything.

Some ceilings are always on, because anyone can use this without an account and every check is a paid vision call: 10 checks a day per anonymous browser, 30 a day per network for people who aren't signed in, and 40 a day for signed in people. A check that fails, or a photo with no outfit in it, doesn't count.

## Where I went beyond or away from the spec

- **Anonymous checks are never stored.** The spec's policy `user_id = auth.uid() or user_id is null` would let any visitor read and delete every anonymous check. Instead the photo goes to Claude and back and nothing is kept. Only signed in people who tap save get a row, `user_id` is required and every policy is owner only.
- **Usage ledger.** To count the free checks without accounts, `check_usage` stores a random id from an httpOnly cookie and a salted hash of the IP (never the IP itself). It has RLS on and no policies, so only the server's service role key can touch it.
- **Structured output.** The spec parses Claude's reply with `JSON.parse`, which breaks the first time the model adds a sentence. This uses a forced tool call with a schema, then a parser that clamps the rating, dedupes and caps the lists and falls back sensibly. The same parser re-checks feedback when it's saved.
- **Feedback rules.** The prompt calibrates the rating (most everyday outfits land on 3 or 4), talks about the clothes and never the body, makes no shopping suggestions or brand mentions (per "what not to build"), only suggests fixes you can do with what you own, and treats the occasion text as a description rather than instructions.
- **Model.** Defaults to `claude-sonnet-5-5` rather than the spec's `claude-sonnet-4-6`, and can be changed with `CLAUDE_MODEL`.
- **Schema.** Added `feedback jsonb` (the full result for the history page), `occasion_detail`, a `profiles` table for the plan (no client write policies, so nobody can upgrade themselves), and a `/history/[id]` page.

## Project layout

```
app/(app)/page.tsx             check screen
app/(app)/history/             saved checks and a single check
app/api/check/route.ts         POST, Claude vision feedback, quotas
app/api/checks/                save, delete one, delete all
components/check/              PhotoCapture, OccasionPicker, FeedbackResult, CheckFlow
lib/claude/outfit-checker.ts   prompt, tool schema and parser
lib/plan.ts, lib/usage.ts      limits and the usage ledger
lib/photos/                    resize, upload, validation
supabase/migrations/           schema, RLS and storage
scripts/make-icons.mjs         draws the PWA icons
```
