'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'

/**
 * 3D Tilt Card with mouse-following radial-glow overlay.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {number} [props.tiltAmount=6]  max rotation degrees
 * @param {number} [props.perspective=800] CSS perspective in px
 * @param {number} [props.scale=1.02] subtle lift on hover
 * @param {boolean} [props.glow=true] show mouse-following radial-glow overlay
 */
export function TiltCard({
  children,
  className = '',
  tiltAmount = 6,
  perspective = 800,
  scale = 1.02,
  glow = true,
}) {
  const ref = useRef(null)

  const rawX = useMotionValue(0.5)
  const rawY = useMotionValue(0.5)

  const rotateX = useSpring(
    useTransform(rawY, [0, 1], [tiltAmount, -tiltAmount]),
    { stiffness: 200, damping: 25, mass: 0.5 },
  )
  const rotateY = useSpring(
    useTransform(rawX, [0, 1], [-tiltAmount, tiltAmount]),
    { stiffness: 200, damping: 25, mass: 0.5 },
  )
  const s = useSpring(1, { stiffness: 200, damping: 25, mass: 0.5 })

  const [hovered, setHovered] = useState(false)

  // Warm amber glow, no white center.
  const glowBg = useTransform([rawX, rawY], ([x, y]) =>
    `radial-gradient(circle 125px at ${x * 100}% ${y * 100}%, rgba(204, 226, 235, 0.66) 0%, rgba(196, 216, 224, 0.29) 50%, transparent 70%)`,
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      rawX.set((e.clientX - rect.left) / rect.width)
      rawY.set((e.clientY - rect.top) / rect.height)
    },
    [rawX, rawY],
  )

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    s.set(scale)
  }, [s, scale])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    rawX.set(0.5)
    rawY.set(0.5)
    s.set(1)
  }, [rawX, rawY, s])

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        scale: s,
        transformStyle: 'preserve-3d',
        perspective: `${perspective}px`,
        overflow: 'hidden',
      }}
      className={`relative ${className}`}
    >
      {glow && hovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: glowBg }}
        />
      )}
      {children}
    </motion.div>
  )
}
