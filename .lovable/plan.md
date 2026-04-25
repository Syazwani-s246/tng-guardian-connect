# Screenshot All Screens → Single PDF

Capture every screen of the GOGuardian prototype at mobile viewport size and combine them into one PDF document for review.

## Screens to capture

1. `/` — Onboarding
2. `/guardian` — Guardian mode selection (with Try Demo buttons)
3. `/family` — Family Guardian setup
4. `/community` — Community Guardian pairing + volunteer card
5. `/ai-monitor` — AI Guardian monitoring dashboard
6. `/alert` — Static suspicious transaction alert
7. `/blocked` — Static blocked confirmation
8. Demo flow — Family: `/demo?mode=family&step=alert`, `&step=notify`, `&step=resolved&decision=blocked`
9. Demo flow — Community: same 3 steps with `mode=community`
10. Demo flow — AI: same 3 steps with `mode=ai`
11. Approved variant: `/demo?mode=family&step=resolved&decision=approved`

Total: ~16 screenshots.

## How

1. Use `browser--navigate_to_sandbox` with mobile viewport (390x844, iPhone size) for each route.
2. Use `browser--screenshot` to capture each screen as PNG.
3. Use Python (Pillow + reportlab) to compose all PNGs into one PDF, one screen per page with a small caption header.
4. Save output to `/mnt/documents/goguardian-screens.pdf` and present it as a downloadable artifact.

## Notes

- Mobile viewport (390x844) matches the PhoneShell design.
- The "notify" demo step auto-advances after ~2.2s — screenshot must be taken immediately after navigation.
- Captions on each PDF page identify the screen + route.
