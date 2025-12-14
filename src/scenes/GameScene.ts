import Phaser from 'phaser';
import { getLevelConfig, LevelConfig } from '../data/levels';

interface GameData {
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  devMode?: boolean;
  totalPoints?: number; // Cumulative points across all levels
}

export class GameScene extends Phaser.Scene {
  // Game settings
  private level: number = 1;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private soundEnabled: boolean = true;
  private devMode: boolean = false;

  // Game state
  private score: number = 0;
  private points: number = 0; // Points earned this level
  private totalPoints: number = 0; // Cumulative points across all levels
  private shotsRemaining: number = 20;
  private isAiming: boolean = false;
  private canShoot: boolean = true;
  private hasScored: boolean = false;

  // Game objects
  private squirrel!: Phaser.GameObjects.Text;
  private basket!: Phaser.GameObjects.Container;
  private basketZone!: Phaser.GameObjects.Zone;
  private ground!: Phaser.GameObjects.Rectangle;
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private currentNut: { body: Phaser.GameObjects.Arc; emoji: Phaser.GameObjects.Text } | null = null;
  private branches: Phaser.GameObjects.Rectangle[] = [];
  private levelConfig!: LevelConfig;
  private movingObstacles: { body: Phaser.GameObjects.Arc; emoji: Phaser.GameObjects.Text; speed: number; direction: number; minX: number; maxX: number }[] = [];

  // Basket movement
  private basketDirection: number = 1; // 1 = up, -1 = down
  private basketMinY: number = 200;
  private basketMaxY: number = 550;
  private basketSpeed: number = 0;
  private backboard!: Phaser.GameObjects.Rectangle;

  // Swoosh tracking
  private nutHitRim: boolean = false;

  // Owl figurines on shelves
  private shelves: Phaser.GameObjects.Container[] = [];
  private owlFigurines: { sprite: Phaser.GameObjects.Text; knocked: boolean; shelf: number }[] = [];

