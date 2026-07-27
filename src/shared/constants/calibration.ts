import type { Annotation, LabelConfig } from '../types/calibration'

export const JOB_ID = 'DSH-4532'
export const STORAGE_KEY = 'aeyesky-calibration-state'
export const VIEWBOX_SIZE = 1000
export const CLOSE_DISTANCE_PX = 14

export const LABELS: LabelConfig[] = [
  {
    id: 'main_bet',
    name: 'main_bet',
    shapeType: 'polygon',
    max: 7,
    color: '#6b63ff',
    description: 'Main betting area for each seat.',
  },
  {
    id: 'chip_tray',
    name: 'chip_tray',
    shapeType: 'rectangle',
    max: 1,
    color: '#29b6f6',
    description: "Dealer's chip rack.",
  },
  {
    id: 'insurance',
    name: 'insurance',
    shapeType: 'polygon',
    max: 7,
    color: '#a855f7',
    description: 'Insurance arc or seat-level insurance region.',
  },
  {
    id: 'dealer_area',
    name: 'dealer_area',
    shapeType: 'polygon',
    max: 1,
    color: '#fb923c',
    description: 'Dealer hand / reveal area.',
  },
  {
    id: 'card_shoe',
    name: 'card_shoe',
    shapeType: 'rectangle',
    max: 1,
    color: '#34d399',
    description: 'Card shoe housing.',
  },
  {
    id: 'discard_tray',
    name: 'discard_tray',
    shapeType: 'rectangle',
    max: 1,
    color: '#fbbf24',
    description: 'Discard tray or burn card tray.',
  },
]

export const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'mb-seat-1',
    labelId: 'main_bet',
    name: 'main_bet_1',
    visible: true,
    points: [
      { x: 0.244, y: 0.454 },
      { x: 0.299, y: 0.528 },
      { x: 0.274, y: 0.609 },
      { x: 0.213, y: 0.553 },
    ],
  },
  {
    id: 'mb-seat-2',
    labelId: 'main_bet',
    name: 'main_bet_2',
    visible: true,
    points: [
      { x: 0.437, y: 0.525 },
      { x: 0.533, y: 0.525 },
      { x: 0.533, y: 0.683 },
      { x: 0.438, y: 0.683 },
    ],
  },
  {
    id: 'mb-seat-3',
    labelId: 'main_bet',
    name: 'main_bet_3',
    visible: false,
    points: [
      { x: 0.688, y: 0.454 },
      { x: 0.746, y: 0.528 },
      { x: 0.724, y: 0.607 },
      { x: 0.662, y: 0.552 },
    ],
  },
  {
    id: 'chip-rack',
    labelId: 'chip_tray',
    name: 'chip_tray_1',
    visible: true,
    points: [
      { x: 0.312, y: 0.102 },
      { x: 0.646, y: 0.102 },
      { x: 0.646, y: 0.251 },
      { x: 0.312, y: 0.251 },
    ],
  },
]

export const OVERVIEW_ASSUMPTIONS = [
  'No backend: Save Calibration downloads a JSON file; a real integration would POST the same payload.',
  'Rectangles are stored as 4-point polygons for a uniform schema across all label shapes.',
  'The count next to a label is instances drawn vs. its max allowed.',
  "A region's generated id is permanent; its display name is separately renamable from the Labelled Area list.",
  'Anchor-edit mode supports dragging individual points to reshape a shape.',
  'Deleting a label group removes every drawn instance of that label after one confirmation.',
]
