import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App routing and core UI', () => {
  it('renders the overview page by default', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Teach every table camera where to look.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Calibration Tool' })).toBeInTheDocument()
  })

  it('renders the calibration page from the hash route', () => {
    window.location.hash = '#/calibration'

    render(<App />)

    expect(screen.getByRole('heading', { name: 'DSH-4532' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Calibration' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search labelled areas')).toBeInTheDocument()
  })

  it('filters labelled areas through the search input', async () => {
    window.location.hash = '#/calibration'

    render(<App />)

    const searchInput = screen.getByLabelText('Search labelled areas')
    fireEvent.change(searchInput, { target: { value: 'chip_tray_1' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'chip_tray_1' })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'main_bet_1' })).not.toBeInTheDocument()
  })

  it('switches routes when the hash changes after render', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Teach every table camera where to look.' }),
    ).toBeInTheDocument()

    window.location.hash = '#/calibration'
    fireEvent(window, new Event('hashchange'))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'DSH-4532' })).toBeInTheDocument()
    })

    window.location.hash = '#/overview'
    fireEvent(window, new Event('hashchange'))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Teach every table camera where to look.' }),
      ).toBeInTheDocument()
    })
  })
})

describe('Calibration interactions', () => {
  it('updates the active label context from the sidebar', async () => {
    window.location.hash = '#/calibration'

    render(<App />)

    const chipTrayLabel = screen.getByRole('button', { name: /^chip_tray 1\/1$/i })
    fireEvent.click(chipTrayLabel)

    const drawButton = screen.getByRole('button', { name: 'Draw tool' })
    await waitFor(() => {
      expect(drawButton).toBeDisabled()
      expect(drawButton).toHaveAttribute(
        'title',
        'chip_tray already reached its maximum region count',
      )
    })
  })

  it('toggles annotation visibility from the labelled area list', async () => {
    window.location.hash = '#/calibration'

    render(<App />)

    const hideButton = screen.getByRole('button', { name: 'Hide main_bet_1' })
    fireEvent.click(hideButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show main_bet_1' })).toBeInTheDocument()
    })
  })

  it('opens the delete modal and removes a single annotation on confirm', async () => {
    window.location.hash = '#/calibration'

    render(<App />)

    const targetRowButton = screen.getByRole('button', { name: 'main_bet_2' })
    const targetRow = targetRowButton.closest('.annotation-row')
    expect(targetRow).not.toBeNull()

    const deleteButton = within(targetRow as HTMLElement).getByRole('button', {
      name: 'Delete main_bet_2',
    })

    fireEvent.click(deleteButton)

    expect(screen.getByRole('heading', { name: 'Delete this annotation?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'main_bet_2' })).not.toBeInTheDocument()
    })
  })

  it('opens the delete modal and removes all annotations for a label on confirm', async () => {
    window.location.hash = '#/calibration'

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Delete all chip_tray regions' }))

    expect(
      screen.getByRole('heading', { name: 'Delete all annotations for this label?' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'chip_tray_1' })).not.toBeInTheDocument()
    })
  })
})

describe('Calibration save payload', () => {
  it('downloads calibration JSON with the expected structure', async () => {
    window.location.hash = '#/calibration'

    let savedBlob: Blob | undefined
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((object) => {
        savedBlob = object as Blob
        return 'blob:mock-url'
      })

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Save Calibration' }))

    expect(clickSpy).toHaveBeenCalled()
    expect(savedBlob).toBeDefined()
    if (!savedBlob) {
      throw new Error('Expected saveCalibration to create a Blob payload')
    }

    const payload = JSON.parse(await savedBlob.text()) as {
      jobId: string
      coordinateFormat: {
        unit: string
        origin: string
        axes: { x: string; y: string }
        schema: string
        pointExample: { x: number; y: number }
      }
      savedAt: string
      areas: Array<{
        id: string
        label: string
        name: string
        points: Array<{ x: number; y: number }>
      }>
    }

    expect(payload.jobId).toBe('DSH-4532')
    expect(payload.coordinateFormat).toMatchObject({
      unit: 'normalized',
      origin: 'top-left',
      axes: { x: 'left-to-right', y: 'top-to-bottom' },
      schema: 'points[]',
    })
    expect(payload.areas.length).toBeGreaterThan(0)
    expect(payload.areas[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        label: expect.any(String),
        name: expect.any(String),
        points: expect.any(Array),
      }),
    )
    expect(payload.areas[0].points[0]).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
    )
    expect(payload.areas[0].points[0].x).toBeGreaterThanOrEqual(0)
    expect(payload.areas[0].points[0].x).toBeLessThanOrEqual(1)
    expect(payload.areas[0].points[0].y).toBeGreaterThanOrEqual(0)
    expect(payload.areas[0].points[0].y).toBeLessThanOrEqual(1)

    clickSpy.mockRestore()
    createObjectURLSpy.mockRestore()
  })
})

describe('App accessibility', () => {
  it('has no obvious accessibility violations on the overview page', async () => {
    const { container } = render(<App />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no obvious accessibility violations on the calibration page', async () => {
    window.location.hash = '#/calibration'

    const { container } = render(<App />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
