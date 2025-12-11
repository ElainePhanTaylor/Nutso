# 🐿️ NUTSO — Game Scope Document

## Overview

**Title:** Nutso  
**Genre:** Physics-based trajectory/puzzle game  
**Platform:** Web (desktop & mobile browsers)  
**Target Audience:** Casual players, ages 5+, familiar with Angry Birds-style games

### Elevator Pitch
A squirrel launches nuts into baskets using slingshot mechanics. Nuts wrap around the screen when they go off-edge, adding a unique twist to classic trajectory gameplay. Simple enough for a 5-year-old, satisfying enough for anyone.

---

## Core Gameplay

### The Loop
1. Player aims by pulling back (slingshot style)
2. Trajectory preview shows projected path
3. Release to launch the nut
4. Nut travels, affected by gravity and friction
5. Nut can wrap around left/right screen edges
6. Nut can bounce off obstacles (branches, birds)
7. Nut eventually slows down and stops due to friction
8. Success = nut lands in basket, Fail = nut stops elsewhere
9. Repeat until all 20 shots are used

### Screen Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                         🧺      │
│                  [obstacles]           Basket   │
│                                        (RIGHT)  │
│                                                 │
│                                    🧺 (lvl 10+) │
│                                                 │
│   🐿️                                           │
│  Squirrel (BOTTOM LEFT)                        │
│═══════════════════════════════════════════════│
└─────────────────────────────────────────────────┘
```

- **Squirrel:** Fixed position at BOTTOM LEFT of screen
- **Basket:** Positioned on the RIGHT side (location varies by level)
- **Basket tilt:** 35° tilt toward player (opening faces the squirrel)
- **Multiple baskets:** Levels 10+ may have 2+ baskets (random placement)
- **Multiple basket scoring:** Must hit ALL baskets to score +1 point
- **Obstacles:** Placed between squirrel and basket(s)

### Key Mechanics

| Mechanic | Description |
|----------|-------------|
| **Slingshot Aiming** | Player clicks/taps on squirrel and drags backward (opposite of throw direction). Farther pull = more power. Angle of pull = launch angle. Release to fire. Exactly like Angry Birds. |
| **Trajectory Preview** | Dotted line shows predicted arc from squirrel in throw direction |
| **Screen Wrap** | Nuts exiting left/right edges re-enter from the opposite side |
| **Ground** | Solid ground at bottom (like Angry Birds) – nut stops here |
| **Gravity** | Constant downward force affects nut trajectory |
| **Friction** | Nut gradually slows down until it stops completely |
| **One Shot Per Turn** | Player waits for nut to stop before next throw |

### Aiming Controls (Detailed)

```
        🧺 Basket
         
                    ·
                  ·
                ·  ← trajectory preview (dotted line)
              ·
            ·
          🥜
         /
        / ← drag line
       /
      ● ← player drags HERE (behind squirrel)
     
    🐿️ Squirrel
    
   [===Ground===]
```

**How it works:**
1. Player clicks/taps and holds on the squirrel (or near it)
2. Player drags cursor/finger **backward** (away from target)
3. Trajectory preview appears showing where nut will go
4. **Pull distance** = launch power (capped at max)
5. **Pull angle** = launch direction (opposite of drag)
6. Player releases to launch the nut
7. Nut flies in the **opposite direction** of the pull

**Constraints:**
- Maximum pull distance (prevents infinite power)
- Visual feedback: slingshot band stretches, squirrel leans back
- Cancel shot by dragging back to squirrel and releasing

**Trajectory Preview:**
- Dotted line shows predicted path
- Shows approximately 50% across the screen (like Angry Birds)
- Helps player aim without giving away the full solution

### Nut Physics

- **Shape:** Perfectly round ball (even weight distribution)
- **Spin:** Nut visually spins while flying (cosmetic effect)
- **Bounce:** Consistent, predictable bounces (like a ball, no wobble)
- **Gravity:** Pulls nut downward constantly
- **Friction:** Gradually slows the nut until it stops
- **On Score:** Nut EXPLODES with satisfying visual effect when landing in basket

### Obstacles

| Obstacle | Behavior | Purpose |
|----------|----------|---------|
| **Branches** | Static (don't move) | Horizontal platforms for nut to bounce off |
| **Birds** | Moving (patrol pattern) | Dynamic obstacles – can help or block shots |

**Branch Details:**
- Horizontal orientation
- Nut bounces off predictably
- Some levels *require* bouncing off branches to reach the basket
- Can be placed at various heights

**Bird Details:**
- Move in patterns (back and forth, circular, etc.)
- Nut bounces off birds
- Adds timing challenge to shots
- Kid-friendly design (cute, not scary)

---

### 🦉 BOSS BATTLES: THE PHANTOM OWL

**Boss Levels:** Every 10th level (10, 20, 30, 40, 50, 60, 70, 80, 90, 100)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                       👻🦉 ← PHANTOM OWL        │
│                      ╱ ○ ╲   (transparent!)     │
│                     │BELLY│ ← HIT HERE!         │
│                      ╲   ╱                      │
│                                                 │
│   🐿️🥜 ─ ─ ─ ─ ─ ─ ─ → ?                       │
│  (you)                                          │
│═══════════════════════════════════════════════│
└─────────────────────────────────────────────────┘
```

