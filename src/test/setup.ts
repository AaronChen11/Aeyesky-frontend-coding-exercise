import '@testing-library/jest-dom/vitest'
import { afterEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.location.hash = ''
})

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(globalThis, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16)),
})

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn((id: number) => window.clearTimeout(id)),
})

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})
