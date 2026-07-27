import { VIEWBOX_SIZE } from '../constants/calibration'
import type { Page, Point } from '../types/calibration'

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `anno-${Math.random().toString(36).slice(2, 10)}`
}

export function formatTimestamp(value: string | null) {
  if (!value) return 'Never saved'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Never saved' : date.toLocaleString()
}

export function getPolygonPath(points: Point[]) {
  return points.map((point) => `${point.x * VIEWBOX_SIZE},${point.y * VIEWBOX_SIZE}`).join(' ')
}

export function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

export function getBounds(points: Point[]) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

export function getPageFromHash(hash: string): Page {
  return hash === '#/calibration' ? 'calibration' : 'overview'
}
