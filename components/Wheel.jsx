'use client'

import { useEffect, useRef } from 'react'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9',
  '#92A8D1', '#955251', '#B565A7', '#009B77', '#DD4124'
]

function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

export default function Wheel({ items, spinning, rotation }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = 380

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 15

    ctx.clearRect(0, 0, size, size)

    // Outer glow ring
    ctx.save()
    ctx.shadowColor = 'rgba(147, 51, 234, 0.6)'
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.restore()

    const sliceAngle = (2 * Math.PI) / items.length

    items.forEach((item, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2
      const endAngle = startAngle + sliceAngle

      // Gradient slice
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      )
      const baseColor = COLORS[i % COLORS.length]
      gradient.addColorStop(0, lightenColor(baseColor, 40))
      gradient.addColorStop(0.5, lightenColor(baseColor, 20))
      gradient.addColorStop(1, baseColor)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Slice borders
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 4

      const text = item.name.length > 12 ? item.name.substring(0, 12) + '…' : item.name
      ctx.fillText(text, radius - 25, 5)
      ctx.restore()
    })

    // Center circle gradient
    const centerGradient = ctx.createRadialGradient(
      centerX - 8, centerY - 8, 0,
      centerX, centerY, 35
    )
    centerGradient.addColorStop(0, '#ffffff')
    centerGradient.addColorStop(0.5, '#f5f5f5')
    centerGradient.addColorStop(1, '#e0e0e0')

    ctx.beginPath()
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI)
    ctx.fillStyle = centerGradient
    ctx.fill()
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 3
    ctx.stroke()

    // Center emoji
    ctx.fillStyle = '#666'
    ctx.font = '24px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎡', centerX, centerY)

  }, [items])

  return (
    <div className="relative">
      {/* Glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-[420px] h-[420px] rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl transition-opacity duration-500 ${spinning ? 'opacity-100' : 'opacity-50'}`} />
      </div>

      {/* Pointer arrow */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
        <div className="relative">
          <div 
            className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[45px] border-l-transparent border-r-transparent border-t-red-500"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
          />
          <div className="absolute top-[3px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[32px] border-l-transparent border-r-transparent border-t-red-400" />
        </div>
      </div>

      {/* Wheel */}
      <div
        className="relative transition-transform"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 6s cubic-bezier(0.15, 0.85, 0.15, 1.00)' : 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          className="drop-shadow-2xl"
          style={{ width: 380, height: 380 }}
        />
      </div>

      {/* Spinning sparkles */}
      {spinning && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s'
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
