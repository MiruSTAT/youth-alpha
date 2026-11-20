Critique: Youth Alpha v39 (full run)
Design Health Score: 28/40 (Good)
#	Heuristic	Score	Key issue
1	Visibility of status	3	The sticky "เช็กชื่อเสร็จแล้ว" bar covers the last kid’s Here/Leave/Absent buttons
2	Match with real world	3	Normal mode still says "หนู" to adults. The date shows US format, 11/20/2026
3	User control	3	Points history has Undo, but nothing right after you tap Give
4	Consistency	3	Normal mode keeps the snow, the tree star and the ⭐ emoji
5	Error prevention	3	−5/−10 sit in the same grid as +5…+50 and look the same apart from colour
6	Recognition over recall	3	The shop doesn’t show the kid’s own points
7	Flexibility	3	Settings search and picking several kids at once are good. There’s no “same kids as last time” shortcut
8	Aesthetic / minimal	2	The tree takes about 45% of the home screen, and snow falls over the text
9	Error recovery	2	Errors are a generic toast that disappears after 2.2 s, with no retry (app.js:52)
10	Help	3	There’s a tour, hints and setting explanations. Ties and the zero state aren’t explained

Cognitive load: 3 of 8 checks fail (moderate). Step 2 of giving points shows 11 choices on one screen. The kids’ home has several things competing for attention. On PC, the admin menu appears twice, as the side menu and the home tiles.

Design Specificity Verdict
Kids side: clearly made for this app. The shop stall with price tags, the tree that glows with your points, quiet count-ups instead of pop-ups, and named Thai warnings.
Admin side: clean but generic. That’s fine for task screens.
Normal mode: not adult yet. It hides the emoji, but the snow and the tree star stay.
Automated checks: 4 warnings and 12 notes. Three warnings (the pulsing dot, glow and flash) are probably false alarms because they’re meaningful. Two findings are real:
The bordered announcement and verse boxes sit inside the home card (nested cards).
The shop’s “⭐ ร้านค้า ⭐” sign is 2.8:1 contrast, below the 3:1 minimum.

The shop’s stripes, shelves and shadows were flagged as decoration, but they’re deliberate parts of the illustration. Admin pages and markup built inside JS couldn’t be scanned automatically, so the design review covered those.

What’s Working
The no-pop-up rule is kept on the kids’ side, and the kid detail sheet is the high point: a big avatar, a big number, then "อันดับที่ 5 จาก 12".
Admin flows ask one thing per screen ("ขั้นที่ 1 จาก 3"), with 44–48px tap targets and named delete warnings.
Big readable Thai with good contrast, and the snow and CSS animations respect reduced motion.
Priority Issues

[P1] Kids can’t find themselves fast

Problem: The first ranking row starts at about y=630 of 844, below the tree, the announcement and the hint.
Fix:
Pin the kid’s own card near the top once they’ve picked their name.
Shrink the tree to about 30vh.
Merge the hint into the “🏆 อันดับ” heading.
Command: /impeccable layout

[P1] Snow falls on top of the text

Problem: #snow has z-index 30, which puts it above the content (style.css:281).
Fix: Put the snow behind the white sheet.
Command: /impeccable quieter

[P1] Ties and zero points: everyone gets 🥇

Problem: At the start of a program, every kid shows a gold medal.
Fix: No medals until a kid has more than 0 points. Show "เริ่มเก็บคะแนนกันเลย!" (let’s start collecting points!) when everyone is at zero.
Command: /impeccable harden

[P1] Normal mode isn’t adult yet

Problem: The snow, tree star, ⭐ and "หนู" all carry over.
Fix: In Normal mode, switch off the snow and 3D scene by default, change the wording to "แตะชื่อของคุณ" (tap your name), and use a neutral points icon.
Command: /impeccable distill

[P2] Risks for an admin mid-class

Problem: The finish bar covers a row, −10 sits next to +10, and errors disappear before they can be read.
Fix:
Add padding under the list so the finish bar can’t cover it.
Give minus points their own row with a "ลบคะแนน" (remove points) label.
Make errors stay until dismissed, with a retry.
Command: /impeccable polish

[P2] Accessibility

Problem:
The 3D tree animation ignores reduced motion (scene3d.js:198).
There are no keyboard focus styles.
The shop sign’s contrast is 2.8:1.
Command: /impeccable audit

[P2] The shop doesn’t know which kid is looking

Fix: Show "หนูมี 110 ⭐" (you have 110 ⭐) and "อีก 10 ⭐" (10 ⭐ more) on each prize.
Command: /impeccable delight
Persona Red Flags
A 9-year-old kid:
Has to scroll past the decoration to reach their name.
Sees two kids both at 🥇.
Snow drifts across the names.
Could set off the hidden tap-the-tree-5-times mode by accident.
A volunteer admin mid-class:
Could hit −10 by mistake.
Loses a row under the finish bar.
Re-tapping an attendance status takes 2 more taps.
An adult first-timer in Normal mode: Christmas snow, being called "หนู", and a list of gold medals all look broken.
The super admin on PC: sees two menus and two search boxes, and the daily grid leaves empty cells.
Minor Observations
Attendance lists kids in the order they were added, not alphabetically.
On phones, the group descriptions are cut off ("ผู้ดูแลและสิ…").
The shop shows its title twice.
Questions to Consider
What if the tree became the reward that lights up behind the kid’s own number?
Should Normal mode be its own calm shell over the same data?
Could giving points take two taps (kids, then amount), with the category remembered from last time?

This is the first critique saved for this app, so there’s no score trend yet. I saved the report in my working copy of the app, at .impeccable/critique/. It isn’t pushed to GitHub. Nothing in the app was changed.