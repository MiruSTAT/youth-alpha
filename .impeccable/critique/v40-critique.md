---
target: Youth Alpha v40 (whole app)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/claude/ya/index.html"
target_fingerprint: "sha256:ddba4504beeb516a5ba1346a77deb7e336ec139ec4e933d60df02e34f92eed2b"
target_path: /home/claude/ya/index.html
timestamp: 2026-11-20T03-57-52Z
slug: index-html
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

Critique: Youth Alpha v40 candidate (full run, preview copy, 390×844 + 1366×768)
Design Health Score: 27/40 (Acceptable, one point under Good; v39 was 28/40)

| # | Heuristic | v39 | v40 | Key issue now |
|---|---|---|---|---|
| 1 | Visibility of status | 3 | 3 | Give points step 3: the disabled "ให้ +5 · 0 คน" button gives no hint that you must pick someone |
| 2 | Match with real world | 3 | 3 | Ties now say "เสมอ"; the date still shows as 11/20/2026 |
| 3 | User control | 3 | 3 | Tapping an amount in step 2 jumps straight to step 3; a wrong tap needs Back |
| 4 | Consistency | 3 | 2 | Normal mode still says "เด็ก" in admin menus (i18n.js:31, :72) and keeps medal and animal-avatar emoji; attendance and Give points pick people in two different ways |
| 5 | Error prevention | 3 | 3 | −/+ rows are split now; any kid can tap "นี่คือฉัน" on a friend's name |
| 6 | Recognition | 3 | 3 | The shop shows each kid's balance and reach now; attendance can't put "not checked yet" first |
| 7 | Flexibility | 3 | 2 | No "everyone's here" without bulk-select mode, no recent amounts, desktop gets no denser layout |
| 8 | Aesthetic / minimal | 2 | 3 | Kids' home is calm now (shorter tree, snow behind); attendance cards are ~145 px tall, 2 kids above the fold |
| 9 | Error recovery | 2 | 2 | Reviewer did not trigger a failure (the new lasting #errBar with "ลองใหม่" is covered by t_v40_fixes, not seen in this review) |
| 10 | Help | 3 | 3 | Tour, ⓘ, hints, settings search; "ถึง 07:00" and "คัดลอกลิงก์ผู้ใช้" are unexplained |

Reading the comparison: every v39 priority issue is fixed (snow, ties/zero, home layout, Normal mode defaults and wording, admin risks, accessibility, shop). The total is 1 lower because this run was a fresh reviewer who looked at screens the v39 run did not weigh (attendance with many kids, kid detail, Normal mode admin words, desktop density) and scored 4 and 7 lower on those. 8 went up. Not a regression in the changed code.

Cognitive load: 3 of 8 checks fail (moderate). Attendance shows 9 kids × 3 buttons = 27 targets at once; Give points step 2 has 8 options; kid detail leads with six "0" rows.

Design Specificity Verdict
Kids side: clearly made for this app (tree, stall shop, "แลกได้!" / "อีก 20 ⭐", "เสมอ", Thai "หนู").
Admin side: generic but competent; at 1366 px single full-width rows ~975 px wide.
Normal mode: calmer (no snow/tree, "คุณ", "คะแนน", line icons) but still kids' words "เด็ก" in admin and medal/animal emoji.
Deterministic scan: source scan 5 findings (alert pulsing dot, alert glow, cutscene flash halo, awning stripes, awning scallops) + 6 advisories (5 known bounce easings 327/547/807/937/1125, grid background 316). Page scans: home 390 and 1366 = 0 (v39: nested cards, now gone); shop = 9 advisories, all the stall illustration (offset shadows on sign/planks/counter, awning). Overlay injected in headless Chrome: "No anti-patterns found". One small real item: the `glow2` alert animation (style.css ~509) may lack a reduced-motion fallback (the :517 rule covers `a.alert` only).

What's Working
- Ties and zero points are kind and honest ("เสมอ", "เสมอ 2 คน", "–", "เริ่มเก็บคะแนนกันเลย!").
- The kid's own card first ("อันดับที่ 4 จาก 9", big number) gives one clear focus.
- Give points is a clear 3-step flow with a summary button that says exactly what will happen.

Priority Issues
[P1] Attendance is slow on a phone: ~145 px per kid, 3 equal buttons, most kids are "มา". Fix: one-line rows (tap = มา, ลา/ขาด as small chips), a "ทุกคนมา" button without bulk mode, "รอเช็ก" first, sticky counters. Command: /impeccable distill, then /impeccable adapt.
[P1] Normal mode still talks about kids: "รายชื่อเด็ก", "ความคิดเห็นของเด็ก", medals and animal avatars. Fix: Normal-mode words ("สมาชิก") for tab_kids, tab_feedback, progPeople…; initials instead of emoji avatars in Normal mode. Command: /impeccable clarify.
[P2] Kid detail buries the meaning: six "0" rows first, "นี่คือฉัน" below the fold. Fix: sort skills by points, fold zeros, button up top. Command: /impeccable distill.
[P2] Prizes without a picture all show 🎁: a 7-year-old can't tell them apart; sold-out not marked. Fix: emoji/picture per prize with a category fallback, sold-out state. Command: /impeccable delight.
[P3] Desktop admin wastes space. Fix: cap width ~720 px or put pickers side by side. Command: /impeccable adapt.

Persona Red Flags
Volunteer admin mid-class: scrolls 30 tall attendance cards one-handed; a mis-tap in step 2 auto-advances; success toast is easy to miss.
7-year-old: the hint is two lines of small grey text; can tap "นี่คือฉัน" on a friend; identical 🎁 prizes; "–" for 0 points unexplained.
Power user (super admin): no keyboard shortcuts or bulk give on desktop; search helps.
First-timer staff: menu groups are clear; "คัดลอกลิงก์ผู้ใช้" and "ถึง 07:00" are unclear.

Minor Observations
- The red active-tab line above the kids' tab bar looks like a progress bar.
- The redeem list shows 0-balance kids too.
- glow2 alert animation: add it to the reduced-motion rule.

Questions to Consider (left for the owner)
1. If most kids are "มา" every week, why is attendance one decision per kid instead of one per absent kid?
2. Should Normal mode be its own visual system (avatars, brand, words) rather than the kids' UI with emoji swapped out?
3. Does a public leaderboard showing "–" and 0 points serve the kids at the bottom, or should the kids' side show personal progress ("+15 this week") instead?
