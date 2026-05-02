# Logo Refresh Design

**Date:** 2026-05-02

## Goal

Replace the current ornate crest-style `Singapore Property Tycoon` logo with a cleaner game brand that feels modern, readable, and unmistakably Singaporean.

The new logo should work in two very different contexts:

- large, dramatic title-screen presentation
- compact top-bar branding during gameplay

## Problem

The current `title-logo.png` is visually heavy and over-detailed.

What is not working:

- the crest and lion emblem feel more like a luxury fantasy badge than a modern simulation game
- the typography is too busy for the top bar
- the mark is not optimized for small sizes
- the raster asset is harder to tune cleanly across multiple screen contexts

The game’s UI has moved toward a cleaner neon-glass system, but the logo still belongs to an older, more ornamental visual language.

## Chosen Direction

Use a `modern skyline + wordmark` system.

This is the best fit because:

- it keeps a strong Singapore identity without relying on national-symbol clichés
- it reads clearly in both large and small contexts
- it matches the game’s current sci-fi-finance aesthetic better than a heraldic crest
- it still feels like a property game instead of a generic dashboard app

## Visual Concept

The refreshed logo should have three parts:

1. a compact geometric skyline / roofline mark
2. a bold `TYCOON` anchor word
3. supporting `SINGAPORE PROPERTY` text arranged as a clean tiered lockup

Style notes:

- geometric, sharp-edged skyline silhouette
- subtle roofline or building-base cues rather than detailed landmarks
- strong horizontal composition
- restrained glow, not a noisy neon effect
- no medallion, crest, lion head, filigree, or metallic fantasy ornament

## Color Direction

Stay within the game’s existing palette:

- deep navy base
- cyan highlight
- warm gold accent
- off-white wordmark

Usage:

- cyan should carry the high-tech / HUD energy
- gold should be a minimal prestige accent, not a dominant theme
- the mark should still work in single-color or low-glow situations

## Typography Direction

Use the fonts the game already ships with:

- `Orbitron` for the main headline feel
- optional `Rajdhani` for lighter supporting text if needed

The wordmark should be:

- wider and more stable than the current composition
- spaced for readability first
- designed to avoid fragile thin details

## Asset Strategy

Do **not** solve this with a new oversized raster PNG.

Instead, move to a vector-first branding system:

- create a reusable React logo component with inline SVG for the skyline mark
- render the wordmark as live UI text so it stays crisp and theme-consistent
- provide variant props for title-screen and HUD usage

Why this is better:

- sharper at every size
- easier to tweak than baked image text
- naturally aligned with the game’s font stack
- avoids shipping another heavy opaque asset

## Component Plan

Create a dedicated logo component, likely `src/components/GameLogo.tsx`.

It should support:

- `title` variant for the title screen
- `hud` variant for the top bar
- compact behavior for smaller breakpoints

Responsibilities:

- render the skyline mark
- render the wordmark lockup
- expose size and glow control through props or variant classes
- keep layout stable without depending on image dimensions

## Integration Points

### Title Screen

Replace the current `<img src="/title-logo.png" />` with the new brand component.

The title-screen version should:

- feel premium and centered
- use a slightly larger glow treatment
- keep the existing GSAP fade / scale animation

### HUD Top Bar

Replace the current top-bar image with the compact logo variant.

The HUD version should:

- prioritize readability over flourish
- remain legible at roughly the current `h-8` visual scale
- collapse gracefully so the current `SGPT` small-screen fallback can stay or be folded into the component

### Sidebar

No large redesign required.

The sidebar footer text can stay text-only unless the refreshed brand suggests a tiny mark would noticeably improve it. That should be treated as optional and only included if it stays visually quiet.

## Constraints

- no additional brand sprawl beyond the actual logo system
- no animated logo internals in the base asset
- no dependency on externally loaded SVG fonts
- must look good against the current dark background
- should not reduce usability in the HUD

## Testing and Verification

The refresh should be checked in:

- title screen at desktop size
- HUD top bar at desktop size
- HUD top bar at smaller breakpoints
- browser build output for visual crispness

Verification after implementation:

- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`
- browser screenshot pass of title screen and in-game HUD

## Success Criteria

The refresh is successful when:

- the game feels more polished immediately on launch
- the HUD logo is cleaner and more readable than the current one
- the brand still feels specific to a Singapore property game
- the logo system looks intentional in both large and small contexts
