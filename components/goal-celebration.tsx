'use client'

import { useMemo } from 'react'

const COLORS = ['var(--positive)', 'var(--balance)', 'var(--cyan)', 'var(--negative)']

export function GoalCelebration({ goalName }: { goalName: string }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  )

  return (
    <div
      className="relative mb-3 overflow-hidden rounded-lg border p-3 text-center"
      style={{ borderColor: 'var(--cyan)', background: 'var(--card)' }}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <p className="relative text-sm font-semibold" style={{ color: 'var(--cyan)' }}>
        🎉 ¡Bien hecho! Meta lograda 🎉
      </p>
      <p className="relative text-xs text-[var(--muted)]">Completaste &quot;{goalName}&quot; — ¡FELICIDADES!</p>

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 6px;
          height: 10px;
          opacity: 0.9;
          animation-name: confetti-fall;
          animation-timing-function: ease-in;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(90px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}