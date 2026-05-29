'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useSpring } from 'framer-motion'
import { useState, useRef, useMemo, useEffect, useCallback } from 'react'

const navItems = [
  { path: '/', label: '源点' },
  { path: '/musings', label: '随写' },
  { path: '/monologue', label: '独白' },
]

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
        <motion.span key={i} variants={child} style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }} className="will-change-[filter,opacity,transform]">
          {char === ' ' ? ' ' : char}
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
      <motion.span className="relative z-10 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))]" animate={{ color: highlighted ? '#d97706' : '#94a3b8' }} transition={{ duration: 0.35, ease: 'easeInOut' }}>
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
            <rect x="3" y="3" width="42" height="66" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" pathLength="1" className="snake-path" style={{ color: hound ? 'rgba(245,158,11,0.7)' : 'rgba(148,163,184,0.45)' }} />
          </motion.svg>
        )}
      </AnimatePresence>
    </Link>
  )
}

const MobileSerpentLink = ({ href, label, isActive, onClick }) => (
  <Link href={href} onClick={onClick} className="relative text-xs font-medium tracking-[0.15em] px-3 py-2 transition-[letter-spacing] duration-500 ease-out hover:tracking-[0.22em]">
    <motion.span className="relative z-10 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.2))]" animate={{ color: isActive ? '#d97706' : '#94a3b8' }} transition={{ duration: 0.35, ease: 'easeInOut' }}>
      {label}
    </motion.span>
    {isActive && (
      <motion.svg layoutId="activeSnake" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible z-0" width="56" height="28" viewBox="0 0 56 28" fill="none">
        <rect x="3" y="3" width="50" height="22" rx="9" stroke="#d97706" strokeWidth="1.5" fill="none" pathLength="1" className="snake-path will-change-transform" />
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
    stiffness: 25 + random() * 55,
    damping: 10 + random() * 18,
    size: (1.2 + random() * 2.8) * multi,
    opacity: (0.08 + random() * 0.22) * multi,
    blur: (0.4 + random() * 1.8) / multi,
    paral: multi * 0.06,
    repel: multi * 7,
  }
})


function DustField({ mousePos }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {DUST_SEEDS.map((p) => (
        <DustParticle key={p.id} config={p} mousePos={mousePos} />
      ))}
    </div>
  )
}

function DustParticle({ config, mousePos }) {
  const x = useSpring(config.x, { stiffness: config.stiffness, damping: config.damping })
  const y = useSpring(config.y, { stiffness: config.stiffness, damping: config.damping })

  useEffect(() => {
    const mx = mousePos.x * 100
    const my = mousePos.y * 100
    const dx = mx - config.x
    const dy = my - config.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 25) {
      const r = (25 - dist) / 25
      x.set(config.x - (dx / (dist || 1)) * r * config.repel - (mx - 50) * config.paral)
      y.set(config.y - (dy / (dist || 1)) * r * config.repel - (my - 50) * config.paral)
    } else {
      x.set(config.x - (mx - 50) * config.paral * 0.25)
      y.set(config.y - (my - 50) * config.paral * 0.25)
    }
  }, [mousePos.x, mousePos.y, config.x, config.y, config.paral, config.repel, x, y])

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: config.size,
        height: config.size,
        background: 'radial-gradient(circle at 50% 50%, rgba(220,200,160,0.9) 0%, rgba(180,150,110,0.3) 50%, rgba(180,150,110,0) 100%)',
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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [hoveredPath, setHoveredPath] = useState(null)
  const lastNavClick = useRef({})

  useEffect(() => {
    if (!isHome) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [currentPath, isHome])

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
  }, [])

  const handleNavClick = useCallback((to) => (e) => {
    if (to === currentPath) {
      e.preventDefault()
      const t = Date.now()
      if (lastNavClick.current[to] && t - lastNavClick.current[to] < 500) return
      lastNavClick.current[to] = t
      window.scrollTo({ top: 0, behavior: 'instant' })
      setRefreshCounter((k) => k + 1)
    }
  }, [currentPath])

  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-800" onMouseMove={handleMouseMove}>
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
          <MobileSerpentLink key={item.path} href={item.path} label={item.label} isActive={currentPath === item.path} onClick={handleNavClick(item.path)} />
        ))}
      </nav>

      {isHome && <DustField mousePos={mousePos} />}

      <div key={`${currentPath}-${refreshCounter}`}>{children}</div>
    </div>
  )
}

export function HomePage({ articles }) {
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div ref={containerRef} className="relative" style={{ height: '200dvh' }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <HeroSection scrollYProgress={scrollYProgress} isMobile={isMobile} />
      </div>
      <ContentSection articles={articles} />
    </div>
  )
}

