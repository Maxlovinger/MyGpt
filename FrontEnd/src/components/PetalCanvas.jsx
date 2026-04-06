import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

const COLORS = ['#ECC8C5', '#E8B4B0', '#D4A0A0', '#C9A0A0', '#EFD5D0', '#EBBCBC']

function drawLeafPetal(ctx, x, y, size, angle, opacity, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.bezierCurveTo( size * 0.6, -size * 0.5,  size * 0.8, size * 0.3, 0,  size)
  ctx.bezierCurveTo(-size * 0.8,  size * 0.3, -size * 0.6, -size * 0.5, 0, -size)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

const PetalCanvas = forwardRef(function PetalCanvas({ count = 26, dimmed = false }, ref) {
  const canvasRef      = useRef(null)
  const transitionRef  = useRef(false)
  const vortexRef      = useRef({ x: 0, y: 0 })
  const mouseRef       = useRef({ x: 0, y: 0 })
  const frameRef       = useRef(null)

  useImperativeHandle(ref, () => ({
    startVortex(x, y) {
      vortexRef.current  = { x, y }
      transitionRef.current = true
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = e => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouse)

    // Build petals — foreground (big/opaque) + background (small/faint)
    const petals = Array.from({ length: count }, (_, i) => {
      const fg         = i < Math.floor(count * 0.35)
      const baseOpacity = dimmed
        ? (fg ? 0.15 + Math.random() * 0.1 : 0.05 + Math.random() * 0.08)
        : (fg ? 0.40 + Math.random() * 0.35 : 0.10 + Math.random() * 0.18)
      return {
        x:           Math.random() * window.innerWidth,
        y:           Math.random() * window.innerHeight - window.innerHeight,
        size:        fg ? 9 + Math.random() * 7 : 3 + Math.random() * 5,
        speed:       fg ? 0.7 + Math.random() * 0.9 : 0.2 + Math.random() * 0.45,
        drift:       (Math.random() - 0.5) * 0.55,
        angle:       Math.random() * Math.PI * 2,
        spin:        (Math.random() - 0.5) * 0.018,
        sway:        Math.random() * 100,
        swaySpeed:   0.007 + Math.random() * 0.011,
        opacity:     baseOpacity,
        baseOpacity,
        color:       COLORS[i % COLORS.length],
        delay:       Math.random() * 220,
        vx: 0,
        vy: 0,
      }
    })

    let frame = 0

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      const { x: mx, y: my } = mouseRef.current
      const transitioning      = transitionRef.current
      const { x: vx, y: vy }  = vortexRef.current

      petals.forEach(p => {
        if (frame < p.delay) return

        if (transitioning) {
          const dx   = vx - p.x
          const dy   = vy - p.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 1
          const pull = Math.min(8, 1000 / dist)
          p.vx += (dx / dist) * pull
          p.vy += (dy / dist) * pull
          p.spin    *= 1.07
          p.opacity  = Math.max(0, p.opacity - 0.018)
        } else {
          p.vy += p.speed * 0.06
          p.vx += Math.sin(frame * p.swaySpeed + p.sway) * 0.04

          // Scatter from mouse
          const mdx  = p.x - mx
          const mdy  = p.y - my
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
          if (mdist < 110 && mdist > 0) {
            const f = ((110 - mdist) / 110) * 2.4
            p.vx += (mdx / mdist) * f
            p.vy += (mdy / mdist) * f
          }

          p.vx *= 0.90
          p.vy *= 0.90
          p.vy += p.speed * 0.10
          if (p.opacity < p.baseOpacity) p.opacity += 0.004
        }

        p.x     += p.vx + p.drift
        p.y     += p.vy
        p.angle += p.spin

        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; p.vx = 0; p.vy = 0 }
        if (p.x < -20)                 p.x = canvas.width + 20
        if (p.x > canvas.width + 20)   p.x = -20

        drawLeafPetal(ctx, p.x, p.y, p.size, p.angle, p.opacity, p.color)
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [count, dimmed])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
})

export default PetalCanvas
