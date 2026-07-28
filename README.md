# Aeyesky Camera Calibration Tool

Frontend prototype for the Aeyesky camera calibration coding exercise.

This project recreates a calibration workflow where an operator draws and manages labeled regions on top of a table-camera still image. It is built with React, TypeScript, and Vite, with no backend dependency.

## Stack

- React 19
- TypeScript
- Vite
- SVG overlay for interactive drawing

## Submission Checklist

- Locally runnable application
- Git repository or ZIP delivery
- README with setup, approach, assumptions, limitations, time spent, and AI usage
- Build, lint, and test commands verified locally

## Run Locally

```bash
npm install
npm run dev
```

Open the app in the browser and use:

- `#/overview` for the exercise overview page
- `#/calibration` for the calibration tool

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test:run
```

## Implemented Functionality

- Overview page describing the workflow, label taxonomy, and coordinate format
- Calibration canvas with reference table image
- Label-driven drawing flow
- Polygon creation by clicking anchor points
- Rectangle creation by corner-to-corner drag
- Select mode and region highlighting
- Double-click anchor edit mode for reshaping regions
- Visibility toggle for individual regions and label groups
- Rename flow for labeled regions
- Search inside the labelled-area list
- Delete single region or delete all regions under a label
- Zoom in, zoom out, reset zoom, and space-drag panning
- Save action that downloads a calibration JSON file
- Local persistence through `localStorage`

## Technical Approach

- Built the prototype as a client-only React app with hash-based routing for two surfaces: `overview` and `calibration`
- Used a plain SVG overlay instead of a canvas library so polygon/rectangle rendering, hit testing, and anchor editing stay inspectable and easy to explain
- Stored all regions in a single normalized polygon schema, including rectangles, to keep save/export logic uniform
- Refactored the app into feature-based modules:
  - `features/overview`
  - `features/calibration`
  - `shared/types`, `shared/constants`, `shared/utils`, `shared/components`
- Added `Vitest`, Testing Library, and `jest-axe` coverage for routing, calibration interactions, delete flows, save payload structure, and accessibility smoke tests

## Key Tradeoffs

- Chose SVG over a heavier drawing library for simplicity and explainability, at the cost of building some interaction logic manually
- Kept persistence in `localStorage` plus JSON download instead of introducing a mock backend
- Prioritized fidelity for the provided screenshots and interaction notes over building a generalized annotation system for every possible game/table type
- Used hash routing to keep the prototype lightweight and self-contained without adding a router dependency

## Saved Data Format

Saving exports a JSON payload with:

- a unique region identifier
- the area label
- the display name
- polygon coordinates
- save timestamp and coordinate metadata

Example:

```json
{
  "id": "chip-rack",
  "label": "chip_tray",
  "name": "chip_tray_1",
  "points": [
    { "x": 0.312, "y": 0.102 },
    { "x": 0.646, "y": 0.102 },
    { "x": 0.646, "y": 0.251 },
    { "x": 0.312, "y": 0.251 }
  ]
}
```

## Coordinate Format

All saved regions use a uniform polygon schema, including rectangles.

- Each point is stored as `{ x, y }`
- `x` and `y` are normalized to the rendered image size
- Valid range is `0` to `1`
- Origin is the top-left corner of the image
- `x` increases left-to-right
- `y` increases top-to-bottom

## Assumptions

- No backend is included; save is simulated by file download and local persistence
- Rectangles are stored as 4-point polygons for a consistent schema
- Label counts represent `current instances / max allowed`
- Region ids are generated once and remain stable
- The prototype ships with seeded calibration regions for easier review

## Product Questions

- Should label taxonomy be fully configurable per game type, or is there a fixed operator preset per table class?
- Should hidden regions still be exported in the save payload, or should save include only visible/active regions?
- Is renaming an operator-only convenience, or should exported names follow a stricter backend contract?
- Should zoom/pan state persist between sessions, or reset on each load?

## Known Limitations

- Drawing and editing are optimized for the provided prototype workflow, not for very large annotation sets
- There is no backend sync, multi-user state, or conflict handling
- The calibration image is currently a static local asset
- Keyboard accessibility was improved for controls, but the canvas interaction model is still primarily pointer-driven
- Tests focus on critical flows and accessibility smoke coverage rather than exhaustive canvas geometry simulation

## Approximate Time Spent

- Approximately 4 hours total, including implementation, UI iteration, refactoring, and test coverage

## AI Usage

### AI Tools Used

- OpenAI Codex for implementation, refactoring, UI iteration, and test setup
- Claude for generating an early visual/design direction that was later brought into this repo and revised manually

### How AI Was Used

- Generated and revised initial UI structure ideas
- Accelerated repetitive frontend implementation and refactoring
- Helped draft and refine interaction logic for sidebar behavior, drawing workflow, and save/export flow
- Helped scaffold `Vitest` and accessibility coverage

### Prompt Summary

- Prompts focused on:
  - recreating the Aeyesky calibration workflow from the provided screenshots/Figma references
  - improving layout fidelity for calibration and overview pages
  - restoring missing hover/selection/visibility/delete interaction details
  - refactoring a monolithic `App.tsx` into feature-based files
  - adding `Vitest` and accessibility testing for calibration flows

### Example Of Correcting AI Output

- An earlier AI-driven iteration changed parts of the UI too aggressively before fully matching the provided source files and screenshots. That direction was rejected, the original provided files were reviewed more carefully, and the implementation was corrected to first match the existing reference behavior before applying incremental improvements.

## Project Structure

```text
public/
  calibration-table.png
src/
  App.tsx
  App.css
  index.css
```

## Notes

- The calibration screen was iterated toward the supplied Figma/screenshots while keeping the prototype self-contained
- The main non-goal is backend integration; save is intentionally simulated with JSON export and local persistence
- If anything remains beyond the requested prototype scope, it would be broader geometry edge-case coverage and production integration concerns rather than missing core exercise functionality
