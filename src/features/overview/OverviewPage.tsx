import { useEffect, useRef, useState } from 'react'
import { JOB_ID, LABELS, OVERVIEW_ASSUMPTIONS } from '../../shared/constants/calibration'
import type { Point } from '../../shared/types/calibration'

export default function OverviewPage() {
  const overviewAnimationFrameRef = useRef<number | null>(null)
  const [overviewDot, setOverviewDot] = useState<Point>({ x: 0.22, y: 0.66 })

  useEffect(() => {
    const waypoints: Point[] = [
      { x: 0.22, y: 0.66 },
      { x: 0.63, y: 0.58 },
      { x: 0.71, y: 0.24 },
      { x: 0.38, y: 0.33 },
    ]
    const segmentDuration = 1500
    const start = performance.now()
    const ease = (value: number) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2

    const tick = (now: number) => {
      const total = waypoints.length * segmentDuration
      const elapsed = ((now - start) % total + total) % total
      const segmentIndex = Math.min(
        waypoints.length - 1,
        Math.floor(elapsed / segmentDuration),
      )
      const localProgress = ease((elapsed % segmentDuration) / segmentDuration)
      const from = waypoints[segmentIndex]
      const to = waypoints[(segmentIndex + 1) % waypoints.length]

      setOverviewDot({
        x: from.x + (to.x - from.x) * localProgress,
        y: from.y + (to.y - from.y) * localProgress,
      })

      overviewAnimationFrameRef.current = requestAnimationFrame(tick)
    }

    overviewAnimationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (overviewAnimationFrameRef.current) {
        cancelAnimationFrame(overviewAnimationFrameRef.current)
      }
    }
  }, [])

  return (
    <main className="overview-shell">
      <div className="overview-page">
        <header className="overview-nav">
          <a className="overview-nav__brand" href="#/overview" aria-label="Aeyesky home">
            <span>Aeyesky</span>
          </a>
          <div className="overview-nav__links">
            <a href="#how-it-works">How it works</a>
            <a href="#taxonomy">Regions</a>
            <a href="#data-format">Data format</a>
            <a className="overview-nav__cta" href="#/calibration">
              Open Calibration Tool
            </a>
          </div>
        </header>

        <section className="overview-hero">
          <div className="overview-hero__glow" />
          <div className="overview-copy overview-rise">
            <div className="overview-copy__eyebrow">Camera Calibration Tool</div>
            <h1>Teach every table camera where to look.</h1>
            <p>
              Aeyesky&apos;s vision models need to know exactly where the betting spots, chip trays
              and card shoe sit in frame. This tool lets an operator draw and label those regions
              directly on a still from the table camera.
            </p>
            <div className="overview-copy__actions">
              <a className="overview-btn overview-btn--light" href="#/calibration">
                Launch Calibration Tool →
              </a>
              <a className="overview-btn overview-btn--ghost" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>

          <div className="overview-preview overview-rise">
            <div className="overview-preview__pattern" />
            <div className="overview-preview__scanline" />
            <svg viewBox="0 0 400 286" className="overview-preview__svg">
              <rect x="252" y="46" width="96" height="58" className="preview-rect-fill" />
              <rect
                x="252"
                y="46"
                width="96"
                height="58"
                pathLength="100"
                className="preview-rect-stroke"
              />
              <polygon
                points="46,190 108,168 122,222 58,238"
                className="preview-poly-fill"
              />
              <path
                d="M46,190 L108,168 L122,222 L58,238 Z"
                pathLength="100"
                className="preview-poly-stroke"
              />
              <circle cx="252" cy="46" r="5" className="preview-dot preview-dot--1" />
              <circle cx="348" cy="46" r="5" className="preview-dot preview-dot--1" />
              <circle cx="348" cy="104" r="5" className="preview-dot preview-dot--2" />
              <circle cx="252" cy="104" r="5" className="preview-dot preview-dot--2" />
              <circle cx="108" cy="168" r="5" className="preview-dot preview-dot--3" />
              <circle cx="46" cy="190" r="5" className="preview-dot preview-dot--4" />
              <circle cx="122" cy="222" r="5" className="preview-dot preview-dot--5" />
              <circle cx="58" cy="238" r="5" className="preview-dot preview-dot--6" />
            </svg>
            <div className="overview-preview__job">{JOB_ID}</div>
            <div className="overview-preview__status">
              <span className="overview-preview__status-dot" />
              live calibration preview
            </div>
          </div>
        </section>

        <section className="overview-section" id="how-it-works">
          <h2>How calibration works</h2>
          <p className="overview-section__sub">Three steps, matching the actual tool UI.</p>
          <div className="overview-cards overview-cards--three">
            <article className="overview-card">
              <div className="overview-card__index">01</div>
              <h3>Pick a label</h3>
              <p>
                Choose which region you&apos;re about to draw from the LABEL list. Its shape and max
                instance count come from the label.
              </p>
              <div className="overview-progress">
                <span className="overview-progress__bar is-active" />
                <span className="overview-progress__bar" />
                <span className="overview-progress__bar" />
              </div>
            </article>
            <article className="overview-card">
              <div className="overview-card__index">02</div>
              <h3>Draw the region</h3>
              <p>
                Polygons use anchor clicks and close on the starting point. Rectangles are
                corner-to-corner drags. Double-click enters anchor edit mode.
              </p>
              <svg viewBox="0 0 200 40" className="workflow-line-demo" aria-hidden="true">
                <polyline
                  points="10,32 60,12 130,18 170,30"
                  pathLength="100"
                  className="workflow-line-demo__path"
                />
                <circle cx="10" cy="32" r="3.5" className="workflow-line-demo__fixed-dot" />
                <circle cx="60" cy="12" r="3" className="workflow-line-demo__dot dot-1" />
                <circle cx="130" cy="18" r="3" className="workflow-line-demo__dot dot-2" />
                <circle cx="170" cy="30" r="3.5" className="workflow-line-demo__fixed-dot dot-3" />
              </svg>
            </article>
            <article className="overview-card">
              <div className="overview-card__index">03</div>
              <h3>Save calibration</h3>
              <p>
                Rename, hide, or delete regions from the Labelled Area list, then export a JSON
                file with id, label, and polygon coordinates.
              </p>
              <div className="save-preview">
                <div className="save-preview__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 2h9l5 5v15H6z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="save-preview__meta">
                  <div>calibration-{JOB_ID}.json</div>
                  <div>3 regions · saved just now</div>
                </div>
                <div className="save-preview__pulse">
                  <span className="save-preview__pulse-ring" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="overview-section" id="taxonomy">
          <h2>Region taxonomy</h2>
          <p className="overview-section__sub">
            Assumed label set for a standard blackjack table. Adjustable per game type.
          </p>
          <div className="taxonomy-table">
            <div className="taxonomy-table__head">
              <div>Label</div>
              <div>Shape · max</div>
              <div>Purpose</div>
            </div>
            {LABELS.map((label) => (
              <div key={label.id} className="taxonomy-table__row">
                <div className="taxonomy-label">
                  <span className="taxonomy-label__dot" style={{ backgroundColor: label.color }} />
                  <span>{label.name}</span>
                </div>
                <div>
                  {label.shapeType === 'rectangle' ? 'Rect' : 'Poly'} ·{' '}
                  {label.max === 1 ? '×1' : `up to ×${label.max}`}
                </div>
                <div>{label.description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="overview-section" id="data-format">
          <h2>Data format &amp; assumptions</h2>
          <p className="overview-section__sub">
            Documented for the reviewer, since parts of the assignment were intentionally
            open-ended.
          </p>
          <div className="overview-data-grid">
            <div>
              <h3>Coordinate format</h3>
              <p className="overview-data-copy">
                Each polygon point is stored as <code>{'{x, y}'}</code>, normalized 0–1 as a
                fraction of the image container&apos;s rendered width and height, origin at the
                top-left.
              </p>
              <div className="coord-demo">
                <div className="coord-demo__grid">
                  <span
                    className="coord-demo__dot"
                    style={{
                      left: `${(overviewDot.x * 100).toFixed(1)}%`,
                      top: `${(overviewDot.y * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div className="coord-demo__meta">
                  <span>x: {overviewDot.x.toFixed(2)}</span>
                  <span>y: {overviewDot.y.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3>Assumptions made</h3>
              <div className="assumption-stack">
                {OVERVIEW_ASSUMPTIONS.map((assumption) => (
                  <div key={assumption} className="assumption-stack__item">
                    <span className="assumption-stack__dot" />
                    <span>{assumption}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="overview-footer-cta">
            <a className="overview-nav__cta" href="#/calibration">
              Open the Calibration Tool →
            </a>
          </div>
        </section>

        <footer className="overview-footer">Aeyesky — Frontend Coding Exercise Prototype</footer>
      </div>
    </main>
  )
}