function HeroSection({ scrollYProgress, isMobile }) {
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.25])
  const milkOverlay = useTransform(scrollYProgress, [0.55, 0.85], [0, 1])
  const bgBlur = useTransform(scrollYProgress, [0, 0.3, 0.7], [0, 0, 25])
  const textBlur = useTransform(scrollYProgress, [0, 0.3, 0.7], [0, 0, 25])
  const blurFilter = useMotionTemplate`blur(${bgBlur}px)`
  const textFilter = useMotionTemplate`blur(${textBlur}px)`
  const bgUrl = "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2070')"

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: bgUrl }} />
      <div className="absolute inset-0 bg-white/12" />
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.18) 65%, rgba(0,0,0,0.30) 100%)' }} />
      {!isMobile && (
        <motion.div className="absolute inset-0 z-[3]" style={{ filter: blurFilter }}>
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: bgUrl }} />
          <div className="absolute inset-0 bg-white/12" />
        </motion.div>
      )}
      <motion.div className="absolute inset-0 z-[4] bg-[#fafaf8]" style={{ opacity: milkOverlay }} />
      <motion.div className="relative z-20 w-full flex flex-col items-center justify-center h-full px-6" style={isMobile ? { opacity: heroOpacity } : { filter: textFilter, opacity: heroOpacity }}>
        <div className="flex flex-col items-center">
          <div className="text-4xl md:text-8xl font-serif font-bold tracking-[0.3em] leading-none text-slate-800" style={{ textShadow: '0 0 30px rgba(0,0,0,0.15), 0 4px 30px rgba(255,255,255,0.5)' }}>
            <StaggeredText text="万物荣枯" delay={0.2} />
          </div>
          <div className="mt-4 text-2xl md:text-6xl font-serif tracking-[0.3em] leading-none text-slate-600" style={{ fontWeight: 200, textShadow: '0 0 30px rgba(0,0,0,0.12), 0 2px 20px rgba(255,255,255,0.45)', transform: 'translateX(0.2rem)' }}>
            <StaggeredText text="归于沉静" delay={1.5} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ContentSection({ articles }) {
  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8">
        {articles.map((art, i) => (
          <motion.div key={art.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.15 }}>
            <Link href={`/musings/${art.slug}`} className="group block rounded-[4rem] bg-white/30 backdrop-blur-xl border border-white/40 px-10 py-10 md:px-14 md:py-12 hover:bg-white/50 hover:border-amber-300/60 hover:shadow-lg hover:shadow-amber-100/30 transition-all duration-700">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 group-hover:text-amber-700 transition-colors duration-500 mb-3">{art.title}</h3>
              <p className="text-slate-500/90 leading-relaxed text-sm md:text-base max-w-xl">{art.excerpt}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function MusingsPage({ groups }) {
  const titleTs = { textShadow: '0 0 30px rgba(0,0,0,0.08), 0 2px 20px rgba(255,255,255,0.5)' }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-5xl mx-auto px-6 pt-36 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-28">
          <h1 className="text-5xl font-serif font-bold tracking-[0.2em] text-slate-900" style={titleTs}>随写</h1>
          <p className="mt-4 text-sm text-slate-700/80 tracking-widest">随手记下的片段。不追求完整，只在乎真实。</p>
        </motion.div>
        <div className="space-y-32">
          {groups.map((yearGroup, gi) => (
            <motion.div key={gi} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex flex-col md:flex-row gap-8 md:gap-20">
              <div className="md:sticky md:top-40 md:self-start flex-shrink-0">
                <span className="text-7xl md:text-8xl font-serif font-bold text-slate-300/50 select-none tracking-tight">{yearGroup.year.slice(2)}</span>
              </div>
              <div className="flex-1 space-y-20 pt-4">
                {yearGroup.pieces.map((piece, pi) => (
                  <motion.div key={piece.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: pi * 0.12 }}>
                    <Link href={`/musings/${piece.slug}`} className="group block cursor-pointer">
                      <h3 className="text-2xl font-serif font-bold text-slate-800 group-hover:text-amber-700 transition-colors duration-500 mb-3" style={titleTs}>{piece.title}</h3>
                      <p className="text-slate-600/90 leading-loose text-sm max-w-md">{piece.excerpt}</p>
                      <div className="mt-4 h-px w-0 group-hover:w-16 bg-amber-300/60 transition-all duration-700" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="h-32" />
      </div>
    </div>
  )
}

export function MonologuePage() {
  const titleTs = { textShadow: '0 0 30px rgba(0,0,0,0.08), 0 2px 20px rgba(255,255,255,0.5)' }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-xl mx-auto px-6 pt-36 pb-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}>
          <h1 className="text-4xl font-serif font-bold tracking-[0.2em] text-slate-900 text-center" style={titleTs}>独白</h1>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="mt-4 text-center">
          <p className="text-sm text-slate-700/80 tracking-widest">与自己的对话。关于我是谁，以及我建造了什么。</p>
        </motion.div>
        <div className="h-32" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }} className="text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-slate-500 font-medium">自我介绍即将上线</p>
          <p className="text-slate-500/70 text-xs">留一片空白，等一个恰当的时刻。</p>
        </motion.div>
        <div className="h-64" />
      </div>
    </div>
  )
}