**The Phantom Owl:**
- **Ghostly/transparent** – ethereal, not fully visible
- **Spooky but kid-friendly** – mysterious, not scary
- **Otherworldly presence** – glowing edges, wispy effects
- **Haunts the forest** – lore: a spectral owl that guards the woods

**Boss Mechanics:**
| Aspect | Details |
|--------|---------|
| **Appearance** | Semi-transparent ghostly owl, glowing eyes |
| **Target** | Hit the BELLY to score |
| **Passing Score** | 15 belly hits (out of 20 shots) |
| **No Basket** | Boss replaces the basket for these levels |

### 💣 Owl's Bomb Attack

The Phantom Owl fights back by throwing bombs!

```
                    🦉 ← Owl throws bombs
                   💣
                  ↓
              💥 BOOM! ← Explosion pushes nut away
                  
   🐿️🥜 ─ ─ ─ → 💨 ← Nut trajectory disrupted!
```

**Bomb Behavior:**
| Aspect | Details |
|--------|---------|
| **Throws bombs** | Owl periodically drops/throws bombs toward squirrel |
| **Explosion** | Bombs explode on impact or after timer |
| **Blast radius** | Explosion creates a shockwave |
| **Nut interaction** | Shockwave PUSHES the nut away (affects trajectory) |
| **Timing required** | Player must wait for gap between bombs to shoot |

**Strategy:**
- Watch the bomb pattern
- Wait for explosion to clear
- Time your shot in the gap before next bomb
- Adds skill/timing layer beyond just aiming

**Bomb Progression by Boss Level:**
| Boss Level | Bomb Difficulty |
|------------|-----------------|
| 10 | Slow bombs, long gaps between throws |
| 20 | Slightly faster |
| 30 | More frequent bombs |
| 40 | Larger blast radius |
| 50 | Faster bombs + owl movement |
| 60+ | Increasingly challenging timing |
| 100 | Rapid-fire bombs, tight windows |

