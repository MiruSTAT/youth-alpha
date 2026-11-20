---
target: the entire app
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/claude/youth-alpha/index.html"
target_fingerprint: "sha256:08d5c2dddc23b550e2bde1c7c9a5069d3c590329a1edd69af927b7543e07d7e3"
target_path: /home/claude/youth-alpha/index.html
timestamp: 2026-11-20T12-08-44Z
slug: index-html
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

# Youth Alpha v44 — whole-app critique (kids side, admin, super admin; kids + normal mode; 390 / 768 / 1366 px)

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Live attendance counters and toasts are good; history rows have no date/time; "program created" toast doesn't show the new card |
| 2 | Match system / real world | 3 | Natural Thai; two point currencies on redeem; slug / super-admin-expiry lines read like system talk |
| 3 | User control and freedom | 2 | Back while the Edit kid box is open leaves the Kids page; no undo after giving points except a red ลบ in history |
| 4 | Consistency and standards | 2 | Normal mode keeps the cartoon shop + "☰"; 11/20/2026 picker beside the Thai date; kid key badge stacked vs admin inline |
| 5 | Error prevention | 3 | Named confirms everywhere; but every history row has a red ลบ with no date, and deleting a kid doesn't suggest ซ่อน |
| 6 | Recognition rather than recall | 3 | Give points carries earlier choices; history without dates forces recall |
| 7 | Flexibility and efficiency | 3 | Bulk "ทุกคนที่รอเช็กมา", multi-select, settings search; no history search/filter, no keyboard shortcuts on PC |
| 8 | Aesthetic and minimalist design | 3 | Kid side calm; Look page ~62 controls in one scroll; Programs cards 5 actions each |
| 9 | Error recovery | 2 | Thai program name → empty link name → native browser bubble; slug errors close the box and lose the typing |
| 10 | Help and documentation | 3 | Good hints + new ⓘ; ลา vs ขาด, closing a round with unchecked kids, and "how do I get my prize" unexplained |
| **Total** | | **27/40** | **Acceptable (one point under Good)** |

v43 scored 29. The drop is stricter scoring of 4 and 9 plus new areas reviewed (history, Programs create), not a regression; v44's own changes (rows, chips, home status, redeem ⓘ, widths) all held up.

## Design specificity
LLM: authored for this product, especially the kids' side (tree scene + leaderboard sheet, cartoon shop stall, kid-voice Thai, มา/ลา/ขาด door flow). Admin is closer to a generic clean panel. Normal mode is only half-authored (cartoon shop, emoji prizes, "☰", Thai initials split mid-syllable: "แบ", "น้").
Detector: CLI exit 2, 5 findings, all from css/style.css: pulsing-dot (.dot, :510), dark-glow (.menu a.alert, :506), radial-halo (.cutscene .flash, :687 — hidden easter egg, false positive), repeating stripes + grid (shop awning/egg hunt, intentional). URL scans (seeded via CDP, 34 states): 0 page/console errors, 0 sideways overflow; real: kid feedback textarea placeholder 4.1:1 (no ::placeholder rule), normal-mode points colour --pt #9a6a00 on #f3f5f9 4.3:1; nested-cards + cramped padding on Look/Data (likely intentional panels); 36×36 swatches and 13×13 native inputs on Look; brand link 30 px tall everywhere. No overlay (read-only run).

## What's working
1. Attendance at the door: one-tap มา, bulk "ทุกคนที่รอเช็กมา", sticky live counters, rows now stable.
2. Redeem: searchable "ใครมาแลกของรางวัล?", per-prize "แลกแล้วเหลือ / ขาดอีก", confirm previews the balance after.
3. Kid side has a real identity: calm, big Thai text, playful stall, 2-column leaderboard on PC.

## Priority issues
1. [P1] Points history has no date/time and a red ลบ on every row — undoing a wrong award means guessing between identical rows; deletes are permanent. Fix: date/time + day headers, quiet secondary ลบ, "เลิกทำ" in the toast right after giving points. (/impeccable harden + clarify)
2. [P1] A Thai program name makes an empty link name (slugify keeps only a–z/0–9) — create fails with a native browser bubble; later slug errors close the box and lose the typing. Fix: suggest a link name when empty (e.g. program-2026-11), inline Thai error inside the box, keep the box open, highlight the new card after creating. (/impeccable harden)
3. [P2] Kid prize journey ends with no action and uses pop-ups — "มีคะแนนพอแลกแล้ว!" doesn't say how to get it; item lightbox and name sheet are pop-ups on the kids' side. Fix: expand the item in place with "บอกพี่ผู้ดูแลเพื่อแลกได้เลย"; remember the tapped kid in the shop. (/impeccable clarify + distill)
4. [P2] Normal mode not followed through — cartoon shop, emoji prizes, "☰", broken Thai initials. Fix: plain list/grid shop in normal mode, initials from the first grapheme skipping leading vowels (เ แ โ ใ ไ), no glyphs in titles. (/impeccable polish)
5. [P2] Edit kid box: Back leaves the Kids page; "กลุ่ม" field sits under the sticky buttons. Fix: history entry when the box opens; bottom padding = sticky bar height + scroll into view on focus. (/impeccable adapt)

## Persona red flags
- Alex (power user): no history search/filter; Look is one 62-control scroll; PC home repeats the sidebar's 4 items.
- Sam (accessibility): 14 rules ≤12 px text; feedback placeholder 4.1:1; kid feedback send disabled with no reason.
- Casey (distracted mobile): toasts are the only confirmation after giving points; closing a round doesn't say what unchecked kids become.
- 10-year-old on a parent's phone: needs "แตะชื่อ" then "นี่คือฉัน" before the shop knows them; "คีย์/D" badges mean nothing; prize lightbox has no next step.
- Volunteer at the door: date picker 11/20/2026; ลา vs ขาด points unexplained; red "0" under ขาด draws the eye.

## Minor observations
Members page points to itself; program picker truncates; kids list shows no points; normal-mode --pt 4.3:1; PC leaderboard reads column-first (rank 6 beside rank 1); EN/TH toggle has no screen-reader label. From v43: PC sidebar at 768 px is FIXED (phone layout); others still open.

## Questions to consider
1. If kids can't redeem in the app, should the kids' shop be a wish list ("อีก 70 ⭐ ถึงตุ๊กตาหมี") instead of "แลกได้!" tags that lead nowhere?
2. Does the kid side need two point numbers, or only one, with the split shown to admins at redeem?
3. Should "delete kid" exist at all under "never delete existing data", when ซ่อน covers the need?
