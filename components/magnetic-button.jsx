'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useCallback, useRef } from 'react'

/**
 * Magnetic Button — the child button drifts toward the mouse cursor
 * within an invisible sensing halo, without changing the layout.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {number} [props.radius=72]       halo extends this many px beyond the button
 * @param {number} [props.maxMove=20]      max displacement in px
 * @param {string} [props.className]
 */
export function MagneticButton({
  children,
  radius = 72,
  maxMove = 20,
  className = '',
}) {
  const wrapperRef = useRef(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 })

  const handleMouseMove = useCallback(
    (e) => {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Sensing radius = half diagonal of the halo area
      const r = Math.sqrt((rect.width / 2) ** 2 + (rect.height / 2) ** 2) + radius

      if (dist < 2) {
        x.set(0)
        y.set(0)
        return
      }

      const ratio = Math.min(dist / r, 1)
      const amount = ratio * maxMove
      x.set((dx / dist) * amount)
      y.set((dy / dist) * amount)
    },
    [x, y, maxMove, radius],
  )

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {/* Invisible sensing halo — pointer-events-none so clicks pass through */}
      <div
        className="pointer-events-none absolute"
        style={{ top: -radius, right: -radius, bottom: -radius, left: -radius }}
      />
      <motion.div style={{ x: springX, y: springY }}>
        {children}
      </motion.div>
    </div>
  )
}