  // Aiming
  private dragStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private dragCurrentPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private maxDragDistance: number = 120; // Reduced so you don't need to drag as far

  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private shotsText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameData) {
    this.level = data?.level || 1;
    this.difficulty = data?.difficulty || 'medium';
    this.soundEnabled = data?.soundEnabled ?? true;
    this.devMode = data?.devMode ?? false;
    this.totalPoints = data?.totalPoints || 0; // Carry over cumulative points
    this.score = 0;
    this.points = 0;
    this.shotsRemaining = 20;
    this.isAiming = false;
    this.canShoot = true;
    this.currentNut = null;
    this.hasScored = false;
    this.shelves = [];
    this.owlFigurines = [];
  }

  create() {
    const { width, height } = this.scale;

    // Get level config
    this.levelConfig = getLevelConfig(this.level);

    // Check if this is a boss level
    if (this.levelConfig.isBossLevel) {
      this.scene.start('BossScene', {
        level: this.level,
        difficulty: this.difficulty,
        devMode: this.devMode,
        totalPoints: this.totalPoints,
      });
      return;
    }

    // Themed background based on level
    this.createThemedBackground();

    // Add trees in background
    this.createTrees();

    // Ground (themed)
    const theme = this.getWorldTheme();
    this.ground = this.add.rectangle(width / 2, height - 30, width, 60, theme.groundColor);
    this.physics.add.existing(this.ground, true);

    // Grass on top of ground (themed)
    const grass = this.add.graphics();
    grass.fillStyle(theme.grassColor, 1);
    for (let x = 0; x < width; x += 20) {
      grass.fillTriangle(x, height - 60, x + 10, height - 75, x + 20, height - 60);
    }

    // Squirrel's house (behind squirrel)
    this.createSquirrelHouse(160, height - 60);

    // Squirrel (moved right so there's room to drag, flipped to face right)
    this.squirrel = this.add.text(200, height - 100, '🐿️', { fontSize: '64px' })
      .setOrigin(0.5)
      .setScale(-1, 1);

    // Basket
    this.createBasket();

    // Branches (obstacles) - DISABLED
    // this.createBranches();

    // Moving bird obstacles (appear after level 5) - DISABLED
    // this.createMovingObstacles();

    // Trajectory line
    this.trajectoryLine = this.add.graphics();

    // HUD
    this.createHUD();

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Ambient decorations
    this.createSun();
    this.createLeaves();
    this.createBirds();
    // this.createOwlShelves(); - DISABLED
    
    // Branding
    this.add.text(width - 10, height - 10, 'Taylor Made Games', {
      fontSize: '14px',
      color: '#5d4e37',
      fontStyle: 'italic',
    }).setOrigin(1, 1).setAlpha(0.7).setDepth(50);
  }

  private createBasket() {
    const { width, height } = this.scale;

    // Basket always starts at far right of screen
    const basketX = width - 120;
    // Starting Y position - middle-ish
    const startingY = height - 200;

    // Basket size based on difficulty
    const sizeMultiplier = this.difficulty === 'easy' ? 10 : this.difficulty === 'medium' ? 5 : 3;
    const basketWidth = 20 * sizeMultiplier;
    const basketHeight = basketWidth * 0.8;

    // Set up basket movement - Level 1 doesn't move, then speed increases each level
    this.basketSpeed = this.level === 1 ? 0 : 0.5 + (this.level - 2) * 0.3;
    this.basketMinY = 150; // How high it can go
    this.basketMaxY = height - 120; // How low it can go
    this.basketDirection = 1; // Start moving up

    this.basket = this.add.container(basketX, startingY);

    // Basket visual - open top container style
    const basketGraphics = this.add.graphics();
    
    // Back of basket (darker)
    basketGraphics.fillStyle(0x6B4423, 1);
    basketGraphics.fillRoundedRect(-basketWidth / 2, -basketHeight / 2, basketWidth, basketHeight, 8);
    
    // Front of basket (lighter, with opening visible)
    basketGraphics.fillStyle(0x8B4513, 1);
    basketGraphics.beginPath();
    basketGraphics.moveTo(-basketWidth / 2, -basketHeight / 2 + 10);
    basketGraphics.lineTo(-basketWidth / 2 + 8, basketHeight / 2);
    basketGraphics.lineTo(basketWidth / 2 - 8, basketHeight / 2);
    basketGraphics.lineTo(basketWidth / 2, -basketHeight / 2 + 10);
    basketGraphics.closePath();
    basketGraphics.fillPath();
    
    // Rim at top (the opening) - THIS IS THE RIM for swoosh detection
    basketGraphics.lineStyle(6, 0x5D3A1A, 1);
    basketGraphics.lineBetween(-basketWidth / 2 - 5, -basketHeight / 2, basketWidth / 2 + 5, -basketHeight / 2);
    
    // Woven lines
    basketGraphics.lineStyle(2, 0xA0522D, 0.6);
    for (let y = -basketHeight / 2 + 15; y < basketHeight / 2; y += 12) {
      const widthAtY = basketWidth / 2 - 5;
      basketGraphics.lineBetween(-widthAtY, y, widthAtY, y);
    }
    
    this.basket.add(basketGraphics);
    
    // Tilt basket 45° toward the squirrel
    this.basket.setRotation(-45 * Math.PI / 180);
    
    // Store basket dimensions for scoring check
    (this.basket as any).basketWidth = basketWidth;
    (this.basket as any).basketHeight = basketHeight;

    // Scoring zone - the center opening of the basket (smaller for swoosh)
    const swooshWidth = basketWidth * 0.5; // Center 50% is the "swoosh" zone
    this.basketZone = this.add.zone(basketX, startingY - basketHeight / 4, basketWidth + 10, basketHeight / 2 + 20);
    this.physics.add.existing(this.basketZone, true);
    
    // Store swoosh zone dimensions (inner part of basket opening)
    (this.basket as any).swooshLeft = basketX - swooshWidth / 2;
    (this.basket as any).swooshRight = basketX + swooshWidth / 2;
    
    // BACKBOARD - like a basketball hoop backstop
    const backboardHeight = basketHeight * 2.5;
    const backboardX = basketX + basketWidth / 2 + 15;
    
    // Visual backboard
    const backboardVisual = this.add.graphics();
    backboardVisual.fillStyle(0x5D3A1A, 1);
    backboardVisual.fillRect(-6, -backboardHeight / 2, 12, backboardHeight);
    backboardVisual.lineStyle(2, 0x3D2A0A, 1);
    backboardVisual.strokeRect(-6, -backboardHeight / 2, 12, backboardHeight);
    
    // Create backboard as a container so it moves with basket
    const backboardContainer = this.add.container(backboardX, startingY - basketHeight);
    backboardContainer.add(backboardVisual);
    
    // Physics backboard (for bouncing)
    this.backboard = this.add.rectangle(backboardX, startingY - basketHeight, 12, backboardHeight, 0x5D3A1A, 0);
    this.physics.add.existing(this.backboard, true);
    
    // Store references for movement
    (this.basket as any).backboardContainer = backboardContainer;
    (this.basket as any).backboardBody = this.backboard;
    (this.basket as any).zone = this.basketZone;
  }

  private createHUD() {
    const { width } = this.scale;

    // HUD background
    this.add.rectangle(width / 2, 25, width, 50, 0x000000, 0.5).setDepth(100);

    // Level indicator
    this.add.text(20, 25, `Level ${this.level}`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(101);

    this.shotsText = this.add.text(width / 2 - 80, 25, `🥜 ${this.shotsRemaining}/20`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(101);

    this.scoreText = this.add.text(width / 2 + 60, 25, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#e74c3c', // Starts red, turns green at 5+
    }).setOrigin(0, 0.5).setDepth(101);

    // Points display
    this.pointsText = this.add.text(width / 2 + 200, 25, `${this.points} pts`, {
      fontSize: '20px',
      color: '#f1c40f', // Gold color for points
    }).setOrigin(0, 0.5).setDepth(101);

    // Menu button (instead of pause)
    this.add.text(width - 40, 25, '🏠', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Dev mode: Skip level buttons
    if (this.devMode) {
      // Skip 1 level
      this.add.text(width - 140, 25, '⏭️ SKIP', {
        fontSize: '18px',
        color: '#ff6b6b',
        backgroundColor: '#333333',
        padding: { x: 8, y: 4 },
      })
        .setOrigin(0.5)
        .setDepth(101)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.skipToLevel(this.level + 1);
        });

      // Skip 9 levels
      this.add.text(width - 140, 55, '⏩ SKIP 9', {
        fontSize: '18px',
        color: '#ffaa00',
        backgroundColor: '#333333',
        padding: { x: 8, y: 4 },
      })
        .setOrigin(0.5)
        .setDepth(101)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.skipToLevel(this.level + 9);
        });
    }
  }

  private skipToLevel(targetLevel: number) {
    // Cap at level 100
    const nextLevel = Math.min(targetLevel, 100);
    
    // Check if it's a boss level
    if (nextLevel % 10 === 0) {
      this.scene.start('BossScene', {
        level: nextLevel,
        difficulty: this.difficulty,
        devMode: this.devMode,
        totalPoints: this.totalPoints,
      });
    } else {
      this.scene.start('GameScene', {
        level: nextLevel,
        difficulty: this.difficulty,
        soundEnabled: this.soundEnabled,
        devMode: this.devMode,
        totalPoints: this.totalPoints,
      });
    }
  }

  private getWorldTheme(): { 
    name: string; 
    skyColor: number; 
    skyColor2: number; 
    groundColor: number; 
    grassColor: number;
    ambientParticle: string;
    treeColor: number;
  } {
    // Determine world based on level (1-10 = world 1, 11-20 = world 2, etc.)
    const world = Math.floor((this.level - 1) / 10);
    
    const themes = [
      { name: 'Spring Meadow', skyColor: 0x87ceeb, skyColor2: 0x98d8c8, groundColor: 0x4a7c3f, grassColor: 0x5d9b4e, ambientParticle: '🌸', treeColor: 0x228b22 },
      { name: 'Deep Woods', skyColor: 0x4a6741, skyColor2: 0x2d4a2d, groundColor: 0x2d4a27, grassColor: 0x3d5a37, ambientParticle: '🍃', treeColor: 0x1a5a1a },
      { name: 'Autumn Forest', skyColor: 0xdeb887, skyColor2: 0xcd853f, groundColor: 0x8b6914, grassColor: 0xa07828, ambientParticle: '🍂', treeColor: 0xd2691e },
      { name: 'Misty Hollow', skyColor: 0x9fb6c2, skyColor2: 0x7a9aa8, groundColor: 0x5a6a5a, grassColor: 0x6a7a6a, ambientParticle: '🌫️', treeColor: 0x4a5a4a },
      { name: 'Rainy Grove', skyColor: 0x708090, skyColor2: 0x4a5a6a, groundColor: 0x3a4a3a, grassColor: 0x4a5a4a, ambientParticle: '💧', treeColor: 0x2a4a2a },
      { name: 'Sunset Canopy', skyColor: 0xff7f50, skyColor2: 0xff6347, groundColor: 0x5a4a3a, grassColor: 0x6a5a4a, ambientParticle: '✨', treeColor: 0x8b4513 },
      { name: 'Moonlit Woods', skyColor: 0x191970, skyColor2: 0x0a0a3a, groundColor: 0x1a2a1a, grassColor: 0x2a3a2a, ambientParticle: '✨', treeColor: 0x0a2a0a },
      { name: 'Snowy Pines', skyColor: 0xb0c4de, skyColor2: 0x87ceeb, groundColor: 0xfffafa, grassColor: 0xf0f8ff, ambientParticle: '❄️', treeColor: 0x1e5631 },
      { name: 'Enchanted Glade', skyColor: 0x9370db, skyColor2: 0x8a2be2, groundColor: 0x4a3a5a, grassColor: 0x5a4a6a, ambientParticle: '💫', treeColor: 0x6a4a8a },
      { name: 'Phantom Realm', skyColor: 0x2c2c54, skyColor2: 0x1a1a2e, groundColor: 0x1a1a2a, grassColor: 0x2a2a3a, ambientParticle: '👻', treeColor: 0x3a3a4a },
    ];
    
    return themes[Math.min(world, themes.length - 1)];
  }

  private createThemedBackground() {
    const { width, height } = this.scale;
    const theme = this.getWorldTheme();

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(theme.skyColor, theme.skyColor, theme.skyColor2, theme.skyColor2, 1);
    sky.fillRect(0, 0, width, height);

    // World name display (brief)
    this.add.text(width / 2, height - 25, theme.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0.5).setDepth(10);

    // Special effects per world
    if (theme.name === 'Misty Hollow') {
      // Add mist layers
      for (let i = 0; i < 3; i++) {
        const mist = this.add.ellipse(width / 2 + Phaser.Math.Between(-300, 300), height - 100 - i * 50, 600, 40, 0xffffff, 0.15);
        this.tweens.add({
          targets: mist,
          x: mist.x + 80,
          alpha: 0.08,
          duration: 5000,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (theme.name === 'Moonlit Woods') {
      // Add moon
      this.add.circle(width - 120, 100, 40, 0xfffacd, 0.9);
      this.add.circle(width - 130, 95, 35, 0x191970, 1); // Moon shadow
      // Stars
      for (let i = 0; i < 20; i++) {
        const star = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height / 2), 2, 0xffffff, 0.8);
        this.tweens.add({
          targets: star,
          alpha: 0.2,
          duration: Phaser.Math.Between(500, 1500),
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (theme.name === 'Snowy Pines') {
      // Snow on ground
      this.add.rectangle(width / 2, height - 50, width, 40, 0xfffafa, 0.5);
    } else if (theme.name === 'Sunset Canopy') {
      // Sun low on horizon
      this.add.circle(width - 100, height - 150, 50, 0xffd700, 0.6);
      this.add.circle(width - 100, height - 150, 40, 0xff8c00, 0.8);
    } else if (theme.name === 'Phantom Realm') {
      // Spooky fog
      for (let i = 0; i < 4; i++) {
        const fog = this.add.ellipse(Phaser.Math.Between(0, width), height - 80, 300, 50, 0x9b59b6, 0.15);
        this.tweens.add({
          targets: fog,
          x: fog.x + 100,
          alpha: 0.05,
          duration: 4000,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _createMovingObstacles() {
    const { width, height } = this.scale;
    this.movingObstacles = [];

    // Birds start appearing at level 5
    if (this.level < 5) return;

    // Number of birds increases with level (1-4)
    const numBirds = Math.min(Math.floor((this.level - 4) / 5) + 1, 4);
    
    // Speed increases with level
    const baseSpeed = 1 + (this.level - 5) * 0.15;

    for (let i = 0; i < numBirds; i++) {
      // Position birds at different heights
      const birdY = 150 + (i / Math.max(numBirds - 1, 1)) * (height - 350);
      
      // Patrol range - some patrol different sections
      const sectionWidth = width / numBirds;
      const minX = sectionWidth * i + 100;
      const maxX = sectionWidth * (i + 1) + 100;
      const startX = (minX + maxX) / 2;
      
      // Create bird body (invisible for collision)
      const birdBody = this.add.circle(startX, birdY, 20, 0xff0000, 0);
      this.physics.add.existing(birdBody, false);
      const body = birdBody.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.setAllowGravity(false);
      body.setCircle(20);

      // Create bird emoji
      const birdEmoji = this.add.text(startX, birdY, '🐦', { fontSize: '32px' })
        .setOrigin(0.5)
        .setDepth(50);

      // Random starting direction
      const direction = Math.random() > 0.5 ? 1 : -1;
      
      // Vary speed slightly per bird
      const speed = baseSpeed * (0.8 + Math.random() * 0.4);

      this.movingObstacles.push({
        body: birdBody,
        emoji: birdEmoji,
        speed: speed,
        direction: direction,
        minX: minX,
        maxX: maxX,
      });

      // Flip bird based on direction
      birdEmoji.setScale(direction > 0 ? -1 : 1, 1);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _createBranches() {
    const { width, height } = this.scale;
    const playableHeight = height - 120; // Above ground

    this.branches = [];

    for (const branchConfig of this.levelConfig.branches) {
      const branchX = branchConfig.x * width;
      const branchY = 80 + branchConfig.y * playableHeight;
      const branchWidth = branchConfig.width;
      const branchHeight = 15;

      // Visual branch
      const branchGraphics = this.add.graphics();
      
      // Main branch body
      branchGraphics.fillStyle(0x6B4423, 1);
      branchGraphics.fillRoundedRect(
        branchX - branchWidth / 2,
        branchY - branchHeight / 2,
        branchWidth,
        branchHeight,
        5
      );
      
      // Bark texture
      branchGraphics.lineStyle(2, 0x4A2F1A, 0.5);
      for (let lx = branchX - branchWidth / 2 + 10; lx < branchX + branchWidth / 2 - 10; lx += 15) {
        branchGraphics.lineBetween(lx, branchY - 5, lx + 5, branchY + 5);
      }
      
      // Leaves on branch
      const leafColors = [0x228b22, 0x2d8b2d, 0x1e7b1e];
      for (let i = 0; i < 4; i++) {
        const leafX = branchX - branchWidth / 3 + (i / 3) * (branchWidth * 2 / 3);
        const leafY = branchY - 15 - Math.random() * 10;
        this.add.circle(leafX, leafY, 8 + Math.random() * 5, leafColors[i % 3], 0.8);
      }

      // Physics branch
      const branch = this.add.rectangle(branchX, branchY, branchWidth, branchHeight, 0x6B4423, 0);
      this.physics.add.existing(branch, true);
      this.branches.push(branch);
    }
  }

  private createSquirrelHouse(x: number, groundY: number) {
    // High-detail stick house like Three Little Pigs
    const houseWidth = 200;
    const houseHeight = 280;
    const roofHeight = 100;
    
    const houseX = x;
    const houseBottom = groundY;
    const houseTop = houseBottom - houseHeight;
    const roofTop = houseTop - roofHeight;
    
    const house = this.add.graphics();
    
    // === HOUSE BODY - Made of horizontal sticks ===
    // Background fill (gaps between sticks)
    house.fillStyle(0x2d5a27, 0.4); // Dark green showing through gaps
    house.fillRect(houseX - houseWidth / 2, houseTop, houseWidth, houseHeight);
    
    // Individual horizontal sticks with varying colors and slight offsets
    const stickColors = [0xC4A060, 0xB8956A, 0xD4B070, 0xA88850, 0xC9A868];
    for (let y = houseTop; y < houseBottom; y += 8) {
      const stickColor = stickColors[Math.floor(Math.random() * stickColors.length)];
      const offsetX = Phaser.Math.Between(-3, 3);
      const stickHeight = Phaser.Math.Between(6, 9);
      
      house.fillStyle(stickColor, 1);
      house.fillRect(houseX - houseWidth / 2 + offsetX, y, houseWidth - offsetX * 2, stickHeight);
      
      // Stick end details (knots and bark texture)
      house.fillStyle(0x8B6914, 0.6);
      house.fillCircle(houseX - houseWidth / 2 + 5 + offsetX, y + stickHeight / 2, 3);
      house.fillCircle(houseX + houseWidth / 2 - 5 + offsetX, y + stickHeight / 2, 3);
      
      // Random knots on sticks
      if (Math.random() > 0.7) {
        const knotX = houseX + Phaser.Math.Between(-houseWidth / 3, houseWidth / 3);
        house.fillStyle(0x6B4F10, 0.5);
        house.fillCircle(knotX, y + stickHeight / 2, 2);
      }
    }
    
    // Vertical binding sticks (rope/vine lashing)
    house.lineStyle(4, 0x5D4E37, 0.8);
    for (let vx = houseX - houseWidth / 2 + 30; vx < houseX + houseWidth / 2 - 20; vx += 50) {
      house.lineBetween(vx, houseTop + 10, vx, houseBottom - 5);
      // Lashing marks
      house.lineStyle(2, 0x4A3D2A, 0.6);
      for (let ly = houseTop + 30; ly < houseBottom - 20; ly += 40) {
        house.lineBetween(vx - 5, ly, vx + 5, ly + 8);
        house.lineBetween(vx - 5, ly + 4, vx + 5, ly + 12);
      }
      house.lineStyle(4, 0x5D4E37, 0.8);
    }
    
    // === DOOR - Stick frame ===
    const doorWidth = 45;
    const doorHeight = 80;
    const doorX = houseX - doorWidth / 2;
    const doorY = houseBottom - doorHeight;
    
    // Door opening (dark inside)
    house.fillStyle(0x1a1a1a, 1);
    house.fillRect(doorX + 5, doorY + 5, doorWidth - 10, doorHeight - 5);
    
    // Door frame made of sticks
    house.fillStyle(0x8B6914, 1);
    house.fillRect(doorX, doorY, 8, doorHeight); // Left frame
    house.fillRect(doorX + doorWidth - 8, doorY, 8, doorHeight); // Right frame
    house.fillRect(doorX, doorY, doorWidth, 8); // Top frame
    
    // === WINDOWS - Circular with stick frames ===
    // Left window
    house.fillStyle(0x87CEEB, 0.8);
    house.fillCircle(houseX - houseWidth / 3, houseTop + 80, 22);
    house.lineStyle(5, 0x8B6914, 1);
    house.strokeCircle(houseX - houseWidth / 3, houseTop + 80, 24);
    // Window cross sticks
    house.lineStyle(4, 0x6B4F10, 1);
    house.lineBetween(houseX - houseWidth / 3, houseTop + 56, houseX - houseWidth / 3, houseTop + 104);
    house.lineBetween(houseX - houseWidth / 3 - 22, houseTop + 80, houseX - houseWidth / 3 + 22, houseTop + 80);
    
    // Right window
    house.fillStyle(0x87CEEB, 0.8);
    house.fillCircle(houseX + houseWidth / 3, houseTop + 80, 22);
    house.lineStyle(5, 0x8B6914, 1);
    house.strokeCircle(houseX + houseWidth / 3, houseTop + 80, 24);
    house.lineStyle(4, 0x6B4F10, 1);
    house.lineBetween(houseX + houseWidth / 3, houseTop + 56, houseX + houseWidth / 3, houseTop + 104);
    house.lineBetween(houseX + houseWidth / 3 - 22, houseTop + 80, houseX + houseWidth / 3 + 22, houseTop + 80);
    
    // === ROOF - Thatched stick roof ===
    const roofLeft = houseX - houseWidth / 2 - 25;
    const roofRight = houseX + houseWidth / 2 + 25;
    
    // Roof base layer
    house.fillStyle(0x7A5D1A, 1);
    house.beginPath();
    house.moveTo(roofLeft, houseTop + 5);
    house.lineTo(houseX, roofTop);
    house.lineTo(roofRight, houseTop + 5);
    house.closePath();
    house.fillPath();
    
    // Individual roof sticks (thatching effect)
    for (let i = 0; i < 25; i++) {
      const t = i / 24;
      const stickColor = stickColors[i % stickColors.length];
      house.lineStyle(4, stickColor, 0.9);
      
      // Left side of roof
      const leftStartX = roofLeft + t * (houseX - roofLeft);
      const leftStartY = houseTop + 5 + t * (roofTop - houseTop - 5);
      house.lineBetween(leftStartX, leftStartY, leftStartX + 20, leftStartY + 25);
      
      // Right side of roof
      const rightStartX = houseX + t * (roofRight - houseX);
      const rightStartY = roofTop + t * (houseTop + 5 - roofTop);
      house.lineBetween(rightStartX, rightStartY, rightStartX - 20, rightStartY + 25);
    }
    
    // Roof ridge (top stick)
    house.lineStyle(8, 0x6B4F10, 1);
    house.lineBetween(houseX - 15, roofTop + 3, houseX + 15, roofTop + 3);
    
    // === CHIMNEY - Made of sticks ===
    const chimneyX = houseX + 50;
    const chimneyBottom = roofTop + 40;
    const chimneyTop = roofTop - 40;
    
    // Chimney sticks
    house.fillStyle(0x8B6914, 1);
    for (let cy = chimneyTop; cy < chimneyBottom; cy += 7) {
      house.fillRect(chimneyX - 14, cy, 28, 6);
    }
    house.lineStyle(3, 0x5D4E37, 1);
    house.strokeRect(chimneyX - 14, chimneyTop, 28, chimneyBottom - chimneyTop);
    
    // Smoke from chimney
    this.createChimneySmoke(chimneyX, chimneyTop - 5);
    
    // === FLAG - Blue and yellow triangular ===
    const flagPoleX = houseX - 50;
    const flagPoleBottom = roofTop + 30;
    const flagPoleTop = roofTop - 60;
    
    // Flag pole (stick)
    house.lineStyle(4, 0x6B4F10, 1);
    house.lineBetween(flagPoleX, flagPoleBottom, flagPoleX, flagPoleTop);
    
    // Flag (triangular, blue and yellow stripes)
    const flag = this.add.graphics();
    flag.fillStyle(0x3498db, 1);
    flag.beginPath();
    flag.moveTo(flagPoleX, flagPoleTop);
    flag.lineTo(flagPoleX + 40, flagPoleTop + 18);
    flag.lineTo(flagPoleX, flagPoleTop + 18);
    flag.closePath();
    flag.fillPath();
    
    flag.fillStyle(0xf1c40f, 1);
    flag.beginPath();
    flag.moveTo(flagPoleX, flagPoleTop + 18);
    flag.lineTo(flagPoleX + 40, flagPoleTop + 18);
    flag.lineTo(flagPoleX, flagPoleTop + 36);
    flag.closePath();
    flag.fillPath();
    
    // Flag wave animation
    this.tweens.add({
      targets: flag,
      scaleX: 0.92,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // === STICK CAR - To the right of the house ===
    this.createStickCar(houseX + houseWidth / 2 + 80, groundY);
  }

  private createStickCar(x: number, groundY: number) {
    const car = this.add.graphics();
    const carBottom = groundY;
    const carWidth = 90;
    const carHeight = 45;
    const carTop = carBottom - carHeight;
    
    const stickColors = [0xC4A060, 0xB8956A, 0xD4B070, 0xA88850];
    
    // === CAR BODY - Made of sticks ===
    // Main body (horizontal sticks)
    for (let y = carTop + 15; y < carBottom - 12; y += 6) {
      const stickColor = stickColors[Math.floor(Math.random() * stickColors.length)];
      car.fillStyle(stickColor, 1);
      car.fillRect(x - carWidth / 2 + 5, y, carWidth - 10, 5);
    }
    
    // Car roof/cabin (smaller box on top)
    const cabinWidth = 50;
    const cabinHeight = 25;
    for (let y = carTop - cabinHeight + 5; y < carTop + 5; y += 5) {
      const stickColor = stickColors[Math.floor(Math.random() * stickColors.length)];
      car.fillStyle(stickColor, 1);
      car.fillRect(x - cabinWidth / 2 + 10, y, cabinWidth - 10, 4);
    }
    
    // Cabin window
    car.fillStyle(0x87CEEB, 0.8);
    car.fillRect(x - 12, carTop - cabinHeight + 8, 24, 15);
    car.lineStyle(2, 0x6B4F10, 1);
    car.strokeRect(x - 12, carTop - cabinHeight + 8, 24, 15);
    
    // === WHEELS - Stick wheels ===
    const wheelRadius = 14;
    const wheelY = carBottom - 2;
    
    // Left wheel
    car.fillStyle(0x5D4E37, 1);
    car.fillCircle(x - carWidth / 3, wheelY, wheelRadius);
    car.lineStyle(3, 0x3D2A1A, 1);
    car.strokeCircle(x - carWidth / 3, wheelY, wheelRadius);
    // Wheel spokes (sticks)
    car.lineStyle(2, 0x8B6914, 1);
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      car.lineBetween(
        x - carWidth / 3,
        wheelY,
        x - carWidth / 3 + Math.cos(angle) * (wheelRadius - 3),
        wheelY + Math.sin(angle) * (wheelRadius - 3)
      );
    }
    
    // Right wheel
    car.fillStyle(0x5D4E37, 1);
    car.fillCircle(x + carWidth / 3, wheelY, wheelRadius);
    car.lineStyle(3, 0x3D2A1A, 1);
    car.strokeCircle(x + carWidth / 3, wheelY, wheelRadius);
    car.lineStyle(2, 0x8B6914, 1);
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      car.lineBetween(
        x + carWidth / 3,
        wheelY,
        x + carWidth / 3 + Math.cos(angle) * (wheelRadius - 3),
        wheelY + Math.sin(angle) * (wheelRadius - 3)
      );
    }
    
    // Frame outline (stick border)
    car.lineStyle(4, 0x6B4F10, 1);
    car.strokeRect(x - carWidth / 2, carTop + 10, carWidth, carHeight - 20);
    
    // Front bumper stick
    car.lineStyle(5, 0x8B6914, 1);
    car.lineBetween(x + carWidth / 2 - 5, carTop + 25, x + carWidth / 2 + 8, carTop + 25);
    
    // Headlight (small yellow circle)
    car.fillStyle(0xf1c40f, 1);
    car.fillCircle(x + carWidth / 2 + 3, carTop + 20, 4);
  }

  private createChimneySmoke(x: number, y: number) {
    // Create continuous smoke puffs
    this.time.addEvent({
      delay: 800,
      callback: () => {
        const smoke = this.add.circle(
          x + Phaser.Math.Between(-5, 5),
          y,
          Phaser.Math.Between(6, 10),
          0xcccccc,
          0.6
        );
        
        this.tweens.add({
          targets: smoke,
          y: y - 80,
          x: x + Phaser.Math.Between(-20, 20),
          scale: 2,
          alpha: 0,
          duration: 2500,
          ease: 'Power1',
          onComplete: () => smoke.destroy(),
        });
      },
      loop: true,
    });
  }

  private createSun() {
    const { width } = this.scale;
    
    // Sun glow (larger, semi-transparent)
    this.add.circle(width - 100, 100, 60, 0xffeb3b, 0.3);
    this.add.circle(width - 100, 100, 45, 0xffeb3b, 0.5);
    
    // Sun body
    const sun = this.add.circle(width - 100, 100, 35, 0xffd700);
    
    // Sun rays (simple lines)
    const rays = this.add.graphics();
    rays.lineStyle(3, 0xffd700, 0.6);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const innerRadius = 45;
      const outerRadius = 65;
      rays.lineBetween(
        width - 100 + Math.cos(angle) * innerRadius,
        100 + Math.sin(angle) * innerRadius,
        width - 100 + Math.cos(angle) * outerRadius,
        100 + Math.sin(angle) * outerRadius
      );
    }
    
    // Gentle pulsing animation on sun
    this.tweens.add({
      targets: sun,
      scale: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createBirds() {
    const { } = this.scale; // width/height used in spawnBird
    
    // Create several birds that fly across the screen
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 3000, () => {
        this.spawnBird();
      });
    }
    
    // Continuously spawn birds
    this.time.addEvent({
      delay: 5000,
      callback: () => this.spawnBird(),
      loop: true,
    });
  }

  private spawnBird() {
    const { width, height } = this.scale;
    
    // Random direction (left to right or right to left)
    const goingRight = Phaser.Math.Between(0, 1) === 1;
    const startX = goingRight ? -50 : width + 50;
    const endX = goingRight ? width + 50 : -50;
    const startY = Phaser.Math.Between(80, height * 0.4);
    
    // Bird as a simple "V" shape or bird emoji
    const bird = this.add.text(startX, startY, '🐦', {
      fontSize: '20px',
    }).setOrigin(0.5).setAlpha(0.7);
    
    // Flip bird to face direction of travel
    if (!goingRight) {
      bird.setScale(-1, 1);
    }
    
    // Fly across screen with slight wave motion
    const duration = Phaser.Math.Between(8000, 15000);
    
    this.tweens.add({
      targets: bird,
      x: endX,
      duration: duration,
      ease: 'Linear',
      onComplete: () => bird.destroy(),
    });
    
    // Gentle up-down wave motion
    this.tweens.add({
      targets: bird,
      y: startY + Phaser.Math.Between(-30, 30),
      duration: 1000,
      yoyo: true,
      repeat: Math.floor(duration / 2000),
      ease: 'Sine.easeInOut',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _createOwlShelves() {
    const { width, height } = this.scale;
    
    // Owl shelves logic:
    // Levels 1-3: No shelves
    // Levels 4-6: 1 shelf, increasing owls (1 to 4 owls across these levels)
    // Levels 7-9: 2 shelves, increasing owls (1 to 4 owls total)
    // Level 10+: Boss levels or continue pattern
    
    const levelMod = ((this.level - 1) % 10) + 1; // 1-10 within each world
    
    if (levelMod <= 3) {
      // No shelves for levels 1-3
      return;
    }
    
    // Calculate number of shelves and owls
    let numShelves = 1;
    let numOwls = 1;
    
    if (levelMod >= 4 && levelMod <= 6) {
      // Levels 4-6: 1 shelf
      numShelves = 1;
      numOwls = Math.min(4, levelMod - 3); // 1, 2, 3 owls for levels 4, 5, 6
    } else if (levelMod >= 7 && levelMod <= 9) {
      // Levels 7-9: 2 shelves
      numShelves = 2;
      numOwls = Math.min(4, levelMod - 5); // 2, 3, 4 owls for levels 7, 8, 9
    }
    
    // Position shelves between squirrel and basket
    const squirrelX = 200;
    const basketX = width - 120;
    const midX = (squirrelX + basketX) / 2;
    
    for (let s = 0; s < numShelves; s++) {
      // Shelf positions
      const shelfX = numShelves === 1 
        ? midX 
        : midX + (s === 0 ? -150 : 150);
      const shelfY = height - 200 - (s * 100); // Stagger heights
      
      // Create shelf container
      const shelf = this.add.container(shelfX, shelfY);
      
      // Shelf graphic (wooden plank)
      const shelfGraphic = this.add.graphics();
      shelfGraphic.fillStyle(0x8B4513, 1);
      shelfGraphic.fillRect(-80, 0, 160, 12);
      shelfGraphic.lineStyle(2, 0x5D3A1A, 1);
      shelfGraphic.strokeRect(-80, 0, 160, 12);
      
      // Shelf supports
      shelfGraphic.fillStyle(0x5D3A1A, 1);
      shelfGraphic.fillRect(-75, 12, 8, 30);
      shelfGraphic.fillRect(67, 12, 8, 30);
      
      shelf.add(shelfGraphic);
      this.shelves.push(shelf);
      
      // Distribute owls on this shelf
      const owlsOnThisShelf = Math.ceil(numOwls / numShelves);
      const owlSpacing = 50;
      const startOwlX = -((owlsOnThisShelf - 1) * owlSpacing) / 2;
      
      for (let o = 0; o < owlsOnThisShelf && this.owlFigurines.length < numOwls; o++) {
        const owlX = startOwlX + o * owlSpacing;
        
        // Owl figurine emoji
        const owl = this.add.text(shelfX + owlX, shelfY - 15, '🦉', {
          fontSize: '28px',
        }).setOrigin(0.5, 1);
        
        this.owlFigurines.push({
          sprite: owl,
          knocked: false,
          shelf: s,
        });
      }
    }
  }

  private knockOverOwl(owlIndex: number) {
    const owl = this.owlFigurines[owlIndex];
    if (!owl || owl.knocked) return;
    
    owl.knocked = true;
    
    // Pop animation
    this.tweens.add({
      targets: owl.sprite,
      y: owl.sprite.y - 50,
      rotation: Phaser.Math.Between(-1, 1),
      alpha: 0,
      scale: 1.5,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        owl.sprite.destroy();
      },
    });
    
    // Show +50 points
    const pointsText = this.add.text(owl.sprite.x, owl.sprite.y - 30, '+50', {
      fontSize: '24px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: pointsText,
      y: pointsText.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => pointsText.destroy(),
    });
    
    // Add points
    this.points += 50;
    this.totalPoints += 50;
    this.updateHUD();
  }

  private createTrees() {
    const { width, height } = this.scale;

    // Use level number as seed for consistent but varied trees per level
    const seed = this.level * 12345;
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index * 9999) * 10000;
      return x - Math.floor(x);
    };

    // Number of trees varies by level (4-7)
    const numTrees = 4 + Math.floor(seededRandom(0) * 4);
    
    // Tree shape types
    const treeTypes = ['round', 'tall', 'wide', 'pine'];

    for (let i = 0; i < numTrees; i++) {
      // Varied positions based on level
      const treeX = 100 + seededRandom(i * 10 + 1) * (width - 200);
      const treeHeight = 150 + seededRandom(i * 10 + 2) * 250;
      const treeType = treeTypes[Math.floor(seededRandom(i * 10 + 3) * treeTypes.length)];
      
      // Trunk width varies
      const trunkWidth = 20 + seededRandom(i * 10 + 4) * 20;
      
      // Tree trunk
      this.add.rectangle(
        treeX, 
        height - 60 - treeHeight * 0.15, 
        trunkWidth, 
        treeHeight * 0.35, 
        0x5d4e37
      );

      // Foliage based on tree type and theme
      const theme = this.getWorldTheme();
      const baseColor = theme.treeColor;
      // Slight color variations
      const r = (baseColor >> 16) & 0xff;
      const g = (baseColor >> 8) & 0xff;
      const b = baseColor & 0xff;
      const variation = Math.floor(seededRandom(i * 10 + 5) * 30) - 15;
      const foliageColor = ((Math.max(0, Math.min(255, r + variation))) << 16) | 
                           ((Math.max(0, Math.min(255, g + variation))) << 8) | 
                           (Math.max(0, Math.min(255, b + variation)));

      if (treeType === 'round') {
        // Classic round tree
        this.add.circle(treeX, height - 60 - treeHeight * 0.5, treeHeight * 0.3, foliageColor, 0.85);
        this.add.circle(treeX - 25, height - 60 - treeHeight * 0.4, treeHeight * 0.2, foliageColor, 0.8);
        this.add.circle(treeX + 25, height - 60 - treeHeight * 0.4, treeHeight * 0.2, foliageColor, 0.8);
      } else if (treeType === 'tall') {
        // Tall narrow tree
        this.add.ellipse(treeX, height - 60 - treeHeight * 0.5, treeHeight * 0.25, treeHeight * 0.5, foliageColor, 0.85);
      } else if (treeType === 'wide') {
        // Wide spreading tree
        this.add.ellipse(treeX, height - 60 - treeHeight * 0.4, treeHeight * 0.5, treeHeight * 0.3, foliageColor, 0.85);
        this.add.circle(treeX - 40, height - 60 - treeHeight * 0.35, treeHeight * 0.18, foliageColor, 0.75);
        this.add.circle(treeX + 40, height - 60 - treeHeight * 0.35, treeHeight * 0.18, foliageColor, 0.75);
      } else if (treeType === 'pine') {
        // Pine/triangle tree (pointing UP)
        const pineColor = foliageColor;
        const baseY = height - 60 - treeHeight * 0.3;
        // Bottom layer (widest)
        this.add.triangle(treeX, baseY, 
          0, -treeHeight * 0.35,  // Top point
          -treeHeight * 0.3, treeHeight * 0.15,  // Bottom left
          treeHeight * 0.3, treeHeight * 0.15,   // Bottom right
          pineColor, 0.9);
        // Middle layer
        this.add.triangle(treeX, baseY - treeHeight * 0.25, 
          0, -treeHeight * 0.3,
          -treeHeight * 0.22, treeHeight * 0.12,
          treeHeight * 0.22, treeHeight * 0.12,
          pineColor, 0.85);
        // Top layer (smallest) - slightly lighter
        const lighterPine = ((Math.min(255, ((pineColor >> 16) & 0xff) + 20)) << 16) |
                            ((Math.min(255, ((pineColor >> 8) & 0xff) + 20)) << 8) |
                            (Math.min(255, (pineColor & 0xff) + 20));
        this.add.triangle(treeX, baseY - treeHeight * 0.45, 
          0, -treeHeight * 0.25,
          -treeHeight * 0.15, treeHeight * 0.1,
          treeHeight * 0.15, treeHeight * 0.1,
          lighterPine, 0.9);
      }
    }
  }

  private createLeaves() {
    const theme = this.getWorldTheme();
    const particle = theme.ambientParticle;
    
    for (let i = 0; i < 6; i++) {
      const leaf = this.add.text(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(-100, 0),
        particle,
        { fontSize: '24px' }
      ).setAlpha(0.7).setDepth(200);

      // Different animation for snow/rain (fall straight down)
      const isSnowOrRain = particle === '❄️' || particle === '💧';
      
      this.tweens.add({
        targets: leaf,
        y: this.scale.height + 50,
        x: isSnowOrRain ? leaf.x + Phaser.Math.Between(-20, 20) : leaf.x + Phaser.Math.Between(-100, 100),
        rotation: isSnowOrRain ? 0 : Phaser.Math.Between(-2, 2),
        duration: isSnowOrRain ? Phaser.Math.Between(3000, 6000) : Phaser.Math.Between(8000, 15000),
        repeat: -1,
        onRepeat: () => {
          leaf.setPosition(Phaser.Math.Between(0, this.scale.width), -50);
        },
      });
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.canShoot || this.currentNut) return;

    // Allow aiming from anywhere on the left third of the screen or near squirrel
    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.squirrel.x, this.squirrel.y);
    if (dist < 150 || pointer.x < this.scale.width * 0.35) {
      this.isAiming = true;
      // Start drag from squirrel position for consistent aiming
      this.dragStartPos.set(this.squirrel.x, this.squirrel.y - 30);
      this.dragCurrentPos.set(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isAiming) return;
    this.dragCurrentPos.set(pointer.x, pointer.y);
    this.drawTrajectory();
  }

  private onPointerUp() {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.trajectoryLine.clear();

    const dragDist = Phaser.Math.Distance.Between(
      this.dragStartPos.x, this.dragStartPos.y,
      this.dragCurrentPos.x, this.dragCurrentPos.y
    );

    if (dragDist > 20) {
      this.launchNut();
    }
  }

  private drawTrajectory() {
    this.trajectoryLine.clear();
    
    const startX = this.squirrel.x;
    const startY = this.squirrel.y - 30;

    const dragX = this.dragStartPos.x - this.dragCurrentPos.x;
    const dragY = this.dragStartPos.y - this.dragCurrentPos.y;
    const dragDist = Math.min(Math.sqrt(dragX * dragX + dragY * dragY), this.maxDragDistance);
    const angle = Math.atan2(dragY, dragX);
    const power = (dragDist / this.maxDragDistance) * 800;

    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    // Draw dots
    this.trajectoryLine.fillStyle(0xffffff, 0.8);
    for (let t = 0; t < 1.5; t += 0.05) {
      const x = startX + vx * t;
      const y = startY + vy * t + 0.5 * 400 * t * t;
      if (y > this.scale.height - 60) break;
      if (Math.abs(x - startX) > this.scale.width * 0.5) break;
      this.trajectoryLine.fillCircle(x, y, 4);
    }

    // Draw drag line
    this.trajectoryLine.lineStyle(3, 0xf4d03f, 0.8);
    this.trajectoryLine.lineBetween(startX, startY, this.dragCurrentPos.x, this.dragCurrentPos.y);
  }

  private launchNut() {
    if (this.shotsRemaining <= 0) return;

    this.canShoot = false;
    this.shotsRemaining--;
    this.nutHitRim = false; // Reset for swoosh detection
    this.updateHUD();

    const startX = this.squirrel.x;
    const startY = this.squirrel.y - 30;

    // Create physics body
    const nutBody = this.add.circle(startX, startY, 12, 0x8B4513);
    this.physics.add.existing(nutBody);
    
    const body = nutBody.body as Phaser.Physics.Arcade.Body;

    // Calculate velocity
    const dragX = this.dragStartPos.x - this.dragCurrentPos.x;
    const dragY = this.dragStartPos.y - this.dragCurrentPos.y;
    const dragDist = Math.min(Math.sqrt(dragX * dragX + dragY * dragY), this.maxDragDistance);
    const angle = Math.atan2(dragY, dragX);
    const power = (dragDist / this.maxDragDistance) * 800;

    body.setVelocity(Math.cos(angle) * power, Math.sin(angle) * power);
    body.setBounce(0.75); // More bounce for bank shots!
    body.setDrag(45);
    body.setCircle(12);

    // Create emoji
    const nutEmoji = this.add.text(startX, startY, '🥜', { fontSize: '24px' }).setOrigin(0.5);

    this.currentNut = { body: nutBody, emoji: nutEmoji };

    // Ground collision
    this.physics.add.collider(nutBody, this.ground);
    
    // Backboard collision (for bank shots!) - hitting backboard means no swoosh
    if (this.backboard) {
      this.physics.add.collider(nutBody, this.backboard, () => {
        this.nutHitRim = true; // Hit the backboard, no swoosh
      });
    }

    // Branch collisions - bouncing off branches means no swoosh
    for (const branch of this.branches) {
      this.physics.add.collider(nutBody, branch, () => {
        this.nutHitRim = true;
      });
    }

    // Basket overlap - check if entering from top
    this.physics.add.overlap(nutBody, this.basketZone, () => {
      if (this.hasScored) return;
      
      const body = nutBody.body as Phaser.Physics.Arcade.Body;
      // Only score if nut is moving downward (entering from top)
      if (body && body.velocity.y > 0) {
        this.hasScored = true;
        this.onScore();
      }
    });

    // Spin animation
    this.tweens.add({
      targets: nutEmoji,
      rotation: Math.PI * 6,
      duration: 3000,
      repeat: -1,
    });
  }

  private onScore() {
    if (!this.currentNut) return;

    // Check for SWOOSH - nut didn't hit backboard or rim
    const isSwoosh = !this.nutHitRim;

    // Stop physics on the nut
    const body = this.currentNut.body.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.setAllowGravity(false);
    }

    // Get basket center position for drop animation
    const basketHeight = (this.basket as any).basketHeight || 40;
    const basketBottom = this.basket.y + basketHeight / 2;
    const basketX = this.basket.x;

    // Display SWOOSH if clean entry!
    if (isSwoosh) {
      this.showSwoosh();
    }

    // Animate nut dropping into basket
    this.tweens.add({
      targets: [this.currentNut.body, this.currentNut.emoji],
      x: basketX,
      y: basketBottom - 15,
      scale: 0.7,
      duration: 300,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Small celebration effect
        this.createExplosion(basketX, basketBottom - 20);
        
        this.score++;
        const pointsEarned = isSwoosh ? 110 : 100;
        this.points += pointsEarned;
        this.totalPoints += pointsEarned; // Add to cumulative total
        this.updateHUD();
        this.cleanupNut();
        
        // Check if round is over after scoring
        if (this.shotsRemaining <= 0) {
          this.time.delayedCall(500, () => {
            if (this.score >= 5) {
              this.showWin();
            } else {
              this.showLose();
            }
          });
        }
      }
    });
  }

  private showSwoosh() {
    const { width } = this.scale;
    
    // Big swoosh text at top of screen
    const swooshText = this.add.text(width / 2, 80, '🏀 SWOOSH! 🏀', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200).setScale(0);

    // Animate swoosh text
    this.tweens.add({
      targets: swooshText,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: swooshText,
          scale: 1,
          alpha: 0,
          y: 60,
          duration: 800,
          delay: 500,
          ease: 'Quad.easeIn',
          onComplete: () => swooshText.destroy(),
        });
      },
    });
  }

  private createExplosion(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const particle = this.add.text(x, y, ['💥', '✨', '⭐'][i % 3], { fontSize: '24px' }).setOrigin(0.5);
      const angle = (i / 6) * Math.PI * 2;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private cleanupNut() {
    if (this.currentNut) {
      this.currentNut.body.destroy();
      this.currentNut.emoji.destroy();
      this.currentNut = null;
    }
    this.hasScored = false;
    this.updateHUD();
    this.time.delayedCall(300, () => {
      this.canShoot = true;
    });
  }

  private updateHUD() {
    this.shotsText.setText(`🥜 ${this.shotsRemaining}/20`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.pointsText.setText(`${this.totalPoints} pts`); // Show cumulative total
    
    // Change score color: red when below 5, green when 5+
    if (this.score >= 5) {
      this.scoreText.setColor('#27ae60'); // Green - passing!
    } else {
      this.scoreText.setColor('#e74c3c'); // Red - not yet passing
    }
  }

  private showWin() {
    const { width, height } = this.scale;
    
    // Star rating based on score
    // 5-9 = 1 star, 10-14 = 2 stars, 15+ = 3 stars
    let stars = '⭐☆☆';
    if (this.score >= 15) {
      stars = '⭐⭐⭐';
    } else if (this.score >= 10) {
      stars = '⭐⭐☆';
    }
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(300);
    this.add.text(width / 2, height / 2 - 100, '🎉 LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#f4d03f',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2 - 30, `Score: ${this.score}/20`, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(301);
    
    // Show points earned this level
    this.add.text(width / 2, height / 2 + 10, `+${this.points} pts  (Total: ${this.totalPoints})`, {
      fontSize: '24px',
      color: '#f1c40f',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2 + 60, stars, {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(301);

    this.add.text(width / 2, height / 2 + 140, '[ NEXT LEVEL ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#5d4e37',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const nextLevel = this.level + 1;
        if (nextLevel % 10 === 0) {
          this.scene.start('BossScene', {
            level: nextLevel,
            difficulty: this.difficulty,
            devMode: this.devMode,
            totalPoints: this.totalPoints,
          });
        } else {
          this.scene.start('GameScene', {
            level: nextLevel,
            difficulty: this.difficulty,
            soundEnabled: this.soundEnabled,
            devMode: this.devMode,
            totalPoints: this.totalPoints,
          });
        }
      });
  }

  private showLose() {
    const { width, height } = this.scale;
    
    // Points earned this attempt don't count - keep previous total
    const pointsBeforeThisLevel = this.totalPoints - this.points;
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(300);
    this.add.text(width / 2, height / 2 - 80, '🥜 OUT OF NUTS!', {
      fontSize: '48px',
      color: '#e74c3c',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2, `Score: ${this.score}/20`, {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2 + 40, 'Needed: 5 to pass', {
      fontSize: '20px',
      color: '#999999',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2 + 70, `Total: ${pointsBeforeThisLevel} pts`, {
      fontSize: '20px',
      color: '#f1c40f',
    }).setOrigin(0.5).setDepth(301);

    this.add.text(width / 2, height / 2 + 130, '[ RETRY ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#5d4e37',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene', { 
        level: this.level, 
        difficulty: this.difficulty,
        soundEnabled: this.soundEnabled,
        devMode: this.devMode,
        totalPoints: pointsBeforeThisLevel, // Keep points from before this attempt
      }));
  }

  update() {
    // Move basket (if not level 1)
    if (this.basketSpeed > 0 && this.basket) {
      // Move basket up and down
      this.basket.y += this.basketSpeed * this.basketDirection;
      
      // Bounce off limits
      if (this.basket.y <= this.basketMinY) {
        this.basket.y = this.basketMinY;
        this.basketDirection = 1; // Go down
      } else if (this.basket.y >= this.basketMaxY) {
        this.basket.y = this.basketMaxY;
        this.basketDirection = -1; // Go up
      }
      
      // Move backboard and zone with basket
      const basketHeight = (this.basket as any).basketHeight || 40;
      
      if ((this.basket as any).backboardContainer) {
        (this.basket as any).backboardContainer.y = this.basket.y - basketHeight;
      }
      if (this.backboard && this.backboard.body) {
        this.backboard.y = this.basket.y - basketHeight;
        (this.backboard.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      }
      if (this.basketZone && this.basketZone.body) {
        this.basketZone.y = this.basket.y - basketHeight / 4;
        (this.basketZone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      }
    }

    // Update moving obstacles (birds)
    for (const obstacle of this.movingObstacles) {
      // Move bird
      obstacle.body.x += obstacle.speed * obstacle.direction;
      obstacle.emoji.x = obstacle.body.x;

      // Bounce off patrol boundaries
      if (obstacle.body.x >= obstacle.maxX) {
        obstacle.direction = -1;
        obstacle.emoji.setScale(1, 1); // Face left
      } else if (obstacle.body.x <= obstacle.minX) {
        obstacle.direction = 1;
        obstacle.emoji.setScale(-1, 1); // Face right
      }

      // Check collision with nut
      if (this.currentNut && this.currentNut.body.active) {
        const dist = Phaser.Math.Distance.Between(
          obstacle.body.x, obstacle.body.y,
          this.currentNut.body.x, this.currentNut.body.y
        );
        if (dist < 35) {
          // Deflect the nut!
          const nutBody = this.currentNut.body.body as Phaser.Physics.Arcade.Body;
          if (nutBody) {
            const angle = Phaser.Math.Angle.Between(
              obstacle.body.x, obstacle.body.y,
              this.currentNut.body.x, this.currentNut.body.y
            );
            const deflectForce = 200 + obstacle.speed * 50;
            nutBody.velocity.x = Math.cos(angle) * deflectForce;
            nutBody.velocity.y = Math.sin(angle) * deflectForce - 100;
          }
        }
      }
    }

    // Sync nut emoji with physics body
    if (this.currentNut && this.currentNut.body.active) {
      this.currentNut.emoji.setPosition(this.currentNut.body.x, this.currentNut.body.y);

      // Check collision with owl figurines
      for (let i = 0; i < this.owlFigurines.length; i++) {
        const owl = this.owlFigurines[i];
        if (!owl.knocked && owl.sprite.active) {
          const dist = Phaser.Math.Distance.Between(
            this.currentNut.body.x, this.currentNut.body.y,
            owl.sprite.x, owl.sprite.y - 14 // Adjust for owl center
          );
          if (dist < 25) {
            // Knock over this owl only (nut passes through)
            this.knockOverOwl(i);
            // Nut continues through - doesn't affect trajectory
            break; // Only knock one owl per frame
          }
        }
      }

      // If nut goes off screen, it's a miss (no more wrapping)
      if (this.currentNut.body.x < -30 || this.currentNut.body.x > this.scale.width + 30) {
        this.cleanupNut();
        if (this.shotsRemaining <= 0) {
          this.time.delayedCall(500, () => {
            if (this.score >= 5) {
              this.showWin();
            } else {
              this.showLose();
            }
          });
        }
        return;
      }

      // Check if stopped
      const body = this.currentNut.body.body as Phaser.Physics.Arcade.Body;
      if (body) {
        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        if (speed < 10 && this.currentNut.body.y > this.scale.height - 100) {
          this.cleanupNut();
          
          // Check if round is over (no shots remaining)
          if (this.shotsRemaining <= 0) {
            this.time.delayedCall(500, () => {
              if (this.score >= 5) {
                this.showWin();
              } else {
                this.showLose();
              }
            });
          }
        }
      }
    }
  }
}
