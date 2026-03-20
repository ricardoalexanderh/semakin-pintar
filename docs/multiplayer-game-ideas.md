# Multiplayer Game Ideas - Computational Thinking Focus

> Brainstorm document for new multiplayer games on Semakin Pintar.
> All games exercise computational thinking skills (pattern recognition, decomposition, logical reasoning, optimization, abstraction) without looking like programming.

---

## 1. Maze Architect (Build + Race)

### Concept
Players take turns placing path tiles on a shared grid to construct a maze. Once building is done, everyone races to solve it by tracing the shortest path from their start to their goal.

### How It Works
- Each player is secretly assigned a start and end position on the grid
- Players take turns placing wall or path tiles on the shared board
- During the build phase, you try to create shortcuts for yourself while blocking opponents
- Once the maze is complete, all players simultaneously race to trace the shortest path
- Fastest correct path wins the round

### Multiplayer Mechanics
- 2-4 players on a shared grid
- Turn-based building, then simultaneous solving
- Players can see the full maze but don't know others' start/end positions
- Optional: sabotage tiles that force detours

### Computational Thinking Skills
- **Spatial reasoning**: visualizing paths through a 2D grid
- **Optimization**: finding the shortest route among many possibilities
- **Adversarial planning**: building to benefit yourself while hindering others
- **Graph traversal**: intuitively exploring pathfinding concepts (BFS/DFS)

### Difficulty Scaling
- Easy: small grid (6x6), few walls, visible start/end
- Medium: larger grid (8x8), hidden start/end
- Hard: dynamic walls that shift between rounds, decoy paths

### Scoring
- Points based on path efficiency (shortest path vs actual path taken)
- Bonus for solving fastest
- Penalty for hitting dead ends

---

## 2. Rule Breaker (Deduction)

### Concept
One player secretly sets a hidden rule about numbers. Other players submit test numbers and see whether they pass or fail the rule. The goal is to deduce the hidden rule with the fewest tests.

### How It Works
- The "Rule Maker" picks a rule from a set (or creates one at higher difficulties)
  - Examples: "even numbers", "digits sum > 10", "multiples of 3 but not 6", "prime numbers", "contains digit 7", "between 20 and 50"
- Other players take turns submitting a number
- The system shows a checkmark (pass) or X (fail) for each submission
- At any point, a player can "buzz in" to guess the rule
- Correct guess = big points. Wrong guess = lose a life.
- If nobody guesses within the time limit, the Rule Maker scores

### Multiplayer Mechanics
- 2-8 players, rotating Rule Maker role
- Turn-based submissions with shared history visible to all
- Buzz-in race to guess the rule (reaction-based)
- Rule Maker earns points if the rule stumps everyone
- Optional: team mode (2v2, cooperative deduction)

### Computational Thinking Skills
- **Hypothesis testing**: forming and testing theories systematically
- **Logical deduction**: narrowing possibilities from evidence
- **Abstraction**: identifying the essential property from examples
- **Edge case thinking**: choosing strategic test numbers to eliminate possibilities

### Difficulty Scaling
- Easy: simple rules (even/odd, greater than X, multiples of Y)
- Medium: compound rules (even AND > 20), digit-based rules
- Hard: complex rules (prime, fibonacci member, digit sum divisible by 3)

### Scoring
- Guesser: 50 points + (remaining time x 2) for correct rule guess
- Rule Maker: 10 points per failed guess by others, 30 points if time runs out
- Penalty: -20 for incorrect rule guess

---

## 3. Chain Reaction (Cause & Effect)

### Concept
Players compete on a shared grid of numbered nodes connected to their neighbors. Each turn, a player "activates" a node, triggering a cascade through connected nodes based on simple rules. The goal is to create the longest chain or claim the most territory.

### How It Works
- A grid of hexagonal or square cells, each containing a random number (1-9)
- Cells have a capacity equal to their number of neighbors (4 for inner cells, 3 for edge, 2 for corner)
- When a player adds to a cell and it exceeds capacity, it "explodes": resets to 0 and adds +1 to all neighbors, converting them to your color
- Chain reactions happen when neighbor explosions trigger further explosions
- Game ends when one player controls all cells, or after a set number of rounds

