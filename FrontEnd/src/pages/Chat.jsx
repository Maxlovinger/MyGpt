import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import PetalCanvas from '../components/PetalCanvas'

const EXPO   = [0.76, 0, 0.24, 1]
const SPRING = [0.22, 1, 0.36, 1]

// ── Typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(text) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!text) return
    let i = 0
    setDisplayed('')

    function next() {
      if (i >= text.length) return
      const ch = text[i++]
      setDisplayed(d => d + ch)
      let delay = 16
      if ('.!?'.includes(ch))  delay = 260
      else if (',;:'.includes(ch)) delay = 90
      else if (ch === ' ')     delay = 7
      setTimeout(next, delay)
    }
    next()
  }, [text])

  return displayed
}

// ── Individual message components ──────────────────────────────────────────
function UserMessage({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 28, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0,  filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: SPRING }}
      style={{ display: 'flex', gap: 20, maxWidth: 800, width: '100%', margin: '0 auto', flexDirection: 'row-reverse' }}
    >
      <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rust)', opacity: 0.7 }}>you</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rust)', opacity: 0.35, marginBottom: 8, textAlign: 'right' }}>you</div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 18, lineHeight: 1.8,
          padding: '18px 26px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          background: 'var(--navy)', color: 'var(--cream)',
          borderRadius: '2px 2px 0 2px', marginLeft: 40,
        }}>
          {text}
        </div>
      </div>
    </motion.div>
  )
}

