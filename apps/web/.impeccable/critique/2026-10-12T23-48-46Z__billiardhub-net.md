---
target: billiardhub.net representative pages (home, clubs, tournaments, shop, coaches, club detail, contact)
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-10-12T23-48-46Z
slug: billiardhub-net
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score — 19/40 (Poor)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | hardcoded "۲.۳ کیلومتر" distance; always-on LIVE badge; "۰ ثبت‌نام باز" reads as dots |
| 2 | Match system / real world | 2 | English eyebrows/watermarks/posters; Latin commas in Persian prices |
| 3 | User control and freedom | 2 | auto-rotation without pause (/clubs h1 4.5s, hero 7s, marquee); Esc doesn't close «بیشتر» mega-menu |
| 4 | Consistency and standards | 1 | ≥7 CTA treatments, two accents (emerald home / gold inner), same club shows different table counts |
| 5 | Error prevention | 2 | closed booking disabled correctly; forms lightly tested |
| 6 | Recognition rather than recall | 3 | labels visible, shop category thumbnails; 16 flat mobile-menu tiles |
| 7 | Flexibility and efficiency | 2 | search/filter/near-me exist; /shop drops global nav |
| 8 | Aesthetic and minimalist | 1 | decoration layer; nav repeated 5× on home |
| 9 | Error recovery | 2 | honest empty states; failure paths untested |
| 10 | Help and documentation | 2 | no "how booking works"; free consultation → generic contact |

## Design specificity verdict
~70% category template, ~30% product-specific. Tells (verified): giant English outline watermarks (.sec-word CLUBS/BAZAAR/SELLERS/SERVICE/EXPLORE 115px; CHAMPIONSHIP; CONTACT 140px); English eyebrows (DISCOVER CLUBS, OFFICIAL TOURNAMENTS 8px, FIND YOUR COACH, FREE CONSULTATION, DISCOVER MORE, CHANNELS, MESSAGE); ghost numerals ۰۱–۰۶; rainbow icon tiles (same destination different hue across components); floating blur orb; English template tournament posters (nine-ball shows HEYBALL); full-bleed dark bands on inner pages despite light-inner rule. Detector: CLI 2 findings (tournaments:173 width transition; clubs/[id]:1658 bounce easing); in-page overlay home 181 / shop 140 / tournaments 30 / clubs 27 / club 20 (undersized text, ai-color-palette, dark-glow, kicker-above-heading, low-contrast). Metrics: home 26 font sizes, 7 button styles, 12 radii, 60 backdrop-filter elements; shop 98 backdrop-filter; club page 11 button styles / 8 radii.

## What's working
1. /shop — Divar-familiar marketplace idiom, real thumbnails, safe-area bottom bar, LQ CTA.
2. Honesty discipline in code (fake stats removed, truthful empty states, server booking status).
3. Club page IA (real photo, logo, verified badge, tabs, mobile fixed reserve bar).

## Priority issues
- [P0] Fake/contradictory data at trust points: hardcoded distance (clubs/[id]/page.tsx:158, sampleClub coords), LIVE always on (Navbar.tsx:79), «پشتیبانی ۲۴/۷», table counts differ home vs /clubs. Fix: real coords only after permission, LIVE from API, drop 24/7, shared tableSummary(). → harden
- [P1] Two accents + ~8 button styles: globals.css emerald "only accent" aliasing --gold, vs PRODUCT.md/LQ gold. Fix: one accent, one Button (primary LQ, secondary neutral, destructive), neutral icon tiles, radius tokens. → extract, polish
- [P1] Template decoration layer: watermarks, English eyebrows, ghost numerals, orb, English posters. Fix: remove; Persian context lines; approved motion carries identity. → quieter, distill
- [P1] Core job hard to find / low contrast: club «رزرو آنلاین» below desktop fold, #C7A66A on tint 2.08:1; .book-fixed lacks safe-area inset; home hero has no primary CTA. Fix: LQ reserve in club hero row, safe-area padding, one primary hero CTA keeping dark cinematic hero. → layout, adapt
- [P2] Unmanaged hierarchy: h1 50–59px across pages, home hero clamp to 66px (>56 cap); 30–40% of mobile text <11px; /clubs h1 rotates (sometimes «مربیان»); /shop no h1. Fix: 5-step scale 12/14/17/22/32 (+48 display), min 12px, static h1. → typeset

## Persona red flags
Casey (mobile, slow net): no CTA in 100svh hero, 717KB autoplay video, 14 blurred glass cards + 5 Ken Burns layers, 50 tap targets <44px. Jordan (first-timer): generic h1, nav ×5, "۲.۳ کیلومتر" from where, six «جزئیات» → same page. Sam (a11y): 2.08:1 reserve, unlabeled grid/list toggles & slider dots & navbar search, rotation ignores reduced-motion.

## Minor observations
Latin comma/decimal in Persian numbers; "۰ / ۳۲" reverses in RTL; prize line lacks separators; /shop 5 columns at 1280 (owner wants 6); contact form mixes 3 input/button styles; PRODUCT.md drifted (accent, tokens).

## Questions to consider
1. Emerald or gold — which is Billiard Hub?
2. Design lists honestly for N=1 instead of 90%-empty grids?
3. What should a visitor do in the first five seconds of the hero?