### Multiplayer Mechanics
- 2-4 players, each assigned a color
- Turn-based: place one unit into any cell you own (or unclaimed)
- Watch chain reactions cascade across the board
- Strategy: build up cells near opponent territory for massive chains
- Optional: power-ups (shield a cell, double-charge, skip opponent's turn)

### Computational Thinking Skills
- **Systems thinking**: understanding how local actions create global effects
- **Prediction**: mentally simulating cascades before committing
- **Consequence planning**: thinking multiple steps ahead
- **Resource management**: knowing when to build up vs. trigger

### Difficulty Scaling
- Easy: small grid (4x4), simple explosion rules, visible capacity
- Medium: larger grid (6x6), hidden capacity numbers
- Hard: irregular grid shapes, special cells with unique rules

### Scoring
- Points per cell controlled at end of game
- Bonus for longest single chain reaction
- Bonus for eliminating opponent cells

---

## 4. Weight Balance (Collaborative Puzzle)

### Concept
A shared balance scale (or multi-level mobile/hanging structure) where players take turns placing number cards to keep it balanced. If the structure tips too far, the last player to place loses a life. It's algebraic thinking disguised as a physics toy.

### How It Works
- The screen shows a balance beam with positions at different distances from the center
- Each position has a "torque multiplier" (distance from pivot: x1, x2, x3)
- Players are dealt 3-4 number cards each round
- Take turns placing one card on any open position on either side
- The balance tilts in real-time based on total weight x distance on each side
- If the imbalance exceeds a threshold after your placement, you lose a life
- Round ends when all positions are filled (survivors score)

### Multiplayer Mechanics
- 2-6 players in a circle
- Turn-based card placement on shared balance
- Bluffing element: you can place strategically to force the next player into a bad position
- Optional: multi-level structure (balance within a balance) for advanced play
- Power-ups: peek at other players' cards, swap a placed card, add a position

### Computational Thinking Skills
- **Decomposition**: breaking the balance problem into left-side vs right-side totals
- **Estimation and equality**: intuitively solving balance equations (a*x = b*y)
- **Strategic planning**: choosing cards and positions to survive while threatening others
- **Algebraic reasoning**: understanding multiplication relationships (weight x distance)

### Difficulty Scaling
- Easy: simple beam with 3 positions per side (x1, x2, x3), small numbers (1-5)
- Medium: 5 positions per side, numbers 1-10, tighter imbalance threshold
- Hard: multi-level hanging mobile, numbers 1-20, very tight threshold

### Scoring
- 10 points per round survived
- Bonus for creating a perfectly balanced state (difference = 0)
- Bonus for remaining lives at game end

---

## 5. Signal & Noise (Pattern Spotting Race)

### Concept
A grid filled with numbers, shapes, or colors updates periodically. Hidden within the noise is a mathematical pattern. Players race to identify and lock in the pattern before others. Quick analysis meets pattern recognition under time pressure.

### How It Works
- A grid (6x6 or 8x8) appears filled with seemingly random numbers
- Hidden inside is a pattern occupying a row, column, diagonal, or region:
  - Arithmetic sequence (2, 5, 8, 11, 14)
  - Geometric sequence (2, 6, 18, 54)
  - Fibonacci-like (1, 1, 2, 3, 5, 8)
  - Prime numbers along a diagonal
  - All multiples of 7 in a column
  - Squares (1, 4, 9, 16, 25) in an L-shape
- Players highlight cells they think form the pattern, then submit
- First correct submission wins the round
- Grid refreshes with new noise and a new pattern each round

### Multiplayer Mechanics
- 2-8 players, simultaneous play (race format)
- Everyone sees the same grid at the same time
- "Lock in" button to submit your answer
- First correct answer wins; wrong answers have a cooldown penalty
- Optional: hint system (reveal one cell of the pattern, costs points)
- Rounds get progressively harder (more noise, subtler patterns)

### Computational Thinking Skills
- **Pattern recognition**: identifying mathematical structures in messy data
- **Abstraction**: filtering relevant data from noise (signal extraction)
- **Classification**: determining which type of pattern (arithmetic, geometric, etc.)
- **Quick analysis**: rapid mental math to verify sequences

### Difficulty Scaling
- Easy: obvious patterns (consecutive numbers in a row), small grid, highlighted region
- Medium: less obvious patterns (skip sequences, primes), medium grid, no hints
- Hard: complex patterns (fibonacci, digit-sum rules), large grid, more noise, patterns in irregular shapes

### Scoring
- First correct answer: 30 points + time bonus
- Second correct answer: 20 points
- Third correct answer: 10 points
- Wrong submission: 5-second lockout, no point penalty
- Streak bonus: consecutive correct rounds multiply score (x1.5, x2, x2.5)

---

## 6. Pathfinder Duel (Optimization Race)

### Concept
Players see the same number grid and must trace a path from one corner to the opposite corner, collecting numbers along the way. The catch: you can only move right or down. Highest sum wins. Simple to learn, but hides deep optimization strategy.

### How It Works
- A grid (5x5 to 8x8) is filled with numbers (some positive, some negative, some zero)
- All players see the same grid simultaneously
- Each player traces a path from top-left to bottom-right
- Movement restricted to right (→) or down (↓) only
- Your score = sum of all numbers on your chosen path
- After everyone submits (or timer expires), paths are revealed and compared
- Highest total wins the round

### Multiplayer Mechanics
- 2-6 players, simultaneous path-drawing
- Blind play: you don't see opponents' paths until reveal
- Multi-round tournament with cumulative scoring
- Round types:
  - **Classic**: highest sum wins
  - **Minimum**: lowest sum wins (changes optimal strategy entirely)
  - **Multiplier**: some cells have x2 or x3 multipliers on running total
  - **Hidden**: cell values are hidden (`?`) until you step on them — blind exploration
- **Blockers** (settings toggle, catch-up mechanic):
  - After round 1, the last-place player places 2 blocked cells on the grid
  - Blocked cells are impassable for all players *except* the one who placed them
  - The placer sees blocked cells as semi-transparent and can walk through freely

### Computational Thinking Skills
- **Optimization**: finding the maximum/minimum sum path (dynamic programming intuition)
- **Greedy vs. global strategy**: learning that the locally best choice isn't always globally optimal
- **Trade-off analysis**: choosing between a high-value detour vs. a shorter path
- **Adaptability**: adjusting strategy for different round types (max vs. min, hidden, blockers)
- **Risk assessment**: navigating hidden rounds where values are unknown

### Difficulty Scaling
- Easy: small grid (4x4), all positive numbers, no special cells
- Medium: larger grid (6x6), mix of positive/negative, multiplier cells
- Hard: 8x8 grid, hidden rounds, blocker cells, time pressure, minimum rounds

### Scoring
- Round winner: 30 points + (your sum - runner-up's sum)
- Perfect path bonus: 20 extra points if you found the true optimal path
- Speed bonus: 5 points if you submitted first AND your path is within top 2

---

## Technical Considerations (All Games)

### Architecture (following Brain Bomb patterns)
- **WebRTC P2P** via PeerJS for real-time multiplayer
- **Host-Guest model**: host runs game logic, guests are display clients
- **Room system**: 6-character codes + QR codes for joining
- **State sync**: host broadcasts full game state each second

### Shared Features
- 2-8 players per room (game-dependent)
- Lobby with settings configuration
- Sound effects via Web Audio API
- Mobile-first responsive design
- Progressive difficulty option
- Analytics tracking
- Theme support (consistent with platform)

### Estimated Complexity
| Game | UI Complexity | Logic Complexity | Network Complexity | Priority |
|------|--------------|------------------|--------------------|----------|
| Rule Breaker | Low | Medium | Low | High |
| Signal & Noise | Medium | Medium | Low | High |
| Pathfinder Duel | Medium | Medium | Low | High |
| Weight Balance | Medium | Medium | Medium | Medium |
| Chain Reaction | High | High | Medium | Medium |
| Maze Architect | High | High | High | Lower |
