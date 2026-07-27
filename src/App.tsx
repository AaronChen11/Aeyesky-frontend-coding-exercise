import { useEffect, useState } from 'react'
import './App.css'
import CalibrationPage from './features/calibration/CalibrationPage'
import OverviewPage from './features/overview/OverviewPage'
import type { Page } from './shared/types/calibration'
import { getPageFromHash } from './shared/utils/calibration'

function App() {
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'overview' : getPageFromHash(window.location.hash),
  )

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return page === 'calibration' ? <CalibrationPage /> : <OverviewPage />
}

export default App
