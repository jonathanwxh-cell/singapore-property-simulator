# Learning Layer 1.0 Design

## Goal

Make SG Property Tycoon approachable for casual gamers who do not already know Singapore property acronyms, while retaining the richer simulation for players who want realism.

## Player Problem

Recent feedback says the game can feel like it assumes prior knowledge. Terms such as ABSD, CPF OA, MOP, MSR, TDSR, and BSD are meaningful Singapore mechanics, but casual players may read them as unexplained prerequisites rather than learnable game concepts.

## Design Direction

Learning Layer 1.0 should teach at the moment of need:

- State who the game is for before the run starts: casual tycoon players, Singapore property beginners, and players who want a simplified but realistic simulation.
- Provide a real Learn hub instead of routing the Learn nav item to Market.
- Turn common acronyms into contextual glossary chips that open plain-English explanations.
- Keep expert players moving by making explanations compact and optional, not blocking popups.
- Preserve the realism disclaimer: fictional property names, simplified rules, and no investment advice.

## Scope

This pass adds:

- A `Learn` page with beginner roadmap, core concepts, glossary, and common mistakes.
- A reusable glossary term component backed by the existing glossary data.
- More useful glossary data with "why it matters" and beginner examples.
- Casual-player framing on `How to Play`.
- Navigation updates so `Learn` opens the new hub.
- Smoke-test coverage for the new route and visible educational copy.

This pass does not add:

- Mandatory tutorials or blocking walkthroughs.
- New financial mechanics.
- Real-time policy lookups.
- Advisory language beyond simplified educational explanation.

## UX Rules

- Use short copy first, deeper copy second.
- Avoid making players feel tested.
- Explain rules as game verbs: "why this blocks your buy", "why this affects cash", "what to do next".
- Label real-world mechanics as simplified in-game models where appropriate.
- Let users learn by clicking, not by reading a manual up front.

