# Youth Alpha 🎄

Kids' points, attendance and leaderboard app for the Youth Alpha Christmas programme.
Free to run: GitHub Pages (website) + Supabase free tier (database + adult logins).

## Kids
Open the link → tap your name → see your points and rank. No login. Money is never shown.
Tip: "Add to Home Screen" makes it look like a real app.

## Adults
Tap "For adults" at the bottom of the name list → log in.
- **Attendance**: one tap per kid (Here / Leave / Absent). Tap again to undo. "Here" gives points automatically (set in Team → Settings).
- **Points**: pick skill → pick points → tap kids → Give.
- **Money**: tap a kid → add "earned" or "paid". Owed = earned − paid.
- **Kids**: add / edit / hide / delete. Copy the link for kids here.
- **Team** (Admin only): approve new adult accounts, settings.

## Setup (once)
1. Supabase → New project → SQL Editor → paste `supabase/schema.sql` → Run.
2. Supabase → Project Settings → API → copy Project URL + anon public key into `config.js`.
3. Supabase → Authentication → URL Configuration → Site URL = your GitHub Pages link.
4. GitHub → new public repo → upload all files → Settings → Pages → Deploy from branch `main` / root.
5. Open the site → For adults → Create account → log in → "I'm the first admin".

Leave `config.js` empty to try it in Preview mode (data stays on that device only).

Music: "Jingle Bells" (1857, public domain melody), synthesized in the browser — no audio files.