function BotMessage({ text }) {
  const displayed = useTypewriter(text)

  return (
    <motion.div
      initial={{ opacity: 0, x: -28, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0,   filter: 'blur(0px)' }}
      transition={{ duration: 0.65, ease: SPRING }}
      style={{ display: 'flex', gap: 20, maxWidth: 800, width: '100%', margin: '0 auto' }}
    >
      <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontFamily: 'BTCGods, sans-serif', fontSize: 11, letterSpacing: '0.04em', color: 'var(--navy)', opacity: 0.5 }}>D1</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--blue)', opacity: 0.35, marginBottom: 8 }}>darwin — 1</div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 18, lineHeight: 1.8,
          padding: '18px 26px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          background: 'rgba(37,77,112,0.055)', color: 'var(--navy)',
          border: '1px solid rgba(37,77,112,0.1)',
          borderRadius: '2px 2px 2px 0', marginRight: 40,
          position: 'relative',
        }}>
          {/* Rust left accent */}
          <span style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 1.5, background: 'linear-gradient(to bottom, transparent, var(--rust), transparent)', opacity: 0.4,
          }} />
          {displayed}
          {/* Blinking caret while typing */}
          {displayed.length < text.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--rust)', marginLeft: 2, verticalAlign: 'text-bottom', opacity: 0.6 }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -28, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0,   filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
      transition={{ duration: 0.5, ease: SPRING }}
      style={{ display: 'flex', gap: 20, maxWidth: 800, width: '100%', margin: '0 auto' }}
    >
      <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
        <div style={{ fontFamily: 'BTCGods, sans-serif', fontSize: 11, color: 'var(--navy)', opacity: 0.5 }}>D1</div>
      </div>
      <div style={{
        display: 'flex', gap: 6, alignItems: 'center',
        padding: '20px 26px',
        background: 'rgba(37,77,112,0.055)', border: '1px solid rgba(37,77,112,0.1)',
        borderRadius: '2px 2px 2px 0', position: 'relative',
      }}>
        <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 1.5, background: 'linear-gradient(to bottom, transparent, var(--rust), transparent)', opacity: 0.35 }} />
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeInOut' }}
            style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Chat() {
  const navigate   = useNavigate()
  const chatRef    = useRef(null)
  const textareaRef = useRef(null)
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [exchanges, setExchanges] = useState(0)

  // Ink curtain entrance — read sessionStorage exactly once, lazily
  const [curtainDone, setCurtainDone] = useState(false)
  const [inkEnter] = useState(() => {
    const v = sessionStorage.getItem('ink-enter')
    if (v) sessionStorage.removeItem('ink-enter')
    return !!v
  })

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  // Custom cursor
  const curX = useMotionValue(-40)
  const curY = useMotionValue(-40)
  useEffect(() => {
    const move = e => { curX.set(e.clientX); curY.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [curX, curY])

  // Auto-resize textarea
  const onInput = e => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  // Send
  const send = useCallback(async () => {
    const prompt = input.trim()
    if (!prompt || loading) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: prompt }])
    setLoading(true)
    try {
      const res  = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, temperature: 0.8, max_tokens: 150 }),
      })
      const data = await res.json()
      setMessages(m => [...m, { id: Date.now() + 1, role: 'bot', text: data.response || data.error || '( no response )' }])
      setExchanges(n => n + 1)
    } catch {
      setMessages(m => [...m, { id: Date.now() + 1, role: 'bot', text: '( could not reach Darwin )' }])
    }
    setLoading(false)
    textareaRef.current?.focus()
  }, [input, loading])

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const goHome = () => navigate('/')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'none' }}>

      {/* Cursor */}
      <motion.div style={{
        position: 'fixed', width: 8, height: 8,
        background: 'var(--rust)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        x: curX, y: curY,
        translateX: '-50%', translateY: '-50%',
      }} />

      {/* Ink curtain wipe */}
      <AnimatePresence>
        {inkEnter && !curtainDone && (
          <motion.div
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 1.15, ease: EXPO }}
            style={{ position: 'fixed', inset: 0, background: '#131D4F', zIndex: 8000, transformOrigin: 'top center' }}
            onAnimationComplete={() => setCurtainDone(true)}
          />
        )}
      </AnimatePresence>

      {/* Petals (sparse) */}
      <PetalCanvas count={10} dimmed />

      {/* Border lines */}
      <motion.div className="line-top"    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: EXPO, delay: 0.1 }} style={{ transformOrigin: 'left center' }} />
      <motion.div className="line-bottom" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: EXPO, delay: 0.25 }} style={{ transformOrigin: 'right center' }} />
      <motion.div className="line-left"   initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.4, ease: EXPO, delay: 0.4  }} style={{ transformOrigin: 'center top' }} />

      {/* ── HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: SPRING, delay: inkEnter ? 0.4 : 0.2 }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 48px',
          borderBottom: '1px solid rgba(37,77,112,0.12)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: 'BTCGods, sans-serif', fontSize: 24, letterSpacing: '0.05em', color: 'var(--navy)' }}>DARWIN</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.28em', color: 'var(--rust)', border: '1px solid var(--rust)', padding: '3px 10px 3px 12px', opacity: 0.75 }}>[ 1 ]</span>
        </div>

        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--blue)', opacity: 0.4, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          ( conversation )
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: 'var(--blue)', opacity: 0.5, textTransform: 'uppercase' }}>
            <motion.span
              animate={{ opacity: [1, 0.4], scale: [1, 0.82] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#7bbf82', display: 'inline-block' }}
            />
            online
          </div>
          <motion.button
            onClick={goHome}
            whileHover={{ opacity: 1 }}
            style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'var(--blue)', textTransform: 'uppercase', opacity: 0.5, background: 'none', border: 'none', cursor: 'none', padding: 0 }}
          >
            ← home
          </motion.button>
        </div>
      </motion.header>

      {/* ── CHAT AREA ── */}
      <div
        ref={chatRef}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '48px 48px 32px',
          display: 'flex', flexDirection: 'column', gap: 40,
          position: 'relative', zIndex: 10,
        }}
      >
        {/* Empty state */}
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.8, ease: SPRING, delay: inkEnter ? 0.65 : 0.5 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}
            >
              <div style={{ fontFamily: 'Pinyon Script, cursive', fontSize: 54, color: 'var(--rust)', opacity: 0.6, lineHeight: 1 }}>
                speak freely
              </div>
              <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, var(--blue), transparent)', opacity: 0.3, margin: '4px auto' }} />
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 16, color: 'var(--blue)', opacity: 0.55, letterSpacing: '0.06em' }}>
                ( Darwin is listening )
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.22em', color: 'var(--navy)', opacity: 0.25, marginTop: 8, textTransform: 'uppercase' }}>
                press enter — shift+enter for newline
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {messages.map(msg =>
            msg.role === 'user'
              ? <UserMessage key={msg.id} text={msg.text} />
              : <BotMessage  key={msg.id} text={msg.text} />
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && <TypingIndicator key="typing" />}
        </AnimatePresence>
      </div>

      {/* ── INPUT AREA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: SPRING, delay: inkEnter ? 0.5 : 0.35 }}
        style={{
          position: 'relative', zIndex: 10,
          padding: '20px 48px 32px',
          borderTop: '1px solid rgba(37,77,112,0.1)',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          {/* Text input */}
          <motion.div
            style={{ flex: 1, position: 'relative', borderBottom: '1.5px solid rgba(37,77,112,0.25)' }}
            whileFocusWithin={{ borderColor: 'var(--navy)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInput}
              onKeyDown={onKey}
              rows={1}
              placeholder="say something..."
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', fontFamily: 'Cormorant Garamond, serif', fontSize: 18,
                lineHeight: 1.6, color: 'var(--navy)', padding: '10px 0',
                maxHeight: 150, overflowY: 'auto', cursor: 'none',
              }}
            />
          </motion.div>

          {/* Send button */}
          <motion.button
            onClick={send}
            disabled={loading || !input.trim()}
            whileHover={!loading && input.trim() ? 'hovered' : {}}
            style={{
              width: 44, height: 44,
              background: loading || !input.trim() ? 'rgba(37,77,112,0.15)' : 'var(--navy)',
              color: 'var(--cream)', border: 'none', cursor: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative', overflow: 'hidden',
              transition: 'background 0.3s ease',
            }}
          >
            <motion.span
              variants={{ hovered: { x: '0%' } }}
              initial={{ x: '-101%' }}
              transition={{ duration: 0.45, ease: EXPO }}
              style={{ position: 'absolute', inset: 0, background: 'var(--rust)' }}
            />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'relative', zIndex: 1 }}>
              <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        {/* Exchange counter */}
        <div style={{ maxWidth: 800, margin: '12px auto 0', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: 'var(--navy)', opacity: 0.2, textTransform: 'uppercase' }}>
          {exchanges} {exchanges === 1 ? 'exchange' : 'exchanges'}
        </div>
      </motion.div>
    </div>
  )
}
