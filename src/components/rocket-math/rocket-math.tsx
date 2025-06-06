import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { trackGameEvent, trackButtonClick } from '../../utils/analytics'
import './styles.css'

interface Pipe {
  x: number
  topHeight: number
  bottomHeight: number
  passed: boolean
  mathProblem: {
    num1: number
    num2: number
    correctAnswer: number
    wrongAnswer: number
    equation: string
    correctAnswerInTop: boolean
  }
  pathChosen?: 'top' | 'bottom' | null
}

const getGameDimensions = () => {
  const isMobile = window.innerWidth <= 768
  // More conservative margins to prevent overflow
  const widthMargin = 60 // padding + border + shadow + extra margin
  const heightMargin = 80 // padding + border + shadow + extra margin
  
  const maxWidth = Math.min(window.innerWidth - widthMargin, 600)
  const maxHeight = Math.min(window.innerHeight - heightMargin, 700)
  
  return {
    width: Math.max(300, isMobile ? maxWidth : Math.min(600, window.innerWidth - widthMargin)),
    height: Math.max(400, isMobile ? maxHeight : Math.min(700, window.innerHeight - heightMargin)),
    rocketSize: isMobile ? 24 : 30,
    rocketHeight: isMobile ? 30 : 38,
    asteroidWidth: isMobile ? 50 : 60,
    asteroidGap: isMobile ? 140 : 170,
    isMobile
  }
}

const getDifficultySettings = (difficulty: 1 | 2 | 3) => {
  switch (difficulty) {
    case 1: return { pipeSpeed: 1.5, gravity: 0.4, gapSize: 180, jumpStrength: -6, pipeDistance: 450 }
    case 2: return { pipeSpeed: 2.0, gravity: 0.5, gapSize: 150, jumpStrength: -7, pipeDistance: 300 }
    case 3: return { pipeSpeed: 2.5, gravity: 0.6, gapSize: 120, jumpStrength: -8, pipeDistance: 300 }
  }
}

let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

const createSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = type
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (error) {
    console.warn('Audio creation failed:', error)
  }
}

const playSound = (soundType: 'jump' | 'correct' | 'wrong' | 'gameOver' | 'toggle', soundEnabled: boolean) => {
  if (!soundEnabled && soundType !== 'toggle') return
  
  try {
    switch (soundType) {
      case 'jump':
        createSound(200, 0.1, 'square')
        break
      case 'correct':
        createSound(523, 0.2, 'sine') // C note
        setTimeout(() => createSound(659, 0.2, 'sine'), 100) // E note
        break
      case 'wrong':
        createSound(150, 0.3, 'triangle')
        break
      case 'gameOver':
        createSound(196, 0.5, 'square') // G note
        setTimeout(() => createSound(147, 0.5, 'square'), 200) // D note
        setTimeout(() => createSound(131, 1, 'square'), 400) // C note
        break
      case 'toggle':
        if (soundEnabled) {
          createSound(400, 0.15, 'sine')
          setTimeout(() => createSound(600, 0.15, 'sine'), 150)
        } else {
          createSound(300, 0.3, 'triangle')
        }
        break
    }
  } catch (error) {
    console.warn('Audio not supported:', error)
  }
}

const generateMathProblem = (questionType: 1 | 2 | 3) => {
  let num1: number, num2: number
  
  switch (questionType) {
    case 1:
      num1 = Math.floor(Math.random() * 9) + 1
      num2 = Math.floor(Math.random() * 9) + 1
      break
    case 2:
      num1 = Math.floor(Math.random() * 90) + 10
      num2 = Math.floor(Math.random() * 90) + 10
      break
    case 3:
      num1 = Math.floor(Math.random() * 900) + 100
      num2 = Math.floor(Math.random() * 900) + 100
      break
  }
  
  const correctAnswer = num1 + num2
  
  let wrongAnswer = correctAnswer + Math.floor(Math.random() * 20) + 1
  if (Math.random() > 0.5) {
    wrongAnswer = Math.max(1, correctAnswer - Math.floor(Math.random() * 20) - 1)
  }
  
  const equation = `${num1} + ${num2} = ?`
  
  return { num1, num2, correctAnswer, wrongAnswer, equation }
}

