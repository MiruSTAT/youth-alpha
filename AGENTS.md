# Rules for any AI (or person) changing this app

Read `HANDOFF.md` first. It is the full description of the app, the owner's rules and the agreed plan.
The super admin page shows this same file to the owner as "Details for AI", so it must always be current.

## Every change you publish must also do all of this

1. **Version.** Raise the number in all three places together: `VERSION` in `js/version.js`, every `?v=`
   (index.html and every js import), and `V` in `sw.js`. New js files also go into `FILES` in `sw.js`.
2. **Change log** (`js/version.js` → `UPDATES`). Add the new version at the top of the newest update group
   (or start a new group). One item per change, in Thai **and** English, with an area
   (`kids | admin | songs | data | look | speed | safety | fix`). Say what changed, where it is in the app,
   and what it means for an admin. Give numbers when you measured something. Never edit or delete old items.
   Fill in the previous version's `commit` id.
3. **HANDOFF.md.** Update every section your change touches, in detail:
   - section 4 (files, routes, localStorage keys), 5 (tables, views, functions, security rules),
     6–9 (features as the kids and the admins see them), 10 (how to release), 12 (gotchas you hit),
     13 (one history line for the version), 14 (plan and open items);
   - change the line "**The current version is `N`.**" to the new number. The super admin page compares
     it with the app's version and shows "Not updated" when they differ;
   - write for an AI that has never seen this chat: file names, function names, table and column names,
     what you decided and why, what you did not do and why, and what is still untested.
4. **Database changes** go in a new numbered file `supabase/0NN_name.sql` that is safe to re-run. Never put
   the owner's email, passwords or other private details in the repository (it is public).
5. **Test** in a preview copy (see `tests/README.md`), add or update a test script in `tests/`, check
   screenshots, then check the live site after publishing.
6. **Owner's Desktop folder:** copy the repo (without `.git`) and `HANDOFF.md` to
   `C:\Users\USER\Desktop\Youth Alpha\` on the owner's PC when the Claude desktop app is connected
   (HANDOFF.md section 10b).
7. **Tell the owner** in a few plain sentences what changed and what to check.

## The owner's standing rules (details in HANDOFF.md section 2)
- For a big change: give a short summary of what you will do and wait for "go".
- Simple, calm UI with big readable Thai text; no pop-up messages for kids.
- A clear warning that names the item before every delete. Feedback can never be deleted.
  The admin change log is permanent. Never delete existing data.
- Kids see only nickname, avatar and points.
- Don't type out copyrighted lyrics; admins paste or scan their own song sheets.
