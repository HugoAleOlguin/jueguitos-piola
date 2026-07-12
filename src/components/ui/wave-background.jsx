import React, { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

export function Waves({
    className = "",
    strokeColor = "#ffffff",  // White lines
    backgroundColor = "#000000",  // Black background
    pointerSize = 0.5,
    lowPcMode = true,
    targetFps = 35
}) {
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    
    const mouseRef = useRef({
        x: -10,
        y: 0,
        lx: 0,
        ly: 0,
        sx: 0,
        sy: 0,
        v: 0,
        vs: 0,
        a: 0,
        set: false,
    })
    
        const linesRef = useRef([])
    const noiseRef = useRef(null)
    const rafRef = useRef(null)
    const boundingRef = useRef(null)
    const lastTimeRef = useRef(0)

    // Page-relative offset tracking for scroll safety
    const containerPageXRef = useRef(0)
    const containerPageYRef = useRef(0)
    const lastClientRef = useRef({ x: 0, y: 0 })

    // Initialization
    useEffect(() => {
        const container = containerRef.current
        if (!container || !canvasRef.current) return

        // Initialize noise generator
        noiseRef.current = createNoise2D()

        // Check for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        // Initialize size and lines
        setSize()
        setLines()

        // Observe container size changes (works when content expands layout)
        const resizeObserver = new ResizeObserver(() => {
            setSize()
            setLines()
            if (prefersReducedMotion) {
                movePoints(0)
                drawCanvas()
            }
        })
        resizeObserver.observe(container)

        // Bind events
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('scroll', onScroll, { passive: true })
        container.addEventListener('touchmove', onTouchMove, { passive: false })

        if (prefersReducedMotion) {
            // Render a single static frame and don't start animation loop
            requestAnimationFrame(() => {
                movePoints(0)
                drawCanvas()
            })
        } else {
            // Start animation loop
            lastTimeRef.current = performance.now()
            rafRef.current = requestAnimationFrame(tick)
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            resizeObserver.disconnect()
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('scroll', onScroll)
            container.removeEventListener('touchmove', onTouchMove)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lowPcMode])

    // Set Canvas size and document-relative positions
    const setSize = () => {
        if (!containerRef.current || !canvasRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const { width, height } = rect

        // Set display size
        canvasRef.current.style.width = `${width}px`
        canvasRef.current.style.height = `${height}px`

        // Set backing store size (1:1 pixel ratio for low-PC friendliness)
        canvasRef.current.width = width
        canvasRef.current.height = height

        // Cache page-relative coordinates of the container
        containerPageXRef.current = rect.left + window.scrollX
        containerPageYRef.current = rect.top + window.scrollY
        boundingRef.current = rect
    }

    // Setup lines - optimized density for Canvas performance
    const setLines = () => {
        if (!boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        // Performance adjustment: Increase gap for low-end PCs
        const xGap = lowPcMode ? 18 : 10
        const yGap = lowPcMode ? 18 : 10

        const oWidth = width + 200
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        // Create vertical lines list
        for (let i = 0; i < totalLines; i++) {
            const points = []

            for (let j = 0; j < totalPoints; j++) {
                const point = {
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                }

                points.push(point)
            }
            linesRef.current.push(points)
        }
    }

    // Mouse handler
    const onMouseMove = (e) => {
        lastClientRef.current.x = e.clientX
        lastClientRef.current.y = e.clientY
        updateMousePosition(e.pageX, e.pageY)
    }

    // Scroll handler (updates coordinates during fast scroll)
    const onScroll = () => {
        const pageX = lastClientRef.current.x + window.scrollX
        const pageY = lastClientRef.current.y + window.scrollY
        updateMousePosition(pageX, pageY)
    }

    // Touch handler
    const onTouchMove = (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        updateMousePosition(touch.pageX, touch.pageY)
    }

    // Update mouse position
    const updateMousePosition = (pageX, pageY) => {
        const mouse = mouseRef.current
        mouse.x = pageX - containerPageXRef.current
        mouse.y = pageY - containerPageYRef.current

        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y

            mouse.set = true
        }

        // Update CSS variables
        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }
    }

    // Move points - smoother wave motion
    const movePoints = (time) => {
        const { current: lines } = linesRef
        const { current: mouse } = mouseRef
        const { current: noise } = noiseRef

        if (!noise) return

        lines.forEach((points) => {
            points.forEach((p) => {
                // Wave movement - reduced amplitude for smoother waves
                const move = noise(
                    (p.x + time * 0.008) * 0.003,  // Adjusted frequency
                    (p.y + time * 0.003) * 0.002   // Adjusted frequency
                ) * 8  // Reduced amplitude for smoother waves

                p.wave.x = Math.cos(move) * 12  // Reduced horizontal amplitude
                p.wave.y = Math.sin(move) * 6   // Reduced vertical amplitude

                // Mouse effect - smoother response
                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s

                    p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035  // Reduced influence
                    p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035  // Reduced influence
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01   // Increased restoration force
                p.cursor.vy += (0 - p.cursor.y) * 0.01   // Increased restoration force

                p.cursor.vx *= 0.95  // Increased smoothness
                p.cursor.vy *= 0.95  // Increased smoothness

                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy

                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))  // Limited deformation range
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))  // Limited deformation range
            })
        })
    }

    // Get moved point coordinates
    const moved = (point, withCursorForce = true) => {
        return {
            x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
            y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
        }
    }

    // Draw lines using Canvas path API (extremely fast GPU-accelerated drawing)
    const drawCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { width, height } = canvas
        const { current: lines } = linesRef

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Set styles
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 1

        // Draw each line on canvas
        for (let l = 0; l < lines.length; l++) {
            const points = lines[l]
            if (points.length < 2) continue

            ctx.beginPath()
            // First point
            const firstPoint = moved(points[0], false)
            ctx.moveTo(firstPoint.x, firstPoint.y)

            // Connect points with line segments
            for (let i = 1; i < points.length; i++) {
                const current = moved(points[i])
                ctx.lineTo(current.x, current.y)
            }
            ctx.stroke()
        }
    }

    // Animation logic with frame-rate throttling (low-PC friendly)
    const tick = (time) => {
        rafRef.current = requestAnimationFrame(tick)

        const now = performance.now()
        const elapsed = now - lastTimeRef.current
        const fpsInterval = 1000 / targetFps

        // Throttle frame rendering
        if (elapsed < fpsInterval) {
            return
        }

        // Adjust last frame time
        lastTimeRef.current = now - (elapsed % fpsInterval)

        const { current: mouse } = mouseRef

        // Smooth mouse movement
        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        // Mouse velocity
        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)

        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)

        // Previous mouse position
        mouse.lx = mouse.x
        mouse.ly = mouse.y

        // Mouse angle
        mouse.a = Math.atan2(dy, dx)

        // Animation
        if (containerRef.current) {
            containerRef.current.style.setProperty('--x', `${mouse.sx}px`)
            containerRef.current.style.setProperty('--y', `${mouse.sy}px`)
        }

        movePoints(time)
        drawCanvas()
    }

    return (
        <div
            ref={containerRef}
            className={`waves-component relative overflow-hidden ${className}`}
            style={{
                backgroundColor,
                position: 'absolute',
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                '--x': '-0.5rem',
                '--y': '50%',
            }}
        >
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />
            <div
                className="pointer-dot"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${pointerSize}rem`,
                    height: `${pointerSize}rem`,
                    background: strokeColor,
                    borderRadius: '50%',
                    transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
                    willChange: 'transform',
                    pointerEvents: 'none',
                }}
            />
        </div>
    )
}
