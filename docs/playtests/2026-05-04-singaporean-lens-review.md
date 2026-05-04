# Singaporean Lens Playtest Review - 2026-05-04

## Context

Branch: `main`

Review goal: play through the current build as several Singapore player types and judge the game for realism, clarity, and fun.

Profiles exercised:

| Profile | Setup | Result |
| --- | --- | --- |
| Beginner Ben | Civil Service, Easy, mobile viewport, Claim / Plan Schemes | Bought Woodlands North Grove 3-Room, reached Portfolio, opened owner operations, started a room-rental lease, advanced to turn 3. |
| Tech Tasha | Tech Professional, Normal, Take Side Gig | Bought the starter HDB after the CPF rounding fix, reached Portfolio, opened owner operations, started a room-rental lease, advanced to turn 6. |
| Founder Farah | Entrepreneur, Hard, Property Hustle | Starter purchase correctly stayed blocked; life actions and scenarios moved cash/credit without forcing a bad purchase, advanced to turn 6. |
| Agent Amir | Property Agent, Tycoon, Property Hustle | Zero-cash opening remained readable but very punishing; scenario cadence helped, starter purchase stayed blocked, advanced to turn 6. |

Fresh verification evidence from this pass:

- `npm.cmd test` passed: 22 files, 176 tests.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run test:smoke` passed.
- `npm.cmd test -- src/engine/__tests__/actions.test.ts src/engine/__tests__/decisionCoach.test.ts` passed after the CPF purchase regression was added.
- Scripted Playwright profile pass covered dashboard, life planning, property browser, starter detail, purchase, portfolio, owner operations, room rental, scenarios, and month advancement.

Official source checks used for realism notes:

- IRAS ABSD rates: https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29
- CPF 2026 Ordinary Wage ceiling: https://www.cpf.gov.sg/employer/infohub/news/cpf-related-announcements/new-contribution-rates
- HDB renting out whole flat eligibility: https://www.hdb.gov.sg/managing-my-home/home-ownership/renting-out-a-flat-or-bedrooms/renting-out-a-flat/eligibility
- HDB conditions after buying a new flat: https://www.hdb.gov.sg/buying-a-flat/bto-sbf-and-open-booking-of-flats/conditions-after-buying-a-new-flat

## What Works

The first few minutes are much clearer now. `Decision Coach`, `Closest Property Path`, visible `Cash Required`, and `Deal ready / blocked` copy make the game playable without prior property knowledge. For a beginner Singaporean player, the loop now says "what can I do next?" instead of making them infer it from finance tables.

The fictionalized 122-listing market still feels recognisably Singaporean because it keeps towns, districts, MRT context, OCR/RCR/CCR language, HDB/private/commercial ladders, and first-timer/upgrader framing. This is the right legal/simulation balance: realistic geography and mechanics, fictional assets.

Owner operations are the most promising fun layer. Once a player buys, the floor plan, MOP counter, tenant plans, condition score, renovations, reserve, and maintenance systems create a second game loop beyond "wait for price index to rise."

## Findings

1. The normal-profile starter buy exposed a real CPF rounding bug. Tech Tasha saw a valid `Buy Property` CTA, but fractional CPF OA could round up inside the action and reject the purchase by less than S$1. This is now fixed by flooring CPF OA usage consistently.

2. CPF and PR ABSD needed current-rule alignment. CPF Ordinary Wage ceiling is now S$8,000 for the 2026 rule set, and PR ABSD is now 5% / 30% / 35% in code for future buyer-profile work.

3. Singapore realism now needs buyer identity, not just property type. Add SC / PR / Foreigner, single / couple / family nucleus, age, and income-profile inputs. Without this, HDB/BTO/EC eligibility can only be "game simplified" and will feel off to Singaporeans who know the rules.

4. HDB rental should be more explicit. Room rental during MOP is useful for gameplay, but the UI should label it as "owner-occupied room rental" and clearly distinguish it from whole-flat rental after MOP. This matters because HDB whole-flat rental is a post-MOP concept for eligible Singapore citizen owners.

5. Tycoon mode is fun but not realistic enough as a default Singapore story. Starting at S$0 with frequent scenarios creates an arcade challenge. Keep it, but frame it as challenge mode and balance the copy so players do not mistake windfall-heavy recovery for normal financial planning.

6. The post-purchase runway needs stronger milestones. A 60-month MOP is realistic, but pure waiting will feel slow. The owner loop should surface 6/12/24/60-month goals: emergency reserve, first tenant, first repair, first upgrade, refinancing/repricing check, and MOP readiness.

7. The game should teach "cash vs CPF vs reserve" more directly. Singapore players care about CPF OA, cash-over-valuation, stamp duties, renovation cash, emergency reserves, and accrued CPF interest. The UI has the raw numbers, but the decision framing can be friendlier.

## Next Phase Plan

1. Singapore profile wizard: add buyer residency, age band, household type, and first-timer status. Use it to drive ABSD, HDB/EC eligibility explanations, and player-specific tutorial copy.

2. First-home mission rail: add a 24-month beginner track with mini-goals for cash buffer, CPF OA, HFE-style readiness, first viewing, purchase, tenant decision, and first maintenance event.

3. HDB owner-occupancy model: split `room-rental`, `whole-flat`, and `own-stay` states visibly. Add MOP-safe warnings and post-MOP unlocks.

4. Owner fun pass: make renovations and tenants feel more consequential with clearer ROI, tenant satisfaction changes, rent strategy tradeoffs, repair urgency, and milestone rewards.

5. Balance pass by persona: tune Hard/Tycoon cash movement so hard modes feel stressful but not random. Add a short "why this happened" monthly recap to make every shock or upside legible.

6. Singapore rule glossary: add tooltips for ABSD, BSD, CPF OA, MSR, TDSR, MOP, EC ceiling, HFE-style readiness, and subsidy recovery. Keep the disclaimer that this is educational simulation data, not policy advice.