// Load saved settings from localStorage
const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem('rocket-math-settings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load saved settings:', error)
  }
  return {
    difficulty: 1,
    questionType: 1,
    soundEnabled: true
  }
}

// Save settings to localStorage
const saveSettings = (difficulty: number, questionType: number, soundEnabled: boolean) => {
  try {
    localStorage.setItem('rocket-math-settings', JSON.stringify({
      difficulty,
      questionType,
      soundEnabled
    }))
  } catch (error) {
    console.warn('Failed to save settings:', error)
  }
}

const RocketMath: React.FC = () => {
  const savedSettings = loadSavedSettings()
  
  const [dimensions, setDimensions] = useState(getGameDimensions())
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [showDifficultySelect, setShowDifficultySelect] = useState(true)
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(savedSettings.difficulty as 1 | 2 | 3)
  const [questionType, setQuestionType] = useState<1 | 2 | 3>(savedSettings.questionType as 1 | 2 | 3)
  const [mathScore, setMathScore] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(savedSettings.soundEnabled)
  const [canContinue, setCanContinue] = useState(true)
  
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const rocketYRef = useRef(dimensions.height / 2)
  const rocketVelocityRef = useRef(0)
  const asteroidsRef = useRef<Pipe[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rocketImageRef = useRef<HTMLImageElement | null>(null)
  const lastThrustTimeRef = useRef<number>(0)
  
  const difficultySettings = useMemo(() => getDifficultySettings(difficulty), [difficulty])

  // Load rocket SVG
  useEffect(() => {
    const loadRocketSVG = async () => {
      try {
        const response = await fetch('/rocket.svg')
        const svgText = await response.text()
        const blob = new Blob([svgText], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          rocketImageRef.current = img
          URL.revokeObjectURL(url)
        }
        img.src = url
      } catch (error) {
        console.warn('Failed to load rocket SVG:', error)
      }
    }
    
    loadRocketSVG()
  }, [])

  // Draw rocket using SVG
  const drawRocket = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    const x = dimensions.width / 2 - dimensions.rocketSize / 2
    const y = rocketYRef.current
    const width = dimensions.rocketSize
    const height = dimensions.rocketHeight || dimensions.rocketSize
    
    // Enhanced flicker effects for glow animation
    const slowFlicker = 0.8 + 0.2 * Math.sin(currentTime * 0.02) // Slow glow for rocket
    
    ctx.save()
    
    // Add rocket glow effect
    const glowIntensity = 0.3 + 0.7 * slowFlicker
    ctx.shadowColor = '#00D2FF'
    ctx.shadowBlur = 15 * glowIntensity
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Draw rocket SVG if loaded
    if (rocketImageRef.current) {
      ctx.drawImage(rocketImageRef.current, x, y, width, height)
    } else {
      // Fallback: Draw simple rocket shape
      const bodyGradient = ctx.createLinearGradient(x, y, x, y + height)
      bodyGradient.addColorStop(0, '#FF6B6B')
      bodyGradient.addColorStop(0.3, '#FF4757')
      bodyGradient.addColorStop(0.3, '#E8E8E8')
      bodyGradient.addColorStop(0.7, '#DCDDE1')
      bodyGradient.addColorStop(0.7, '#4ECDC4')
      bodyGradient.addColorStop(1, '#3DC1D3')
      
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.roundRect(x + width * 0.1, y, width * 0.8, height, [width * 0.4, width * 0.4, width * 0.1, width * 0.1])
      ctx.fill()
      
      ctx.strokeStyle = '#2C3E50'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Engine/window
      const engineSize = width * 0.4
      const engineX = x + width / 2 - engineSize / 2
      const engineY = y + height * 0.3
      
      const engineGradient = ctx.createRadialGradient(
        engineX + engineSize / 2, engineY + engineSize / 2, 0,
        engineX + engineSize / 2, engineY + engineSize / 2, engineSize / 2
      )
      engineGradient.addColorStop(0, '#00D2FF')
      engineGradient.addColorStop(1, '#0078FF')
      
      ctx.fillStyle = engineGradient
      ctx.beginPath()
      ctx.arc(engineX + engineSize / 2, engineY + engineSize / 2, engineSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }, [dimensions])

  const drawAsteroid = useCallback((ctx: CanvasRenderingContext2D, asteroid: Pipe, currentQuestionType: number) => {
    const { x, topHeight, bottomHeight, mathProblem } = asteroid
    const currentGapSize = difficultySettings.gapSize
    const correctAnswerInTop = mathProblem.correctAnswerInTop
    
    // Enhanced space-themed pipe design
    const pipeGradient = ctx.createLinearGradient(x, 0, x + dimensions.asteroidWidth, 0)
    pipeGradient.addColorStop(0, '#706fd3')
    pipeGradient.addColorStop(0.5, '#474787')
    pipeGradient.addColorStop(1, '#5352ed')
    
    // Top pipe with space theme
    ctx.fillStyle = pipeGradient
    ctx.fillRect(x, 0, dimensions.asteroidWidth, topHeight)
    ctx.strokeStyle = '#3742fa'
    ctx.lineWidth = 2
    ctx.strokeRect(x, 0, dimensions.asteroidWidth, topHeight)
    
    // Bottom pipe
    ctx.fillRect(x, dimensions.height - bottomHeight, dimensions.asteroidWidth, bottomHeight)
    ctx.strokeRect(x, dimensions.height - bottomHeight, dimensions.asteroidWidth, bottomHeight)
    
    // Middle separator with danger colors
    const separatorGradient = ctx.createLinearGradient(x, 0, x + dimensions.asteroidWidth, 0)
    separatorGradient.addColorStop(0, '#ff6b6b')
    separatorGradient.addColorStop(0.5, '#c44569')
    separatorGradient.addColorStop(1, '#ff3838')
    ctx.fillStyle = separatorGradient
    ctx.fillRect(x, topHeight + currentGapSize, dimensions.asteroidWidth, 40)
    ctx.strokeStyle = '#ff3838'
    ctx.strokeRect(x, topHeight + currentGapSize, dimensions.asteroidWidth, 40)
    
    // Draw answer gaps with enhanced colors and glow
    const topGapColor = asteroid.pathChosen === 'top' 
      ? (correctAnswerInTop ? '#4CAF50' : '#F44336') 
      : 'rgba(0, 210, 255, 0.3)'
    const bottomGapColor = asteroid.pathChosen === 'bottom' 
      ? (!correctAnswerInTop ? '#4CAF50' : '#F44336') 
      : 'rgba(0, 210, 255, 0.3)'
    
    // Top gap with glow effect
    ctx.fillStyle = topGapColor
    ctx.fillRect(x, topHeight, dimensions.asteroidWidth, currentGapSize)
    ctx.strokeStyle = '#00D2FF'
    ctx.lineWidth = 2
    ctx.strokeRect(x, topHeight, dimensions.asteroidWidth, currentGapSize)
    
    // Bottom gap with glow effect
    ctx.fillStyle = bottomGapColor
    ctx.fillRect(x, topHeight + currentGapSize + 40, dimensions.asteroidWidth, currentGapSize)
    ctx.strokeRect(x, topHeight + currentGapSize + 40, dimensions.asteroidWidth, currentGapSize)
    
    // Enhanced text rendering with better mobile support and question type scaling
    const equationFontSize = dimensions.isMobile ? 16 : 18
    const answerFontSize = dimensions.isMobile ? 22 : 24
    
    // Determine equation box size based on question type (more digits = bigger box)
    const getQuestionBoxSize = () => {
      const baseWidth = dimensions.asteroidWidth + 20
      const baseHeight = 30
      
      // Scale box size based on question type difficulty
      const scaleFactor = 1 + (currentQuestionType - 1) * 0.3 // 1x, 1.3x, 1.6x for types 1, 2, 3
      
      return {
        width: baseWidth * scaleFactor,
        height: baseHeight + (currentQuestionType - 1) * 5 // Add 5px height per level
      }
    }
    
    const boxSize = getQuestionBoxSize()
    
    // Math equation above with background and glow
    ctx.save()
    ctx.fillStyle = 'rgba(0, 15, 35, 0.95)'
    const eqX = x + dimensions.asteroidWidth / 2
    const eqY = Math.max(25, topHeight - 15)
    const eqWidth = boxSize.width
    const eqHeight = boxSize.height
    
    // Draw equation background
    ctx.fillRect(eqX - eqWidth/2, eqY - eqHeight/2, eqWidth, eqHeight)
    ctx.strokeStyle = '#00D2FF'
    ctx.lineWidth = 2
    ctx.strokeRect(eqX - eqWidth/2, eqY - eqHeight/2, eqWidth, eqHeight)
    
    // Draw equation text with glow
    ctx.fillStyle = '#00D2FF'
    ctx.font = `bold ${equationFontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#00D2FF'
    ctx.shadowBlur = 5
    ctx.fillText(mathProblem.equation, eqX, eqY)
    ctx.restore()
    
    // Top answer with enhanced styling
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${answerFontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 3
    ctx.fillText(
      (correctAnswerInTop ? mathProblem.correctAnswer : mathProblem.wrongAnswer).toString(),
      x + dimensions.asteroidWidth / 2,
      topHeight + currentGapSize / 2
    )
    ctx.restore()
    
    // Bottom answer with enhanced styling
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${answerFontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 3
    ctx.fillText(
      (!correctAnswerInTop ? mathProblem.correctAnswer : mathProblem.wrongAnswer).toString(),
      x + dimensions.asteroidWidth / 2,
      topHeight + currentGapSize + 40 + currentGapSize / 2
    )
    ctx.restore()
  }, [dimensions, difficultySettings])

  const drawGame = useCallback((currentTime: number) => {
    if (!ctxRef.current) return
    
    const ctx = ctxRef.current
    
    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)
    
    // Draw deep space background gradient (matching original design)
    const gradient = ctx.createRadialGradient(
      dimensions.width / 2, dimensions.height / 2, 0,
      dimensions.width / 2, dimensions.height / 2, Math.max(dimensions.width, dimensions.height)
    )
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f0f23')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    
    // Draw twinkling stars with different sizes and brightness
    const time = currentTime * 0.001
    for (let i = 0; i < 80; i++) {
      const x = (i * 123 + time * 10) % dimensions.width
      const y = (i * 456) % dimensions.height
      const twinkle = 0.3 + 0.7 * Math.sin(time * 2 + i)
      const size = 1 + (i % 3)
      
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`
      if (size === 1) {
        ctx.fillRect(x, y, 1, 1)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Draw distant planets/nebula
    ctx.save()
    const planetGradient = ctx.createRadialGradient(
      dimensions.width * 0.8, dimensions.height * 0.2, 0,
      dimensions.width * 0.8, dimensions.height * 0.2, 30
    )
    planetGradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)')
    planetGradient.addColorStop(1, 'rgba(138, 43, 226, 0)')
    ctx.fillStyle = planetGradient
    ctx.beginPath()
    ctx.arc(dimensions.width * 0.8, dimensions.height * 0.2, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    // Draw asteroids
    asteroidsRef.current.forEach(asteroid => {
      drawAsteroid(ctx, asteroid, questionType)
    })
    
    // Draw rocket with current time for animation
    drawRocket(ctx, currentTime)
  }, [dimensions, drawRocket, drawAsteroid, questionType])

  const thrust = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
    }
    if (!gameOver) {
      rocketVelocityRef.current = difficultySettings.jumpStrength
      lastThrustTimeRef.current = Date.now()
      playSound('jump', soundEnabled)
    }
  }, [gameStarted, gameOver, soundEnabled, difficultySettings.jumpStrength])

  const resetGame = useCallback(() => {
    const newDimensions = getGameDimensions()
    setDimensions(newDimensions)
    rocketYRef.current = newDimensions.height / 2
    rocketVelocityRef.current = 0
    asteroidsRef.current = []
    setScore(0)
    setMathScore(0)
    setGameStarted(false)
    setGameOver(false)
    setCanContinue(true)
    setLastAnswerCorrect(null)
    setShowDifficultySelect(true)
    
    // Initialize canvas
    if (canvasRef.current) {
      canvasRef.current.width = newDimensions.width
      canvasRef.current.height = newDimensions.height
      ctxRef.current = canvasRef.current.getContext('2d')
    }
    
    // Track game restart
    trackGameEvent('rocket-math', 'restart', {
      difficulty,
      questionType,
      soundEnabled
    })
  }, [difficulty, questionType, soundEnabled])

  useEffect(() => {
    const handleResize = () => {
      if (!gameStarted) {
        const newDimensions = getGameDimensions()
        setDimensions(newDimensions)
        rocketYRef.current = newDimensions.height / 2
        
        // Resize canvas
        if (canvasRef.current) {
          canvasRef.current.width = newDimensions.width
          canvasRef.current.height = newDimensions.height
          ctxRef.current = canvasRef.current.getContext('2d')
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [gameStarted])

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = dimensions.width
      canvasRef.current.height = dimensions.height
      ctxRef.current = canvasRef.current.getContext('2d')
    }
  }, [dimensions.width, dimensions.height])

  useEffect(() => {
    let touchTimeout: number | null = null
    
    const handleTouch = (e: Event) => {
      const touchEvent = e as TouchEvent
      if (showDifficultySelect) return
      
      touchEvent.preventDefault()
      touchEvent.stopPropagation()
      
      if (touchTimeout) {
        clearTimeout(touchTimeout)
      }
      
      touchTimeout = setTimeout(() => {
        if (gameOver && canContinue) {
          resetGame()
        } else if (!gameOver) {
          thrust()
        }
        touchTimeout = null
      }, 0)
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouch, { passive: false })
      return () => {
        canvas.removeEventListener('touchstart', handleTouch)
        if (touchTimeout) {
          clearTimeout(touchTimeout)
        }
      }
    }
  }, [thrust, gameOver, resetGame, showDifficultySelect, canContinue])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showDifficultySelect) return
      
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameOver && canContinue) {
          resetGame()
        } else if (!gameOver) {
          thrust()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [thrust, gameOver, resetGame, showDifficultySelect, canContinue])

  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastTimeRef.current >= 16) {
        // Update rocket position directly
        rocketYRef.current += rocketVelocityRef.current
        rocketVelocityRef.current += difficultySettings.gravity

        // Update asteroids directly without creating new objects
        asteroidsRef.current.forEach(asteroid => {
          asteroid.x -= difficultySettings.pipeSpeed
        })
        asteroidsRef.current = asteroidsRef.current.filter(asteroid => asteroid.x > -dimensions.asteroidWidth)

        if (asteroidsRef.current.length === 0 || asteroidsRef.current[asteroidsRef.current.length - 1].x < dimensions.width - difficultySettings.pipeDistance) {
          const mathProblem = generateMathProblem(questionType)
          const gapSize = difficultySettings.gapSize
          const separatorHeight = 40
          const totalGapHeight = gapSize * 2 + separatorHeight
          const topGapStart = Math.random() * (dimensions.height - totalGapHeight - 120) + 60
          
          const correctAnswerInTop = Math.random() > 0.5
          const pipeWithAnswers = {
            ...mathProblem,
            correctAnswerInTop
          }
          
          asteroidsRef.current.push({
            x: dimensions.width,
            topHeight: topGapStart,
            bottomHeight: dimensions.height - (topGapStart + totalGapHeight),
            passed: false,
            mathProblem: pipeWithAnswers,
            pathChosen: null
          })
        }

        asteroidsRef.current.forEach(asteroid => {
          const rocketCenterX = dimensions.width / 2
          const rocketCenterY = rocketYRef.current + dimensions.rocketSize / 2
          
          if (!asteroid.passed && asteroid.x + dimensions.asteroidWidth < rocketCenterX) {
            asteroid.passed = true
            setScore(prev => prev + 1)
            
            const currentGapSize = difficultySettings.gapSize
            
            if (rocketCenterY < asteroid.topHeight + currentGapSize) {
              asteroid.pathChosen = 'top'
              const isCorrect = asteroid.mathProblem.correctAnswerInTop
              setLastAnswerCorrect(isCorrect)
              playSound(isCorrect ? 'correct' : 'wrong', soundEnabled)
              if (isCorrect) setMathScore(prev => prev + 1)
            } else {
              asteroid.pathChosen = 'bottom'
              const isCorrect = !asteroid.mathProblem.correctAnswerInTop
              setLastAnswerCorrect(isCorrect)
              playSound(isCorrect ? 'correct' : 'wrong', soundEnabled)
              if (isCorrect) setMathScore(prev => prev + 1)
            }
            
            setTimeout(() => setLastAnswerCorrect(null), 1000)
          }
        })

        // Draw the game with current time for animations
        drawGame(currentTime)
        
        lastTimeRef.current = currentTime
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [gameStarted, gameOver, dimensions, difficulty, questionType, soundEnabled, difficultySettings, drawGame])


  useEffect(() => {
    if (!gameStarted || gameOver) return

    const checkCollisions = () => {
      if (rocketYRef.current < 0 || rocketYRef.current > dimensions.height - (dimensions.rocketHeight || dimensions.rocketSize)) {
        setGameOver(true)
        setCanContinue(false)
        playSound('gameOver', soundEnabled)
        
        // Enable continue after 2 seconds
        setTimeout(() => {
          setCanContinue(true)
        }, 2000)
        
        // Track game over
        trackGameEvent('rocket-math', 'complete', {
          score,
          mathScore,
          difficulty,
          questionType
        })
        return
      }

      asteroidsRef.current.forEach(asteroid => {
        const rocketLeft = dimensions.width / 2 - dimensions.rocketSize / 2
        const rocketRight = dimensions.width / 2 + dimensions.rocketSize / 2
        const rocketTop = rocketYRef.current
        const rocketBottom = rocketYRef.current + dimensions.rocketSize

        if (rocketRight > asteroid.x && rocketLeft < asteroid.x + dimensions.asteroidWidth) {
          const currentGapSize = getDifficultySettings(difficulty).gapSize
          const topGapStart = asteroid.topHeight
          const topGapEnd = asteroid.topHeight + currentGapSize
          const bottomGapStart = asteroid.topHeight + currentGapSize + 40
          const bottomGapEnd = dimensions.height - asteroid.bottomHeight
          
          const inTopGap = rocketTop >= topGapStart && rocketBottom <= topGapEnd
          const inBottomGap = rocketTop >= bottomGapStart && rocketBottom <= bottomGapEnd
          
          if (!inTopGap && !inBottomGap) {
            setGameOver(true)
            setCanContinue(false)
            playSound('gameOver', soundEnabled)
            
            // Enable continue after 2 seconds
            setTimeout(() => {
              setCanContinue(true)
            }, 2000)
            
            // Track collision game over
            trackGameEvent('rocket-math', 'complete', {
              score,
              mathScore,
              difficulty,
              questionType
            })
          }
        }
      })
    }

    const collisionInterval = setInterval(checkCollisions, 16)
    return () => clearInterval(collisionInterval)
  }, [gameStarted, gameOver, dimensions, difficulty, soundEnabled, score, mathScore, questionType])

  return (
    <div className="game-container" onClick={showDifficultySelect ? undefined : (gameOver && canContinue ? resetGame : (!gameOver ? thrust : undefined))}>
      <div className="game-canvas" style={{ width: dimensions.width, height: dimensions.height }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ display: 'block' }}
        />

        {showDifficultySelect && <div className="game-title">ROCKET MATH</div>}
        {!showDifficultySelect && (
          <div className="score-container">
            <div className="score">Asteroids: {score}</div>
            <div className="math-score">Problems: {mathScore}</div>
          </div>
        )}
        
        {showDifficultySelect && (
          <div className="difficulty-select">
            
            <div className="selection-group">
              <div className="selection-label">Game Speed:</div>
              <div className="button-group">
                {([1, 2, 3] as const).map(level => (
                  <button
                    key={level}
                    className={`difficulty-btn ${difficulty === level ? 'selected' : ''}`}
                    onClick={() => {
                      setDifficulty(level)
                      saveSettings(level, questionType, soundEnabled)
                      trackButtonClick(`difficulty-${level}`, 'rocket-math-settings')
                    }}
                    onTouchStart={() => {
                      setDifficulty(level)
                      saveSettings(level, questionType, soundEnabled)
                      trackButtonClick(`difficulty-${level}`, 'rocket-math-settings')
                    }}
                  >
                    {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="selection-group">
              <div className="selection-label">Question Type:</div>
              <div className="button-group">
                {([1, 2, 3] as const).map(type => (
                  <button
                    key={type}
                    className={`question-btn ${questionType === type ? 'selected' : ''}`}
                    onClick={() => {
                      setQuestionType(type)
                      saveSettings(difficulty, type, soundEnabled)
                      trackButtonClick(`question-type-${type}`, 'rocket-math-settings')
                    }}
                    onTouchStart={() => {
                      setQuestionType(type)
                      saveSettings(difficulty, type, soundEnabled)
                      trackButtonClick(`question-type-${type}`, 'rocket-math-settings')
                    }}
                  >
                    {type === 1 ? '1 + 1 digit' : type === 2 ? '2 + 2 digits' : '3 + 3 digits'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="selection-group">
              <div className="selection-label">Sound Effects:</div>
              <div className="button-group">
                <button
                  className={`sound-btn ${soundEnabled ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const newSoundState = !soundEnabled
                    setSoundEnabled(newSoundState)
                    saveSettings(difficulty, questionType, newSoundState)
                    playSound('toggle', newSoundState)
                    trackButtonClick(`sound-${newSoundState ? 'on' : 'off'}`, 'rocket-math-settings')
                  }}
                >
                  {soundEnabled ? '🔊 ON' : '🔇 OFF'}
                </button>
              </div>
            </div>
            
            <button 
              className="start-game-btn"
              onClick={() => {
                setShowDifficultySelect(false)
                trackButtonClick('start-game', 'rocket-math-settings')
                trackGameEvent('rocket-math', 'start', {
                  difficulty,
                  questionType,
                  soundEnabled
                })
              }}
              onTouchStart={() => {
                setShowDifficultySelect(false)
                trackButtonClick('start-game', 'rocket-math-settings')
                trackGameEvent('rocket-math', 'start', {
                  difficulty,
                  questionType,
                  soundEnabled
                })
              }}
            >
              Start Game
            </button>
          </div>
        )}
        
        {!gameStarted && !showDifficultySelect && (
          <div className="start-message">
            <div className="game-subtitle">Space Math Adventure!</div>
            <div>{dimensions.isMobile ? 'Tap to start' : 'Click or press SPACE to start'}</div>
          </div>
        )}
        
        {gameOver && (
          <div className="game-over">
            <div>Game Over!</div>
            <div>Asteroids Passed: {score}</div>
            <div>Problems Solved: {mathScore}</div>
            {canContinue ? (
              <div>{dimensions.isMobile ? 'Tap to restart' : 'Click or press SPACE to restart'}</div>
            ) : (
              <div>Please wait...</div>
            )}
          </div>
        )}
        
        {lastAnswerCorrect !== null && (
          <div className={`answer-feedback ${lastAnswerCorrect ? 'correct-feedback' : 'wrong-feedback'}`}>
            {lastAnswerCorrect ? '✓ Correct!' : '✗ Wrong!'}
          </div>
        )}
        
      </div>
    </div>
  )
}

export default RocketMath