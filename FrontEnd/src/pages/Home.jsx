import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import PetalCanvas from '../components/PetalCanvas'

// ── Eases ──────────────────────────────────────────────────────────────────
const EXPO   = [0.76, 0, 0.24, 1]
const SPRING = [0.22, 1, 0.36, 1]

// ── Variants ───────────────────────────────────────────────────────────────
const borderH = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.6, ease: EXPO } },
}
const borderV = {
  hidden:  { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 1.6, ease: EXPO } },
}
const fadeUp = (delay = 0, blur = false) => ({
  hidden:  { opacity: 0, y: 18, ...(blur ? { filter: 'blur(8px)' } : {}) },
  visible: {
    opacity: 1, y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    transition: { duration: 1.0, ease: SPRING, delay },
  },
})

// DARWIN — each letter rises from an overflow:hidden mask
const darwinContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.88 } },
}
const darwinLetter = {
  hidden:  { y: '110%' },
  visible: { y: '0%', transition: { duration: 1.05, ease: EXPO } },
}

// ── Ink flood (imperative canvas) ──────────────────────────────────────────
function inkFlood(cx, cy, onDone) {
  const ov     = document.createElement('canvas')
  ov.style.cssText = 'position:fixed;inset:0;z-index:9500;pointer-events:none;'
  document.body.appendChild(ov)
  ov.width     = window.innerWidth
  ov.height    = window.innerHeight
  const oc     = ov.getContext('2d')
  const maxR   = Math.hypot(Math.max(cx, ov.width - cx), Math.max(cy, ov.height - cy)) * 1.35

  const dur    = 950
  const t0     = performance.now()

  function frame(ts) {
    const t    = Math.min((ts - t0) / dur, 1)
    const ease = t === 0 ? 0 : Math.pow(2, 10 * t - 10)
    const r    = maxR * ease

    oc.clearRect(0, 0, ov.width, ov.height)

    // Organic blob with layered sine wobble
    const N = 80
    oc.beginPath()
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2
      const w = 1
        + 0.060 * Math.sin(a *  5 + t * 14)
        + 0.040 * Math.sin(a * 11 - t *  9)
        + 0.025 * Math.sin(a * 17 + t *  6)
        + 0.018 * Math.sin(a *  3 - t *  5)
        + 0.012 * Math.sin(a * 23 + t *  3)
      const pr = r * w
      const x  = cx + Math.cos(a) * pr
      const y  = cy + Math.sin(a) * pr
      i === 0 ? oc.moveTo(x, y) : oc.lineTo(x, y)
    }
    oc.closePath()
    oc.fillStyle = '#131D4F'
    oc.fill()

    // Diffuse halo beyond edge
    if (r > 30) {
      const g = oc.createRadialGradient(cx, cy, r * 0.78, cx, cy, r * 1.28)
      g.addColorStop(0, 'rgba(19,29,79,0.22)')
      g.addColorStop(1, 'rgba(19,29,79,0)')
      oc.beginPath()
      oc.arc(cx, cy, r * 1.28, 0, Math.PI * 2)
      oc.fillStyle = g
      oc.fill()
    }

    if (t < 1) {
      requestAnimationFrame(frame)
    } else {
      oc.fillStyle = '#131D4F'
      oc.fillRect(0, 0, ov.width, ov.height)
      onDone()
    }
  }

  requestAnimationFrame(frame)
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  const navigate      = useNavigate()
  const petalRef      = useRef(null)
  const btnRef        = useRef(null)
  const transitioning = useRef(false)

  // Stats count-up
  const [statParams, setStatParams] = useState('0M')
  const [statHeads,  setStatHeads]  = useState('0')
  const [statCtx,    setStatCtx]    = useState('0')

  useEffect(() => {
    const timer = setTimeout(() => {
      const run = (from, to, dur, fmt, set) => {
        const t0 = performance.now()
        const tick = ts => {
          const t = Math.min((ts - t0) / dur, 1)
          const e = 1 - Math.pow(1 - t, 3)
          set(fmt(from + (to - from) * e))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
      run(0, 1.8, 1400, v => v.toFixed(1) + 'M', setStatParams)
      run(0, 4,   1000, v => String(Math.round(v)), setStatHeads)
      run(0, 128, 1200, v => String(Math.round(v)), setStatCtx)
    }, 1700)
    return () => clearTimeout(timer)
  }, [])

  // Custom cursor
  const curX = useMotionValue(-40)
  const curY = useMotionValue(-40)
  useEffect(() => {
    const move = e => { curX.set(e.clientX); curY.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [curX, curY])

  // Parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rawCX  = useTransform(mouseX, v => (v / window.innerWidth  - 0.5) * 16)
  const rawCY  = useTransform(mouseY, v => (v / window.innerHeight - 0.5) *  9)
  const contX  = useSpring(rawCX, { stiffness: 80, damping: 20 })
  const contY  = useSpring(rawCY, { stiffness: 80, damping: 20 })
  useEffect(() => {
    const move = e => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [mouseX, mouseY])

  // Magnetic button
  const btnX = useMotionValue(0)
  const btnY = useMotionValue(0)
  const arrX = useMotionValue(0)
  const btnSX = useSpring(btnX, { stiffness: 180, damping: 16 })
  const btnSY = useSpring(btnY, { stiffness: 180, damping: 16 })
  const arrSX = useSpring(arrX, { stiffness: 280, damping: 18 })

  const onBtnMove = e => {
    const r  = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width  / 2)) * 0.26
    const dy = (e.clientY - (r.top  + r.height / 2)) * 0.26
    btnX.set(dx); btnY.set(dy); arrX.set(dx * 0.7 + 7)
  }
  const onBtnLeave = () => { btnX.set(0); btnY.set(0); arrX.set(0) }

  // Navigate with ink flood
  const handleNavigate = () => {
    if (transitioning.current) return
    transitioning.current = true
    const r = btnRef.current.getBoundingClientRect()
    const cx = r.left + r.width  / 2
    const cy = r.top  + r.height / 2
    petalRef.current?.startVortex(cx, cy)
    inkFlood(cx, cy, () => {
      sessionStorage.setItem('ink-enter', '1')
      navigate('/chat')
    })
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', cursor: 'none' }}>

      {/* Cursor dot */}
      <motion.div style={{
        position: 'fixed', width: 8, height: 8,
        background: 'var(--rust)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        x: curX, y: curY,
        translateX: '-50%', translateY: '-50%',
      }} />

      {/* Petals */}
      <PetalCanvas ref={petalRef} count={26} />

      {/* Border lines */}
      <motion.div className="line-top"    variants={borderH} initial="hidden" animate="visible" style={{ transformOrigin: 'left center' }} />
      <motion.div className="line-bottom" variants={borderH} initial="hidden" animate="visible" style={{ transformOrigin: 'right center', transitionDelay: '0.15s' }} />
      <motion.div className="line-left"   variants={borderV} initial="hidden" animate="visible" style={{ transformOrigin: 'center top', transitionDelay: '0.3s' }} />

      {/* Scene grid */}
      <div style={{
        position: 'relative', height: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto 1fr auto',
        zIndex: 10,
      }}>

        {/* ── HEADER ── */}
        <motion.header
          style={{ gridColumn: '1 / 3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '32px 48px 0' }}
          variants={fadeUp(0.5)} initial="hidden" animate="visible"
        >
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--blue)', fontWeight: 300 }}>
            ( language model ) &nbsp;/&nbsp; <span style={{ color: 'var(--rust)' }}>darwin series</span>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'var(--navy)', opacity: 0.4 }}>
            MMXXVI
          </div>
        </motion.header>

        {/* ── CONTENT ── */}
        <motion.div
          style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 48px', x: contX, y: contY }}
        >
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* "introducing" */}
            <motion.div
              style={{ fontFamily: 'Pinyon Script, cursive', fontSize: 'clamp(28px,3.5vw,46px)', color: 'var(--rust)', lineHeight: 1, marginBottom: -8, marginLeft: 4 }}
              variants={fadeUp(0.72)} initial="hidden" animate="visible"
            >
              introducing
            </motion.div>

            {/* DARWIN mask reveal */}
            <motion.div
              variants={darwinContainer} initial="hidden" animate="visible"
              style={{ display: 'flex', fontFamily: 'BTCGods, sans-serif', fontSize: 'clamp(80px,12vw,160px)', color: 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 0.88 }}
            >
              {'DARWIN'.split('').map((letter, i) => (
                <div key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
                  <motion.span variants={darwinLetter} style={{ display: 'inline-block' }}>
                    {letter}
                  </motion.span>
                </div>
              ))}
            </motion.div>

            {/* Model tag */}
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}
              variants={fadeUp(1.25)} initial="hidden" animate="visible"
            >
              <div style={{ flex: 1, height: 1, background: 'var(--blue)', opacity: 0.3, maxWidth: 40 }} />
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.3em', color: 'var(--rust)', border: '1px solid var(--rust)', padding: '4px 14px 4px 16px', whiteSpace: 'nowrap' }}>
                [ MODEL — 1 ]
              </div>
            </motion.div>

            {/* Tagline — blur entrance */}
            <motion.p
              style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(16px,2vw,22px)', color: 'var(--blue)', letterSpacing: '0.04em', lineHeight: 1.4, marginTop: 28 }}
              variants={fadeUp(1.45, true)} initial="hidden" animate="visible"
            >
              a mind, built from <em style={{ fontStyle: 'normal', color: 'var(--rust)' }}>first principles</em>
            </motion.p>

            {/* CTA */}
            <motion.div
              style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 14 }}
              variants={fadeUp(1.85)} initial="hidden" animate="visible"
            >
              <motion.button
                ref={btnRef}
                onMouseMove={onBtnMove}
                onMouseLeave={onBtnLeave}
                onClick={handleNavigate}
                style={{
                  x: btnSX, y: btnSY,
                  display: 'inline-flex', alignItems: 'center', gap: 16,
                  fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'var(--cream)', background: 'var(--navy)',
                  border: 'none', padding: '18px 40px',
                  position: 'relative', overflow: 'hidden',
                  alignSelf: 'flex-start', cursor: 'none',
                }}
                whileHover="hovered"
              >
                {/* Rust wipe */}
                <motion.span
                  variants={{ hovered: { x: '0%' } }}
                  initial={{ x: '-101%' }}
                  transition={{ duration: 0.55, ease: EXPO }}
                  style={{ position: 'absolute', inset: 0, background: 'var(--rust)' }}
                />
                <span style={{ position: 'relative', zIndex: 1 }}>Begin conversation</span>
                <motion.span
                  style={{ x: arrSX, position: 'relative', zIndex: 1 }}
                >
                  →
                </motion.span>
              </motion.button>

              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--blue)', opacity: 0.5, letterSpacing: '0.03em' }}>
                ( trained &amp; running on Raspberry Pi 5 )
              </span>
            </motion.div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 40, position: 'relative' }}>

            {/* Ink brush SVG */}
            <motion.svg
              viewBox="0 0 400 60" fill="none"
              style={{ width: '100%', maxWidth: 360, marginBottom: 32 }}
              variants={fadeUp(1.1)} initial="hidden" animate="visible"
            >
              <path d="M2 38 C20 10, 60 5, 100 28 C140 50, 180 8, 220 22 C260 36, 300 12, 380 30"
                stroke="#254D70" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1}>
                <animate attributeName="stroke-dashoffset" from="1" to="0" dur="2s" begin="1.2s" fill="freeze" />
              </path>
              <path d="M10 44 C50 20, 100 42, 150 30 C200 18, 250 44, 320 38 C350 35, 370 40, 395 42"
                stroke="#954C2E" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.18"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1}>
                <animate attributeName="stroke-dashoffset" from="1" to="0" dur="2.4s" begin="1.5s" fill="freeze" />
              </path>
            </motion.svg>

            {/* Stats */}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 20, borderLeft: '1px solid rgba(37,77,112,0.2)', paddingLeft: 28 }}
              variants={fadeUp(1.65)} initial="hidden" animate="visible"
            >
              {[
                { val: statParams, label: '( parameters )' },
                { val: statHeads,  label: '( attention heads )' },
                { val: statCtx,    label: '( context length )' },
                { val: 'Pi 5',     label: '( hardware )',        mono: true },
              ].map(({ val, label, mono }) => (
                <div key={label}>
                  <div style={{ fontFamily: mono ? 'DM Mono, monospace' : 'BTCGods, sans-serif', fontSize: mono ? 18 : 32, color: 'var(--navy)', lineHeight: 1, letterSpacing: mono ? '0.05em' : '0.02em' }}>
                    {val}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--blue)', opacity: 0.5, marginTop: 3 }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>

            <div style={{ position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.3em', color: 'var(--navy)', opacity: 0.15, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              darwin-1 — 2026 — raspberrypi
            </div>
          </div>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.footer
          style={{ gridColumn: '1 / 3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 48px 32px' }}
          variants={fadeUp(2.3)} initial="hidden" animate="visible"
        >
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 12, color: 'var(--blue)', opacity: 0.5 }}>
            ( built from scratch — every weight, every layer )
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {['project gutenberg corpus', 'pytorch — no pretrained weights'].map(t => (
              <span key={t} style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: 'var(--navy)', opacity: 0.3, textTransform: 'uppercase' }}>
                {t}
              </span>
            ))}
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
