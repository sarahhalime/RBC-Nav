# RBC Compass

**Retaining talent starts with listening to it.**

A privacy-first career companion for RBC interns, built for the Tech@RBC Women's Advisory Program hackathon. Interns get a 50 second daily check-in, a biweekly Wrapped, and an NFC nametag that turns real moments into experience evidence. Leaders see the **Experience Gap**: the share of interns who expected something from RBC minus the share who actually experience it.

All data is synthetic. No external services are required.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # gap math, privacy, tap pipeline
npm run build      # production build
```

Node 18.17+ (tested on Node 22).

## Pitch path (under 90 seconds)

Press **Guided demo** (bottom right) or **Start the demo** on the landing page. Use the arrow keys or Next. The narrator walks through Maya's journey:

1. `/t/maya-7f3a`: Maya taps her nametag and signs in
2. `/intern`: daily check-in
3. `/intern/reflect`: press "Use Maya's sample", then Save. Private analysis finds a mentorship concern and offers support.
4. `/nfc`: pick **Cross-Team Lunch**, press **Simulate tap**. The program cross-team gap drops from 35 to 32 and Maya's Wrapped updates.
5. `/intern/wrapped`: story-style recap with the new experience
6. `/insights`: leader view. Calgary mentor time alert. Toggle **Show privacy guardrail**.
7. `/insights#simulator`: Gap Closer. Pick an intervention, set intensity, press **Green-light this**.
8. `/act`: You Spoke. We Acted.

Press **Reset demo** on `/nfc` before each run.

**Tip:** keep `/insights` open in a second tab while tapping on `/nfc`. The leader chart updates live and shows a "gap closed" toast.

## Routes

| Route | What it is |
|---|---|
| `/` | Landing and pitch story |
| `/intern`, `/intern/*` | Intern app: home, expectations, reflect, gap, wrapped, vault, support |
| `/insights` | Leader Experience Gap dashboard and Gap Closer simulator |
| `/act` | You Spoke. We Acted. timeline |
| `/advisor` | Restricted advisor queue |
| `/nfc` | NFC demo console with QR fallback |
| `/t/[tagId]` | Phone landing page when a tag is tapped |
| `/nfc/display`, `/nfc/manager`, `/nfc/intern` | Live cross-device NFC demo (Firebase Realtime Database). Setup in README → Live NFC Demo |
| `/roi`, `/roadmap` | ROI calculator, roadmap and misuse safeguards |
| `POST /api/tap` | `{ tagId, stationType?, partnerTagId? }` |
| `GET /api/tap/events?since=` | Recent tap events (clients poll every 1.5s). `DELETE` resets the demo. |

Use the role switcher (top right) to switch between Intern, Advisor and Program Leader. Leaders cannot open intern pages.

## NFC nametag setup

The tag stores only an HTTPS link with an opaque id. No credentials, no personal data, no location tracking, and it does not replace the access badge.

1. Deploy (see below) so the URL works on any phone.
2. Buy NTAG213 or NTAG215 stickers or cards.
3. Install **NFC Tools** (iOS or Android).
4. In NFC Tools: **Write**, **Add a record**, **URL**, enter `https://<your-domain>/t/maya-7f3a`, then **Write** and hold the tag to the phone.
5. Optional: write `https://<your-domain>/t/priya-2c91` to a second tag for the Tap to Connect demo.
6. Test on both an iPhone (tap the top edge of the phone) and an Android phone (NFC on, tap the back).
7. Keep the QR code on `/nfc` as a fallback if the physical tap fails.

## Deploy to Vercel

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_BASE_URL` to the deployed URL (for example `https://rbc-compass.vercel.app`) in the Vercel project settings so the QR code matches the tag.

Note: the API uses an in-memory store (persisted to `/tmp` on Vercel). Serverless instances do not share memory, so taps from a phone can occasionally miss a browser polling a different instance. Taps made in the browser always update instantly because client state is the source of truth for the demo. Replace `lib/data/store.ts` with a real database for anything beyond a demo.

## How it works

- `lib/data/seed.ts`: deterministic seed (`seedrandom`). 250 interns, 5 cohorts, 6 business areas, weeks 1 to 6. Rank-based assignment makes the week 6 program totals match the pitch table exactly, while planted stories (Calgary mentor gap widening, Capital Markets lowest career clarity, Remote largest cross-team gap, Technology strongest belonging) come from small score adjustments.
- `lib/gap.ts`: `computeGap`, `gapVelocity`, `cohortAlerts`, `retentionPressure`, `simulateIntervention`. Experience score = 60% self-reported + 40% tap verified; experienced at 0.5 or above.
- `lib/privacy.ts`: `applyPrivacy` hides any slice under 10 contributors and blocks filter combinations that could difference out a group under 10.
- `lib/nfc.ts`: tap validation, station to dimension mapping, two-sided connection consent.
- `lib/themes.ts`: deterministic keyword theme detection. Optional LLM hook behind `COMPASS_LLM_ENABLED` (off by default).
- `lib/data/store.ts`: `DataStore` interface with an in-memory, JSON-persisted implementation (`.data/store.json` locally).

The same seed and math run on the client and the server, so every screen agrees.

## Trust and responsibility

- Private by default. Opt-in aggregation. Consent-based support.
- Leaders only see groups of 10 or more. Raw reflections are never shown.
- No keystroke, email, Teams or browsing surveillance.
- No individual risk scores for hiring, promotion, return offers or performance reviews.
- Missing reflections are never a risk signal.
- Retention Pressure is a directional cohort signal, not a validated attrition prediction.

Prototype controls are not production certified. Production needs RBC SSO, server-side RBAC, encryption, audit logs, retention limits, approved AI infrastructure, and privacy, security, legal and compliance review.