**Visual/Audio:**
- Bomb: Glowing ghostly orb (matches owl's ethereal style)
- Warning: Brief flash before owl throws
- Explosion: Spectral burst effect
- Sound: Ghostly "whoosh" on throw, ethereal "boom" on explode

**Visual Style:**
- 50-70% opacity (see-through but visible)
- Soft glow/aura around the owl
- Wispy, smoky edges (like a ghost)
- Piercing glowing eyes (yellow/white)
- Fades in/out slightly as it moves
- Maybe leaves a faint trail when moving

**Boss Progression (suggested):**
| Boss Level | Difficulty | Owl Behavior |
|------------|------------|--------------|
| 10 | Easy | Stationary, more visible (70% opacity) |
| 20 | Medium | Slow floating movement |
| 30 | Medium | Faster movement |
| 40 | Hard | More transparent (50% opacity) |
| 50 | Hard | Moves + obstacles blocking view |
| 60 | Harder | Moves up/down, phases in and out |
| 70 | Harder | Faster + more transparent |
| 80 | Expert | Erratic floating pattern |
| 90 | Expert | Brief invisibility phases |
| 100 | **FINAL** | All mechanics, most ghostly |

**Visual Feedback:**
- Owl flickers/solidifies briefly when hit
- Owl's eyes glow brighter when taunting
- Ghostly "hooting" visual effects on miss
- Screen gets slightly darker/moodier during boss fights

**Defeat Animation: TORNADO BANISHMENT 🌪️**
- When owl is defeated, a tornado spawns
- Tornado picks up the Phantom Owl
- Owl spins and gets blown away into the sky
- Dramatic, satisfying victory moment
- Screen brightens as the owl disappears

---

## Scoring System

- **Nuts per round:** 20 maximum
- **Score range:** 0–20 per round
- **Scoring:** +1 point for each successful basket
- **Passing score:** 10/20 (50%) to complete a level
- **Time limit:** 10 minutes per level

### Star Rating
| Stars | Requirement |
|-------|-------------|
| ⭐ | 10/20 (pass) |
| ⭐⭐ | 15/20 |
| ⭐⭐⭐ | 20/20 (perfect) |

### Difficulty Settings (Basket Size)

| Difficulty | Basket Size | Description |
|------------|-------------|-------------|
| **Easy** | 10× nut size | Large target, forgiving |
| **Medium** | 5× nut size | Balanced challenge |
| **Hard** | 3× nut size | Precision required |

*Difficulty is set in main menu and applies to all levels*

---

## Levels & Progression

- **Total Levels:** 100 (for initial release)
- **Structure:** Levels unlock sequentially
- **Shots per level:** 20

### Tutorial Levels (1-3)

**Level 1: Basic Aiming**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🐿️ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ → 🧺     │
│                                                 │
│           (clear path, no obstacles)            │
│                                                 │
│═══════════════════════════════════════════════│
└─────────────────────────────────────────────────┘
```
- **Teaches:** Pull back to aim, release to throw
- **Prompt:** "Drag back on the squirrel to aim!"

**Level 2: Power Control**
- Basket placed farther away
- **Teaches:** Pull farther = more power
- **Prompt:** "Pull back more for a stronger throw!"

**Level 3: Angles**
- Basket placed higher
- **Teaches:** Angle your shots
- **Prompt:** "Aim up to reach high baskets!"

**Boss 10 Introduction:**
- First boss has explanation prompts
- **Prompt:** "Hit the owl's belly! Watch out for bombs!"
- Brief pause to show mechanics before fight begins

### Tutorial Text Style
- Minimal text (5-year-old friendly)
- Large, clear font
- Icons alongside words where possible
- Text fades after a few seconds
- Can be skipped on replay

### Difficulty Progression
| Level Range | Complexity |
|-------------|------------|
| 1–10 | Clear shots, learn aiming and power control |
| 11–20 | Introduce branches (static), require simple bounces |
| 21–30 | Multiple branches, trickier angles |
| 31–40 | Introduce birds (moving), timing matters |
| 41–50 | Branches + birds combined |
| 51–60 | Screen wrap shots encouraged |
| 61–70 | Complex obstacle combinations |
| 71–80 | Multiple baskets + obstacles |
| 81–90 | Expert puzzles requiring all mechanics |
| 91–100 | Master levels, ultimate challenge |

---

### 🌲 Themed Worlds

**After defeating each boss, the world theme changes!**

Each 10-level chunk has a unique visual theme while keeping the core forest vibe:

| Levels | World Theme | Visual Style |
|--------|-------------|--------------|
| 1–10 | **Spring Meadow** | Bright greens, flowers, sunny |
| 11–20 | **Deep Woods** | Darker greens, dense trees, dappled light |
| 21–30 | **Autumn Forest** | Orange/red leaves, golden light |
| 31–40 | **Misty Hollow** | Fog effects, muted colors, mysterious |
| 41–50 | **Rainy Grove** | Rain effects, puddles, gray skies |
| 51–60 | **Sunset Canopy** | Warm oranges/pinks, long shadows |
| 61–70 | **Moonlit Woods** | Night theme, blue tones, fireflies |
| 71–80 | **Snowy Pines** | Winter, snow on branches, white/blue |
| 81–90 | **Enchanted Glade** | Magical sparkles, glowing plants |
| 91–100 | **Phantom Realm** | Owl's domain, ghostly, ethereal |

**What changes per theme:**
- Background art (sky, trees, scenery)
- Color palette
- Ambient effects (leaves → snow → rain → fireflies, etc.)
- Ground/branch textures
- Ambient music variation (same melody, different mood)

**Progression Feel:**
```
🌸 Spring → 🌲 Deep → 🍂 Autumn → 🌫️ Misty → 🌧️ Rainy
    ↓
🦉 Final Realm ← ❄️ Snow ← 🌙 Night ← 🌅 Sunset ← ✨ Enchanted
```

**Unlock Flow:**
1. Beat Boss 10 → World changes to Deep Woods
2. Beat Boss 20 → World changes to Autumn Forest
3. ...and so on
4. Beat Boss 90 → Enter the Phantom Realm for final showdown!

### Level Design Principles
- **Early levels:** Direct shots work, bounces optional
- **Mid levels:** Some shots require 1 bounce off a branch
- **Late levels:** Complex paths using multiple bounces, timing with birds, and screen wraps
- **Always fair:** Every level solvable with skill, not luck

---

## Art Style

**Direction:** Minimalist Angry Birds meets Forest Theme

- **Characters:** Simple, expressive, bold outlines
- **Squirrel:** Cute, animated reactions (happy on success, sad on miss)
- **Nuts:** Clean round shapes (acorn style)
- **Baskets:** Woven basket look, clear readable targets
- **Backgrounds:** Forest setting, trees, nature elements
- **UI:** Large touch-friendly buttons, kid-friendly icons

### Color Palette
- **Primary:** Forest greens (leaves, grass)
- **Secondary:** Warm browns (wood, branches, squirrel)
- **Accents:** Golden/amber (nuts, highlights)
- **Sky:** Soft blue or dappled light through trees
- **UI:** Natural tones with bright accents for interactive elements

### Art Assets (AI Generated)
All art will be AI-generated with consistent style:
- Squirrel character (idle, aiming, celebrating, disappointed)
- Nut/acorn sprite (with spin animation frames)
- Basket (empty, catching, full states)
- Branch obstacles (various lengths)
- Bird obstacles (flying animation)
- **Phantom Owl boss** (transparent/ghostly, glowing eyes, ethereal)
- **Owl animations** (floating idle, hit flicker, taunt, tornado defeat)
- **Tornado effect** (for boss defeat animation)
- **Boss level atmosphere** (darker overlay, misty effects)
- **Ambient particles** (leaves, snow, rain, fireflies per theme)
- **10 themed backgrounds** (Spring, Deep Woods, Autumn, Misty, Rainy, Sunset, Moonlit, Snowy, Enchanted, Phantom Realm)
- UI elements (buttons, panels, icons)

### Audio Assets (AI Generated / Royalty-Free)
- Forest ambient music loop (calm, nature-inspired)
- Boss battle music loop (mysterious, slightly intense)
- Sound effects: whoosh, pop, thud, bonk, squawk, hoot
- Victory jingle
- Tornado whoosh

---

### 🍂 Ambient Visual Effects

**Blowing Leaves:**
- Leaves gently blow across the screen throughout gameplay
- **Purely cosmetic** – does NOT affect nut trajectory or physics
- Adds life and movement to the forest setting
- Various leaf types (oak, maple, etc.) in autumn colors

**Leaf Behavior:**
```
     🍂        🍁
       ↘️    ↙️
    🍁    ↘️     🍂
         ↓
   ~~~~~~ wind direction ~~~~~~
```
- Drift slowly across screen (left to right or random)
- Gentle floating/tumbling animation
- Spawn off-screen, drift through, exit off-screen
- 3-6 leaves visible at a time (not cluttered)
- Semi-transparent so they don't distract from gameplay

**Other Ambient Effects (optional):**
- Occasional bird flying in background (distant, not obstacle)
- Dust motes / pollen floating in light beams
- Subtle background tree sway

---

## UI Screens

### Main Menu
```
┌─────────────────────────────────────┐
│                                     │
│           🐿️ NUTSO 🥜              │
│                                     │
│         [ ▶ PLAY ]                 │
│                                     │
│         [ DIFFICULTY ]              │
│         Easy | Medium | Hard        │
│                                     │
│         🔊 Sound: ON/OFF            │
│                                     │
│         [ LOAD SAVE ]               │
│                                     │
└─────────────────────────────────────┘
```

### Level Select (Castle Crumble Style Map)
```
┌─────────────────────────────────────┐
│  Forest Map - Scroll to navigate    │
│                                     │
│    ❌───❌───❌                       │
│            │                        │
│    🔒  🔒  ④───🟡                   │
│                │                    │
│            🔒───🔒───🔒              │
│                                     │
│  Completed: ❌  Current: 🟡  Locked: 🔒│
└─────────────────────────────────────┘
```
- Levels displayed as connected nodes on a forest path/map
- Scroll/pan to see all 100 levels
- Visual progression through different forest areas
- **Completed levels:** X'd out (❌)
- **Current level:** Highlighted (🟡)
- **Next level:** Unlocked and visible after completing current
- **Future levels:** Locked (🔒)
- **Linear progression:** Must complete levels in order

### Gameplay HUD
```
┌─────────────────────────────────────┐
│  ⏱️ 9:45    🥜 15/20    Score: 8   │
│                                     │
│         [GAME AREA]                 │
│                                     │
│                          [ ⏸ ]     │
└─────────────────────────────────────┘
```
- Timer (10 min countdown)
- Nuts remaining (out of 20)
- Current score
- Pause button

### Pause Screen
```
┌─────────────────────────────────────┐
│  🍂                           🍁   │
│                                     │
│           ⏸ PAUSED                 │
│                                     │
│         [ RESUME ]                  │
│         [ RESTART ]                 │
│         [ QUIT TO MAP ]             │
│                                     │
│      🍁                      🍂    │
│  (leaves continue falling)          │
└─────────────────────────────────────┘
```
- Simple "PAUSED" display
- **Leaves keep falling** in background (stays alive)
- Resume, Restart, Quit options

### Level Complete Screen
```
┌─────────────────────────────────────┐
│                                     │
│         LEVEL COMPLETE! 🎉          │
│                                     │
│         Score: 14/20                │
│         ⭐⭐☆                        │
│                                     │
│    [ RETRY ]  [ NEXT ]  [ MAP ]    │
│                                     │
└─────────────────────────────────────┘
```

### Game Over Screen (Time Up or All Shots Used)
```
┌─────────────────────────────────────┐
│                                     │
│         TIME'S UP! ⏰               │
│         (or OUT OF NUTS!)           │
│                                     │
│         Final Score: 8/20           │
│         Needed: 10 to pass          │
│                                     │
│       [ RETRY ]     [ MAP ]         │
│                                     │
└─────────────────────────────────────┘
```

---

## Save System

- **Save slots:** Player enters a name to create a save file
- **Data saved:**
  - Player name
  - Levels completed (with star ratings)
  - Current difficulty setting
  - Sound preference
- **Storage:** Browser localStorage (JSON format)
- **Multiple saves:** Support for multiple named save files

---

## Audio

### Ambient Music
- **Forest theme** – gentle, looping background music
- Calm, nature-inspired (birds chirping, soft melody)
- Kid-friendly and not distracting
- **Toggleable** via sound on/off in menu
- Different mood for boss battles (slightly more intense/mysterious)

### Sound Effects
| Event | Sound |
|-------|-------|
| **Throw** | Satisfying "whoosh" |
| **Basket success** | "Pop" or cheerful chime |
| **Miss (ground)** | Gentle "thud" |
| **Bounce (branch)** | Wooden "bonk" |
| **Bounce (bird)** | Soft "squawk" |
| **Boss hit** | Ghostly "hoot" + impact |
| **Boss bomb throw** | Ghostly "whoosh" |
| **Boss bomb explode** | Ethereal "boom" |
| **Boss defeat** | Tornado whoosh + victory fanfare |
| **Level complete** | Celebratory jingle |
| **Squirrel** | Happy chittering on success |

### Audio Settings
- **Single toggle:** Sound ON/OFF (controls both music AND effects)
- Or optionally: separate Music / SFX sliders (v2)

---

## Display & Screen

| Setting | Value |
|---------|-------|
| **Orientation** | Landscape |
| **Scaling** | Responsive – adapts to fill screen |
| **Base Resolution** | 1280×720 (16:9 reference) |
| **Mobile** | Scales to fit, maintains playability |

---

## Technical Approach

### Recommended Stack (Web → iOS Ready)

| Layer | Technology | Why |
|-------|------------|-----|
| **Game Engine** | Phaser 3 | Industry-standard 2D game framework, built-in physics, perfect for trajectory games |
| **Physics** | Phaser Arcade Physics | Handles gravity, friction, collisions, bouncing |
| **Language** | TypeScript | Type safety, better IDE support, scales well |
| **Build Tool** | Vite | Fast development, hot reload, modern bundling |
| **Hosting (Web)** | Railway | User already has account, supports static sites |
| **Mobile Wrapper** | Capacitor | Wraps web app as native iOS (and Android) app |

### Why Phaser + Capacitor?

**Phaser 3:**
- Built for 2D games exactly like Nutso
- Arcade Physics handles gravity, friction, bounce perfectly
- Sprite animations (spinning nut, squirrel reactions)
- Touch + mouse input built-in
- Huge community, lots of examples

**Capacitor:**
- Created by the Ionic team
- Takes any web app → native iOS/Android
- Access to native features (haptics, push notifications) if needed later
- Same JavaScript codebase
- No need to rewrite anything for mobile

### Migration Path

```
Phase 1: Web Game
├── Build with Phaser 3 + TypeScript
├── Deploy to Vercel/Netlify
└── Playable in any browser (desktop + mobile Safari)

Phase 2: iOS App (when ready)
├── Add Capacitor to project
├── Configure iOS build settings
├── Build native app bundle
└── Submit to App Store
```

### Alternative Engines (if needed)

| Engine | Pros | Cons |
|--------|------|------|
| **Godot** | True game engine, native iOS export | Learning curve (GDScript) |
| **Unity** | Most powerful, industry standard | Overkill for 2D, heavy |
| **PixiJS** | Lightweight renderer | No built-in physics |

---

## MVP Features (Version 1.0)

Must-have for initial playable release:

### Core Gameplay
- [ ] Slingshot aiming with trajectory preview
- [ ] Physics: gravity + friction
- [ ] Screen wrap on left/right edges
- [ ] Solid ground at bottom
- [ ] Single nut type (round ball physics, visual spin)
- [ ] Squirrel fixed at bottom-left
- [ ] Basket(s) on right side
- [ ] Branches (static horizontal obstacles)
- [ ] 20 shots per round
- [ ] 10-minute time limit
- [ ] Score tracking (0–20, need 10 to pass)

### Difficulty System
- [ ] Easy mode: 10× basket size
- [ ] Medium mode: 5× basket size
- [ ] Hard mode: 3× basket size

### Levels
- [ ] 10–20 initial levels (expandable to 100)
- [ ] Level 1: clear path, no obstacles
- [ ] Multiple baskets on later levels
- [ ] 10 themed worlds (theme changes after each boss)
- [ ] Boss battles every 10th level
- [ ] Boss: Phantom Owl (ghostly/transparent), hit belly 15× to win
- [ ] Boss throws bombs that explode and push nut trajectory
- [ ] Player must time shots between bomb explosions
- [ ] Boss difficulty increases (faster, more bombs, tighter windows)

### UI Screens
- [ ] Main menu (Play, Difficulty, Sound, Load)
- [ ] Level select map (Castle Crumble style)
- [ ] Gameplay HUD (timer, shots, score)
- [ ] Level complete screen (score, stars, next/retry)
- [ ] Game over screen (retry option)

### Save System
- [ ] Named save files
- [ ] Progress persistence (localStorage)
- [ ] Multiple save slots

### Art & Polish
- [ ] AI-generated sprites (squirrel, nut, basket, branches)
- [ ] Phantom Owl boss with tornado defeat animation
- [ ] Forest-themed background
- [ ] Ambient blowing leaves (cosmetic, no physics)

### Audio
- [ ] Ambient forest background music (looping)
- [ ] Boss battle music (more intense)
- [ ] Sound effects (throw, catch, miss, bounce, etc.)
- [ ] Sound on/off toggle

### Input
- [ ] Touch support (mobile)
- [ ] Mouse support (desktop)

---

## Future Features (Version 2.0+)

Nice-to-haves for later:

- [ ] Star rating system (1–3 stars)
- [ ] All 100 levels
- [ ] Birds (moving obstacles)
- [ ] Moving baskets
- [ ] Wind effects
- [ ] Multiple nut types (bouncy, heavy, etc.)
- [ ] Themed worlds (park, winter, city)
- [ ] Sound effects & music
- [ ] Squirrel customization/skins
- [ ] Daily challenges
- [ ] Leaderboards
- [ ] Achievements/badges
- [ ] Save progress (localStorage or accounts)

---

## Milestones

### Phase 1: Prototype (1–2 weeks)
- Basic slingshot mechanic working
- Gravity + friction physics
- Screen wrap functioning
- One basket, one nut, one level
- Playable in browser

### Phase 2: Core Game (2–3 weeks)
- Scoring system (20 nuts, 0–20 score)
- 10 levels with increasing difficulty
- Level select screen
- Win/lose conditions
- Basic art assets

### Phase 3: Content & Polish (2–4 weeks)
- Expand to 50+ levels
- Add obstacles
- Squirrel animations & reactions
- Sound effects
- Mobile touch optimization

### Phase 4: Full Release (ongoing)
- Complete 100 levels
- Final art polish
- Bug fixes & playtesting
- Launch!

---

## Open Questions

1. **Boss movement:** Does difficulty setting affect boss behavior too?
2. **Boss stars:** Same star system (15=⭐, 17=⭐⭐, 20=⭐⭐⭐)?
3. **Monetization:** Free? (Probably free for kid audience)

## Decided

### Core Mechanics
- ✅ **Screen wrap:** Left/right edges only (nut wraps horizontally)
- ✅ **Ground:** Solid ground at bottom like Angry Birds (nut stops/fails here)
- ✅ **Layout:** Squirrel fixed at bottom-left, basket(s) on right
- ✅ **Aiming:** Angry Birds slingshot style (pull back to aim)
- ✅ **Trajectory preview:** Shows ~50% across screen (like Angry Birds)
- ✅ **Nut physics:** Round ball, even weight, spins visually while flying
- ✅ **Nut on score:** Explodes with satisfying visual effect
- ✅ **Basket tilt:** 35° toward player (opening faces squirrel)
- ✅ **Multiple baskets:** Must hit ALL baskets to score +1

### Scoring & Difficulty
- ✅ **Passing score:** 10/20 to complete a level
- ✅ **Auto-complete:** Level ends immediately when passing score reached
- ✅ **Time limit:** 10 minutes per level
- ✅ **Time runs out:** If mid-throw, let nut finish its trajectory
- ✅ **Difficulty modes:** Easy (10×), Medium (5×), Hard (3×) basket sizes

### Levels & Content
- ✅ **Obstacles:** Branches (static, horizontal) and Birds (moving)
- ✅ **Level 1:** Clear path, no obstacles, just learn the mechanic
- ✅ **Multiple baskets:** Levels 10+ may have multiple baskets
- ✅ **Progression:** Later levels require bouncing off obstacles to reach basket
- ✅ **Themed worlds:** 10 different themes, changes after each boss defeat
- ✅ **Boss battles:** Every 10th level (10, 20, 30... 100)
- ✅ **Boss character:** Phantom Owl – ghostly, transparent, otherworldly
- ✅ **Boss mechanic:** Hit the owl's belly, 15 hits to pass
- ✅ **Boss attack:** Owl throws bombs that explode and push nut away
- ✅ **Boss strategy:** Time shots between bomb explosions
- ✅ **Boss progression:** Gets harder (faster, more bombs, tighter timing windows)

### UI & UX
- ✅ **Level select:** Castle Crumble-style map with connected nodes
- ✅ **Level unlock:** Linear progression (must complete in order)
- ✅ **Completed levels:** X'd out on map, next level unlocked
- ✅ **Main menu:** Play, Difficulty, Sound toggle, Load Save
- ✅ **Pause screen:** Shows "PAUSED", leaves keep falling in background
- ✅ **Retry:** Unlimited retries allowed on any level
- ✅ **Sound:** Simple on/off toggle
- ✅ **Tutorial:** Levels 1-3 introduce concepts with prompts, Boss 10 has explanation
- ✅ **Text:** Minimal, kid-friendly, icons where possible

### Saves & Progress
- ✅ **Save system:** Named save files stored in localStorage

### Art & Style
- ✅ **Color palette:** Forest colors (greens, browns, amber accents)
- ✅ **Art assets:** AI-generated with consistent minimalist style
- ✅ **Ambient effects:** Leaves blowing through forest (cosmetic only, no physics)
- ✅ **Boss defeat:** Tornado picks up and blows away the Phantom Owl
- ✅ **Audio:** Ambient forest music + boss music + sound effects (toggleable)

### Technical
- ✅ **Tech stack:** Phaser 3 + TypeScript + Vite (web), Capacitor for iOS later
- ✅ **Hosting:** Railway (static site deployment)
- ✅ **Orientation:** Landscape
- ✅ **Screen scaling:** Responsive (adapts to fill screen)

---

## Summary

**Nutso** is a physics-based nut-throwing game where a squirrel aims to land nuts in baskets. The screen-wrap mechanic adds a unique twist, and the simple controls make it perfect for young players. Built for web, targeting 100 levels, with a clean minimalist art style.

Let's go nuts! 🥜

