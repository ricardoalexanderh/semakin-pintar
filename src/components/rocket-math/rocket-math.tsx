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
  const maxWidth = Math.min(window.innerWidth - 20, 600) // Bigger game box
  const maxHeight = Math.min(window.innerHeight - 40, 700) // Taller game box
  
  return {
    width: isMobile ? maxWidth : 600, // Increased from 400 to 600
    height: isMobile ? maxHeight : 700, // Increased from 600 to 700
    rocketSize: isMobile ? 24 : 30, // Bigger rocket
    rocketHeight: isMobile ? 30 : 38, // Bigger rocket
    asteroidWidth: isMobile ? 50 : 60, // Bigger asteroids
    asteroidGap: isMobile ? 140 : 170, // Bigger gaps
    isMobile
  }
}

const getDifficultySettings = (difficulty: 1 | 2 | 3) => {
  switch (difficulty) {
    case 1: return { pipeSpeed: 1.5, gravity: 0.4, gapSize: 180, jumpStrength: -6 }
    case 2: return { pipeSpeed: 2.0, gravity: 0.5, gapSize: 150, jumpStrength: -7 }
    case 3: return { pipeSpeed: 2.5, gravity: 0.6, gapSize: 120, jumpStrength: -8 }
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

const RocketMath: React.FC = () => {
  const [dimensions, setDimensions] = useState(getGameDimensions())
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)
  const [showDifficultySelect, setShowDifficultySelect] = useState(true)
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [questionType, setQuestionType] = useState<1 | 2 | 3>(1)
  const [mathScore, setMathScore] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [, forceRender] = useState({})
  
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const rocketYRef = useRef(dimensions.height / 2)
  const rocketVelocityRef = useRef(0)
  const asteroidsRef = useRef<Pipe[]>([])
  const rocketElementRef = useRef<HTMLDivElement>(null)
  const gameCanvasRef = useRef<HTMLDivElement>(null)
  
  const difficultySettings = useMemo(() => getDifficultySettings(difficulty), [difficulty])

  const thrust = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true)
    }
    if (!gameOver) {
      rocketVelocityRef.current = difficultySettings.jumpStrength
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
    setLastAnswerCorrect(null)
    setShowDifficultySelect(true)
    
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
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [gameStarted])

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
        if (gameOver) {
          resetGame()
        } else {
          thrust()
        }
        touchTimeout = null
      }, 0)
    }

    const gameCanvas = document.querySelector('.game-canvas')
    if (gameCanvas) {
      gameCanvas.addEventListener('touchstart', handleTouch, { passive: false })
      return () => {
        gameCanvas.removeEventListener('touchstart', handleTouch)
        if (touchTimeout) {
          clearTimeout(touchTimeout)
        }
      }
    }
  }, [thrust, gameOver, resetGame, showDifficultySelect])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showDifficultySelect) return
      
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameOver) {
          resetGame()
        } else {
          thrust()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [thrust, gameOver, resetGame, showDifficultySelect])

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

        // Update rocket DOM element directly using transform
        if (rocketElementRef.current) {
          rocketElementRef.current.style.transform = `translateY(${rocketYRef.current}px)`
        }

        // Update asteroids directly without creating new objects
        asteroidsRef.current.forEach(asteroid => {
          asteroid.x -= difficultySettings.pipeSpeed
        })
        asteroidsRef.current = asteroidsRef.current.filter(asteroid => asteroid.x > -dimensions.asteroidWidth)

        if (asteroidsRef.current.length === 0 || asteroidsRef.current[asteroidsRef.current.length - 1].x < dimensions.width - 300) {
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

        // Force re-render of asteroids every few frames to update positions
        if (Math.floor(currentTime / 16) % 3 === 0) {
          forceRender({})
        }
        
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
  }, [gameStarted, gameOver, dimensions, difficulty, questionType, soundEnabled, difficultySettings])


  useEffect(() => {
    if (!gameStarted || gameOver) return

    const checkCollisions = () => {
      if (rocketYRef.current < 0 || rocketYRef.current > dimensions.height - (dimensions.rocketHeight || dimensions.rocketSize)) {
        setGameOver(true)
        playSound('gameOver', soundEnabled)
        
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
            playSound('gameOver', soundEnabled)
            
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
    <div className="game-container" onClick={showDifficultySelect ? undefined : (gameOver ? resetGame : thrust)}>
      <div 
        ref={gameCanvasRef}
        className="game-canvas"
        style={{
          width: dimensions.width,
          height: dimensions.height
        }}
      >
        <div 
          ref={rocketElementRef}
          className="bird" 
          style={{
            top: 0,
            left: dimensions.width / 2 - dimensions.rocketSize / 2,
            width: dimensions.rocketSize,
            height: dimensions.rocketHeight || dimensions.rocketSize,
            transform: `translateY(${rocketYRef.current}px)`,
            willChange: 'transform'
          }}
        />
        
        {asteroidsRef.current.map((asteroid, index) => {
          const correctAnswerInTop = asteroid.mathProblem.correctAnswerInTop
          const currentGapSize = difficultySettings.gapSize
          return (
            <div 
              key={`asteroid-${index}-${Math.floor(asteroid.x / 50)}`}
              style={{
                position: 'absolute',
                transform: `translateX(${asteroid.x}px)`,
                willChange: 'transform'
              }}
            >
              {/* Math equation above pipe */}
              <div 
                className="math-equation-display"
                style={{
                  left: -30,
                  top: Math.max(10, asteroid.topHeight - 60),
                  width: dimensions.asteroidWidth + 60
                }}
              >
                {asteroid.mathProblem.equation}
              </div>
              
              {/* Top pipe section */}
              <div 
                className="pipe pipe-top"
                style={{
                  left: 0,
                  height: asteroid.topHeight,
                  width: dimensions.asteroidWidth
                }}
              />
              
              {/* Top gap with answer */}
              <div 
                className={`answer-gap top-gap ${asteroid.pathChosen === 'top' ? (correctAnswerInTop ? 'correct' : 'wrong') : ''}`}
                style={{
                  left: 0,
                  top: asteroid.topHeight,
                  width: dimensions.asteroidWidth,
                  height: currentGapSize
                }}
              >
                {correctAnswerInTop ? asteroid.mathProblem.correctAnswer : asteroid.mathProblem.wrongAnswer}
              </div>
              
              {/* Middle pipe section */}
              <div 
                className="pipe pipe-middle"
                style={{
                  left: 0,
                  top: asteroid.topHeight + currentGapSize,
                  width: dimensions.asteroidWidth,
                  height: 40
                }}
              />
              
              {/* Bottom gap with answer */}
              <div 
                className={`answer-gap bottom-gap ${asteroid.pathChosen === 'bottom' ? (!correctAnswerInTop ? 'correct' : 'wrong') : ''}`}
                style={{
                  left: 0,
                  top: asteroid.topHeight + currentGapSize + 40,
                  width: dimensions.asteroidWidth,
                  height: currentGapSize
                }}
              >
                {!correctAnswerInTop ? asteroid.mathProblem.correctAnswer : asteroid.mathProblem.wrongAnswer}
              </div>
              
              {/* Bottom pipe section */}
              <div 
                className="pipe pipe-bottom"
                style={{
                  left: 0,
                  top: dimensions.height - asteroid.bottomHeight,
                  height: asteroid.bottomHeight,
                  width: dimensions.asteroidWidth
                }}
              />
            </div>
          )
        })}

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
                      trackButtonClick(`difficulty-${level}`, 'rocket-math-settings')
                    }}
                    onTouchStart={() => {
                      setDifficulty(level)
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
                      trackButtonClick(`question-type-${type}`, 'rocket-math-settings')
                    }}
                    onTouchStart={() => {
                      setQuestionType(type)
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
            <div>{dimensions.isMobile ? 'Tap to restart' : 'Click or press SPACE to restart'}</div>
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