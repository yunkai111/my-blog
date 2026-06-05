'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { TiltCard } from '@/components/tilt-card'

const navItems = [
  { path: '/', label: '源点' },
  { path: '/musings', label: '随写' },
  { path: '/monologue', label: '独白' },
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2070'

const GrainOverlay = () => (
  <div className="fixed inset-0 z-[9999] pointer-events-none" style={{ opacity: 0.022 }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </div>
)

const StaggeredText = ({ text, className = '', delay = 0, stagger = 0.1 }) => {
  const chars = useMemo(() => [...text], [text])
  const container = { hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }
  const child = {
    hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
    visible: { filter: 'blur(0px)', opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
  }

  return (
    <motion.span variants={container} initial="hidden" animate="visible" className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          variants={child}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
          className="will-change-[filter,opacity,transform]"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

const VerticalSerpentLink = ({ href, label, highlighted, onClick, onHover, onLeave }) => {
  const [hound, setHound] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => {
        setHound(true)
        onHover?.(href)
      }}
      onMouseLeave={() => {
        setHound(false)
        onLeave?.()
      }}
      className="relative block text-xs font-medium tracking-[0.15em] py-3 transition-[letter-spacing] duration-500 ease-out hover:tracking-[0.22em]"
      style={{ writingMode: 'vertical-rl' }}
    >
      <motion.span
        className="relative z-10 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))]"
        animate={{ color: highlighted ? '#d97706' : '#94a3b8' }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {label}
      </motion.span>
      <AnimatePresence mode="wait">
        {hound && (
          <motion.svg
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible"
            width="48"
            height="72"
            viewBox="0 0 48 72"
            fill="none"
          >
            <rect
              x="3"
              y="3"
              width="42"
              height="66"
              rx="10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              pathLength="1"
              className="snake-path"
              style={{ color: hound ? 'rgba(245,158,11,0.7)' : 'rgba(148,163,184,0.45)' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </Link>
  )
}

const MobileSerpentLink = ({ href, label, isActive, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="relative text-xs font-medium tracking-[0.15em] px-3 py-2 transition-[letter-spacing] duration-500 ease-out hover:tracking-[0.22em]"
  >
    <motion.span
      className="relative z-10 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))]"
      animate={{ color: isActive ? '#d97706' : '#94a3b8' }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      {label}
    </motion.span>
    {isActive && (
      <motion.svg
        layoutId="activeSnake"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible z-0"
        width="56"
        height="28"
        viewBox="0 0 56 28"
        fill="none"
      >
        <rect
          x="3"
          y="3"
          width="50"
          height="22"
          rx="9"
          stroke="#d97706"
          strokeWidth="1.5"
          fill="none"
          pathLength="1"
          className="snake-path will-change-transform"
        />
      </motion.svg>
    )}
  </Link>
)

const PARTICLE_COUNT = 45

function createSeededRandom(seed) {
  let value = seed % 2147483647
  if (value <= 0) {
    value += 2147483646
  }

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

const DUST_SEEDS = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const depth = i < 12 ? 0 : i < 30 ? 1 : 2
  const multi = depth === 0 ? 1.6 : depth === 1 ? 1.0 : 0.5
  const random = createSeededRandom(i + 1)

  return {
    id: i,
    x: random() * 100,
    y: random() * 100,
    size: (1.2 + random() * 2.8) * multi,
    opacity: (0.08 + random() * 0.22) * multi,
    blur: (0.4 + random() * 1.8) / multi,
    paral: multi * 0.06,
    repel: multi * 7,
  }
})

function DustField({ mouseX, mouseY }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {DUST_SEEDS.map((p) => (
        <DustParticle key={p.id} config={p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  )
}

function DustParticle({ config, mouseX, mouseY }) {
  const left = useTransform([mouseX, mouseY], ([mx, my]) => {
    const dx = mx - config.x
    const dy = my - config.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 25) {
      const r = (25 - dist) / 25
      return config.x - (dx / (dist || 1)) * r * config.repel - (mx - 50) * config.paral
    }
    return config.x - (mx - 50) * config.paral * 0.25
  })
  const top = useTransform([mouseX, mouseY], ([mx, my]) => {
    const dx = mx - config.x
    const dy = my - config.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 25) {
      const r = (25 - dist) / 25
      return config.y - (dy / (dist || 1)) * r * config.repel - (my - 50) * config.paral
    }
    return config.y - (my - 50) * config.paral * 0.25
  })

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left,
        top,
        width: config.size,
        height: config.size,
        background:
          'radial-gradient(circle at 50% 50%, rgba(220,200,160,0.9) 0%, rgba(180,150,110,0.3) 50%, rgba(180,150,110,0) 100%)',
        boxShadow: `0 0 ${config.size * 4}px ${config.size * 1.5}px rgba(200,170,130,0.35)`,
        filter: `blur(${config.blur}px)`,
        opacity: config.opacity,
      }}
    />
  )
}

export function BlogShell({ children }) {
  const pathname = usePathname()
  const currentPath = pathname || '/'
  const isHome = currentPath === '/'
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [hoveredPath, setHoveredPath] = useState(null)
  const lastNavClick = useRef({})

  useEffect(() => {
    if (!isHome) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [currentPath, isHome])

  const handleNavClick = useCallback(
    (to) => (e) => {
      if (to === currentPath) {
        e.preventDefault()
        const t = Date.now()
        if (lastNavClick.current[to] && t - lastNavClick.current[to] < 500) return
        lastNavClick.current[to] = t
        window.scrollTo({ top: 0, behavior: 'instant' })
        setRefreshCounter((k) => k + 1)
      }
    },
    [currentPath],
  )

  return (
    <div className="min-h-screen bg-paper text-slate-800 transition-colors duration-500 ease-out">
      <GrainOverlay />

      <nav className="hidden md:flex fixed left-[4rem] top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-6">
        {navItems.map((item) => (
          <VerticalSerpentLink
            key={item.path}
            href={item.path}
            label={item.label}
            highlighted={hoveredPath ? item.path === hoveredPath : currentPath === item.path}
            onClick={handleNavClick(item.path)}
            onHover={setHoveredPath}
            onLeave={() => setHoveredPath(null)}
          />
        ))}
      </nav>

      <nav className="md:hidden fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-center gap-8">
        {navItems.map((item) => (
          <MobileSerpentLink
            key={item.path}
            href={item.path}
            label={item.label}
            isActive={currentPath === item.path}
            onClick={handleNavClick(item.path)}
          />
        ))}
      </nav>

      <div key={`${currentPath}-${refreshCounter}`}>{children}</div>
    </div>
  )
}

export function HomePage({ articles }) {
  // --- ALL hooks declared first, unconditionally ---
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })

  const rawMouseX = useMotionValue(50)
  const rawMouseY = useMotionValue(50)
  const mouseX = useSpring(rawMouseX, { stiffness: 60, damping: 20 })
  const mouseY = useSpring(rawMouseY, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      rawMouseX.set((e.clientX / window.innerWidth) * 100)
      rawMouseY.set((e.clientY / window.innerHeight) * 100)
    },
    [rawMouseX, rawMouseY],
  )
  // --- End of hooks ---

  return (
    <div ref={containerRef} className="relative will-change-transform" style={{ minHeight: '200dvh' }} onMouseMove={handleMouseMove}>
      <DustField mouseX={mouseX} mouseY={mouseY} />
      <div className="sticky top-0 h-dvh overflow-hidden">
        <HeroSection scrollYProgress={scrollYProgress} isMobile={isMobile} />
      </div>
      <ContentSection articles={articles} />
    </div>
  )
}

function HeroSection({ scrollYProgress, isMobile }) {
  // --- ALL hooks declared first, unconditionally ---
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.25])
  const milkOverlay = useTransform(scrollYProgress, [0.55, 0.85], [0, 1])
  const bgBlur = useTransform(scrollYProgress, [0, 0.3, 0.7], [0, 0, 25])
  const textBlur = useTransform(scrollYProgress, [0, 0.3, 0.7], [0, 0, 25])
  const blurFilter = useMotionTemplate`blur(${bgBlur}px)`
  const textFilter = useMotionTemplate`blur(${textBlur}px)`
  const mobileBlurOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  // --- End of hooks ---

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-white/8" />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.18) 65%, rgba(0,0,0,0.30) 100%)',
        }}
      />
      {!isMobile && (
        <motion.div
          className="absolute inset-0 z-[3]"
          style={{ filter: blurFilter, opacity: mobileBlurOpacity }}
        >
          <Image src={HERO_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
        </motion.div>
      )}
      <motion.div
        className="absolute inset-0 z-[4] bg-paper"
        style={{ opacity: milkOverlay, willChange: 'opacity' }}
      />
      <motion.div
        className="relative z-20 w-full flex flex-col items-center justify-center h-full px-6"
        style={isMobile ? { opacity: heroOpacity } : { filter: textFilter, opacity: heroOpacity }}
      >
        <div className="flex flex-col items-center">
          <div
            className="text-4xl md:text-8xl font-serif font-bold tracking-[0.3em] leading-none text-slate-800"
            style={{ textShadow: '0 0 30px rgba(0,0,0,0.15), 0 4px 30px rgba(255,255,255,0.5)' }}
          >
            <StaggeredText text="万物荣枯" delay={0.2} />
          </div>
          <div
            className="mt-4 text-2xl md:text-6xl font-serif tracking-[0.3em] leading-none text-slate-600"
            style={{
              fontWeight: 200,
              textShadow: '0 0 30px rgba(0,0,0,0.12), 0 2px 20px rgba(255,255,255,0.45)',
              transform: 'translateX(0.2rem)',
            }}
          >
            <StaggeredText text="归于沉静" delay={1.5} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ContentSection({ articles }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-24">
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mb-16 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase">Recent Writings</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((art, i) => {
          const isFirst = i === 0
          return (
            <motion.div key={art.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className={isFirst ? 'md:col-span-2' : ''}>
              <TiltCard tiltAmount={isFirst ? 10 : 8} glow={false} className="overflow-hidden rounded-[3rem]">
                <Link href={`/musings/${art.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[3rem] border border-white/40 bg-white/30 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-amber-300/60 hover:bg-white/50 hover:shadow-xl hover:shadow-amber-100/30">
                  {art.coverImage && (
                    <div className={`overflow-hidden bg-slate-100 ${isFirst ? 'aspect-[21/9]' : 'aspect-[16/9]'}`}>
                      <img src={art.coverImage} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                    </div>
                  )}
                  <div className={`flex flex-1 flex-col justify-center p-6 ${isFirst ? 'md:p-10' : 'md:p-8'}`}>
                    <h3 className={`font-serif font-bold leading-tight text-slate-800 transition-colors duration-300 group-hover:text-amber-700 ${isFirst ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
                      {art.title}
                    </h3>
                    <p className={`mt-3 leading-relaxed text-slate-500 ${isFirst ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
                      {art.excerpt}
                    </p>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function MusingsPage({ groups }) {
  // --- ALL hooks declared first, unconditionally ---
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  let globalIdx = 0
  const allPieces = groups.flatMap((g) =>
    g.pieces.map((p) => ({
      ...p,
      year: g.year,
      globalIdx: ++globalIdx,
    })),
  )
  // --- End of hooks ---

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-6 pt-36 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }} className="mb-24 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-[0.2em] text-slate-900">随写</h1>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200/70 md:left-1/2 md:-translate-x-px" />

          <div className="space-y-16 md:space-y-24">
            {allPieces.map((piece, i) => {
              const isLeft = i % 2 === 0
              const dateStr = mounted
                ? new Date(piece.publishedAt || piece.year)
                    .toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                : ''

              return (
                <motion.div key={piece.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: (i % 6) * 0.06 }}
                  className="relative pl-10 md:pl-0">
                  <div className="absolute left-[10px] top-5 z-10 size-[9px] rounded-full border-2 border-slate-200 bg-white md:left-1/2 md:-translate-x-1/2" />

                  <div className={`md:w-[calc(50%-28px)] ${isLeft ? 'md:mr-auto md:pr-2' : 'md:ml-auto md:pl-2'}`}>
                    <span className="mb-2 block text-[11px] font-medium tracking-widest text-slate-400">
                      {piece.year}{dateStr ? ` · ${dateStr}` : ''}
                    </span>

                    <Link href={`/musings/${piece.slug}`}
                      className="group block overflow-hidden rounded-2xl bg-white/60 transition-all duration-500 hover:bg-amber-50/30 hover:shadow-lg hover:shadow-amber-100/20">
                      {piece.coverImage && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                          <img src={piece.coverImage} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                        </div>
                      )}
                      <div className="p-5 md:p-6">
                        <h3 className="font-serif text-lg font-bold leading-snug text-slate-800 transition-colors duration-300 group-hover:text-amber-800 md:text-xl">
                          {piece.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                          {piece.excerpt?.length > 100
                            ? piece.excerpt.slice(0, 100) + '…'
                            : piece.excerpt}
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="h-32" />
      </div>
    </div>
  )
}
