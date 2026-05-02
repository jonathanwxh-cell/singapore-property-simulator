# Market Depth Expansion Design

## Goal

Make Property Tycoon: Singapore feel like a fuller, more replayable market sim without turning it into an unmaintainable spreadsheet of handcrafted one-off content.

## Product Direction

This expansion should lean toward a grounded Singapore property simulation rather than a purely arcade empire builder. The game already has the right tone for that: CPF, BSD and ABSD, LTV and TDSR, district-level flavor, and a monthly turn loop. The next version should deepen those strengths instead of bolting on unrelated minigames.

## Current State Audit

The current repo already has a solid playable base:

- `34` live listings in [src/data/properties.ts](</C:/Users/Greyf/Desktop/Coding(Codex)/_reviews/singapore-property-simulator/src/data/properties.ts>)
- `28` districts in [src/data/districts.ts](</C:/Users/Greyf/Desktop/Coding(Codex)/_reviews/singapore-property-simulator/src/data/districts.ts>)
- `24` scenarios in [src/data/scenarios.ts](</C:/Users/Greyf/Desktop/Coding(Codex)/_reviews/singapore-property-simulator/src/data/scenarios.ts>)
- functional pages for browsing, market, bank, portfolio, scenarios, and save or load flows

The main content gaps are:

- only `17` of `28` districts have any live listings
- several property categories are too thin to support meaningful strategy differences
- ownership lifecycle is shallow after purchase: mostly rent, stop rent, or sell
- market data is visible, but not yet rich enough to create strong district-specific investment decisions
- scenarios are broad, but not sufficiently tied to the player's actual portfolio, districts, or financing posture

## Design Principles

### 1. Breadth first, then complexity

The first thing players notice is whether the market feels alive. Expanding listings and district coverage should come before heavy simulation additions.

### 2. Systemic reuse over bespoke sprawl

The game should not add 100 handcrafted listings if 70 of them can be generated from templates plus district modifiers. The content pipeline should scale cleanly.

### 3. Every owned asset should create decisions

Once the player buys something, that property should create monthly tension through rent, vacancy, upkeep, refinancing, lease decay, or exit timing.

### 4. Market identity should be legible

Each district and property category should communicate a clear fantasy:

- heartland yield play
- family upgrader asset
- premium appreciation hold
- commercial income engine
- prestige trophy asset

## Recommended Expansion Scope

## Pillar 1: Market Breadth

Increase the live market from `34` listings to roughly `80-100` listings.

Target mix:

- `12-15` HDB listings
- `6-8` EC listings
- `20-25` private condos
- `10-12` landed homes
- `10-12` commercial assets
- `8-10` rare or signature listings

District target:

- all `28` districts must have at least `2` active listings
- priority districts should have `3-5` listings
- every region should support early-game, mid-game, and aspirational late-game browsing

## Pillar 2: Acquisition Channels

The property browser should stop feeling like one flat catalog. Listings should belong to channels:

- `New Launch`
- `Resale`
- `Auction`
- `Distressed`
- `Off-Market`
- `Signature`

These channels create meaning without requiring a totally new economy model. They also support future event hooks and urgency windows.

## Pillar 3: Ownership Lifecycle

Owned properties should gain operational state beyond `isRented`.

Recommended additions:

- occupancy state: `vacant`, `tenanted`, `renovating`, `listed`
- tenant quality score
- maintenance burden
- MCST or service cost
- property tax
- vacancy streak
- lease decay pressure for aging leasehold stock
- refinance status or current loan package

This creates a real "portfolio management" loop instead of a "buy once, collect forever" loop.

## Pillar 4: Portfolio-Aware Events

Scenarios should become more contextual.

Examples:

- OCR mall announcement only matters more if the player owns nearby OCR stock
- lease top-up opportunities should target aging 99-year holdings
- tenant-default events should fire only when the player has rented holdings
- premium foreign-buyer events should skew toward CCR assets

Longer scenario chains should also exist:

- trigger event this month
- delayed follow-up after `2-3` turns
- outcome influenced by whether the player acted in the meantime

## Pillar 5: Empire Goals

The game should offer more success fantasies than raw net worth.

Add visible "routes" such as:

- `Heartland Landlord`
- `CCR Prestige Collector`
- `Commercial Cashflow Operator`
- `District Completionist`
- `Low-Leverage Conservative`
- `High-Risk Flipper`

These routes should be reflected in achievements, milestone cards, and portfolio summaries.

## Pillar 6: Better Market Surfaces

The current market page is informative but passive. It should become a decision surface.

Recommended additions:

- district cards with top live opportunities
- watchlist or shortlist
- channel filters
- market movers section
- supply pressure or yield heat
- "why this is hot" copy tied to districts and scenarios

## Proposed Data Architecture

The simplest maintainable path is:

1. keep the current static listing model compatible for existing code
2. introduce lightweight listing metadata
3. add property templates and district modifiers for future scale

Recommended new concepts:

- `PropertyArchetype`
- `ListingChannel`
- `ListingRarity`
- `OwnedPropertyState`
- `DistrictTheme`

The short-term goal is not full procedural generation. It is a hybrid catalog where curated signature listings sit beside template-driven listings.

## UI and UX Changes

### Properties Page

Should evolve from a simple filter grid into a market browser with:

- region chips
- channel chips
- district cards
- richer result summaries
- stronger visual differentiation between categories and rarity

### Property Detail

Should communicate:

- purchase thesis
- upside and risk
- district context
- ownership operating costs
- channel-specific tags such as auction or distressed

### Portfolio

Should show:

- asset status
- vacancy risk
- maintenance drag
- lease or maturity pressure
- grouped holdings by strategy type or district

## Non-Goals

The next expansion should not include:

- multiplayer
- real-time gameplay
- stock market or crypto side systems
- fully procedural city generation
- freeform interior decoration systems

Those would diffuse the game's identity and slow delivery.

## Success Criteria

The game should feel materially fuller when these are true:

- players can browse every defined district and see meaningful listings
- at least `3` different viable playstyles are obvious by turn `5`
- owning a property creates ongoing management decisions
- market and scenario events visibly connect to player holdings
- browsing the market feels aspirational, not exhausted after one session

## Recommended Delivery Phases

### Phase 1: Breadth

- expand listings
- cover all districts
- add listing channels
- improve browser readability

### Phase 2: Depth

- add ownership state
- add monthly carrying costs
- add vacancy and tenant quality
- add refinance or loan package visibility

### Phase 3: Context

- add portfolio-aware scenarios
- add longer scenario chains
- add market movers and district narratives

### Phase 4: Meta

- add empire routes
- expand achievements and milestone summaries
- add richer endgame identity beyond raw net worth

## Recommendation

The best next move is a breadth-first release that ships more inventory and stronger market presentation before deeper simulation layers. That will create the fastest visible improvement while preserving the realistic Singapore property identity that already makes the game distinctive.
