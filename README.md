# Aeyesky Camera Calibration Tool

Frontend prototype for the Aeyesky camera calibration coding exercise.

This project recreates a calibration workflow where an operator draws and manages labeled regions on top of a table-camera still image. It is built with React, TypeScript, and Vite, with no backend dependency.

## Stack

- React 19
- TypeScript
- Vite
- SVG overlay for interactive drawing

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

## Project Structure

```text
public/
  calibration-table.png
  aeyesky-logo.png
  tab-icon.png
  tab-icon-32.png
src/
  App.tsx
  App.css
  index.css
```

## Notes

- The calibration screen was iterated toward the supplied Figma/screenshots while keeping the prototype self-contained
- Browser favicon updates may require a hard refresh or reopening the tab because favicon caching is aggressive
