import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('downloads calibration JSON when save is clicked', () => {
    window.location.hash = '#/calibration'

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Save Calibration' }))

    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
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
