import Phaser from 'phaser';

interface BossData {
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  devMode?: boolean;
  totalPoints?: number;
}

export class BossScene extends Phaser.Scene {
  private level: number = 10;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private devMode: boolean = false;

  private score: number = 0;
  private points: number = 0;
  private totalPoints: number = 0;
  private shotsRemaining: number = 20;
  private isAiming: boolean = false;
  private canShoot: boolean = true;
  private hasScored: boolean = false;

  private squirrel!: Phaser.GameObjects.Text;
  private owl!: Phaser.GameObjects.Container;
  private owlBody!: Phaser.GameObjects.Arc;
  private ground!: Phaser.GameObjects.Rectangle;
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private currentNut: { body: Phaser.GameObjects.Arc; emoji: Phaser.GameObjects.Text } | null = null;

  private dragStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private dragCurrentPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private maxDragDistance: number = 120;

  private scoreText!: Phaser.GameObjects.Text;
  private shotsText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;

  // Owl movement
  private owlSpeed: number = 1;
  private owlDirection: number = 1;

  // Bombs
  private bombs: Phaser.GameObjects.Container[] = [];
  private bombTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'BossScene' });
  }

  init(data: BossData) {
    this.level = data?.level || 10;
    this.difficulty = data?.difficulty || 'medium';
    this.devMode = data?.devMode ?? false;
    this.totalPoints = data?.totalPoints || 0;
    this.score = 0;
    this.points = 0;
    this.shotsRemaining = 20;
    this.isAiming = false;
    this.canShoot = true;
    this.currentNut = null;
    this.hasScored = false;
    this.bombs = [];

    // Boss difficulty scales with level
    const bossNumber = this.level / 10;
    this.owlSpeed = 0.5 + bossNumber * 0.3;
  }

  private getWorldTheme(): { skyColor: number; groundColor: number; mistColor: number } {
    const world = Math.floor((this.level - 1) / 10);
    const themes = [
      { skyColor: 0x2c4a3f, groundColor: 0x2a4a27, mistColor: 0x98d8c8 }, // Spring Meadow (darker)
      { skyColor: 0x1a2a1a, groundColor: 0x1d3a17, mistColor: 0x4a6741 }, // Deep Woods (darker)
      { skyColor: 0x6b4423, groundColor: 0x5b3914, mistColor: 0xcd853f }, // Autumn Forest (darker)
      { skyColor: 0x4a5a6a, groundColor: 0x3a4a4a, mistColor: 0x9fb6c2 }, // Misty Hollow (darker)
      { skyColor: 0x3a4a5a, groundColor: 0x2a3a3a, mistColor: 0x708090 }, // Rainy Grove (darker)
      { skyColor: 0x7a3f28, groundColor: 0x4a2a1a, mistColor: 0xff7f50 }, // Sunset Canopy (darker)
      { skyColor: 0x0a0a1a, groundColor: 0x0a0a1a, mistColor: 0x191970 }, // Moonlit Woods (darker)
      { skyColor: 0x5a7a8a, groundColor: 0x8a9aaa, mistColor: 0xb0c4de }, // Snowy Pines (darker)
      { skyColor: 0x3a2a4a, groundColor: 0x2a1a3a, mistColor: 0x9370db }, // Enchanted Glade (darker)
      { skyColor: 0x1a1a2e, groundColor: 0x0a0a1e, mistColor: 0x9b59b6 }, // Phantom Realm (darker)
    ];
    return themes[Math.min(world, themes.length - 1)];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.getWorldTheme();

    // Themed dark background for boss
    this.add.rectangle(width / 2, height / 2, width, height, theme.skyColor);

    // Spooky mist effect (themed)
    for (let i = 0; i < 3; i++) {
      const mist = this.add.ellipse(
        width / 2 + Phaser.Math.Between(-200, 200),
        height - 100,
        400,
        60,
        theme.mistColor,
        0.2
      );
      this.tweens.add({
        targets: mist,
        x: mist.x + 100,
        alpha: 0.1,
        duration: 4000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Ground (themed)
    this.ground = this.add.rectangle(width / 2, height - 30, width, 60, theme.groundColor);
    this.physics.add.existing(this.ground, true);

    // Squirrel
    this.squirrel = this.add.text(150, height - 100, '🐿️', { fontSize: '64px' })
      .setOrigin(0.5)
      .setScale(-1, 1);

    // Phantom Owl
    this.createOwl();

    // Trajectory line
    this.trajectoryLine = this.add.graphics();

    // HUD
    this.createHUD();

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Start bomb throwing
    this.startBombAttack();

    // Boss title
    const bossNumber = this.level / 10;
    this.add.text(width / 2, 80, `👻 PHANTOM OWL - Stage ${bossNumber}`, {
      fontSize: '28px',
      color: '#9b59b6',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.add.text(width / 2, 110, 'Hit the belly 15 times!', {
      fontSize: '18px',
      color: '#bdc3c7',
    }).setOrigin(0.5).setDepth(100);
  }

  private createOwl() {
    const { width, height } = this.scale;

    this.owl = this.add.container(width - 200, height / 2);

    // Owl body (ghostly, transparent)
    const bodyGlow = this.add.circle(0, 0, 70, 0x9b59b6, 0.2);
    const body = this.add.circle(0, 0, 55, 0x8e44ad, 0.5);
    this.owlBody = body;

    // Belly (target area - slightly brighter)
    const belly = this.add.circle(0, 15, 30, 0xc39bd3, 0.6);
    belly.setStrokeStyle(2, 0xffffff, 0.5);

    // Eyes (glowing)
    const leftEye = this.add.circle(-20, -20, 12, 0xf1c40f, 0.9);
    const rightEye = this.add.circle(20, -20, 12, 0xf1c40f, 0.9);
    const leftPupil = this.add.circle(-20, -20, 5, 0x000000, 1);
    const rightPupil = this.add.circle(20, -20, 5, 0x000000, 1);

    // Ear tufts
    const leftEar = this.add.triangle(-35, -50, 0, 20, 10, 0, 20, 20, 0x8e44ad, 0.5);
    const rightEar = this.add.triangle(35, -50, 0, 20, 10, 0, 20, 20, 0x8e44ad, 0.5);

    // Beak
    const beak = this.add.triangle(0, 0, 0, 10, -8, 0, 8, 0, 0xe67e22, 0.8);

    // Wings
    const leftWing = this.add.ellipse(-60, 10, 30, 50, 0x8e44ad, 0.4);
    const rightWing = this.add.ellipse(60, 10, 30, 50, 0x8e44ad, 0.4);

    this.owl.add([bodyGlow, body, belly, leftEar, rightEar, leftEye, rightEye, leftPupil, rightPupil, beak, leftWing, rightWing]);

    // Ghostly floating animation
    this.tweens.add({
      targets: this.owl,
      y: this.owl.y - 20,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulsing glow
    this.tweens.add({
      targets: [body, bodyGlow],
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Wing flap
    this.tweens.add({
      targets: [leftWing, rightWing],
      scaleY: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // Create belly hitzone
    const bellyZone = this.add.zone(0, 15, 60, 60);
    this.owl.add(bellyZone);
    this.physics.add.existing(bellyZone, true);
    (this.owl as any).bellyZone = bellyZone;
  }

  private createHUD() {
    const { width } = this.scale;

    this.add.rectangle(width / 2, 25, width, 50, 0x000000, 0.7).setDepth(100);

    this.add.text(20, 25, `Boss ${this.level / 10}`, {
      fontSize: '24px',
      color: '#9b59b6',
    }).setOrigin(0, 0.5).setDepth(101);

    this.shotsText = this.add.text(width / 2 - 80, 25, `🥜 ${this.shotsRemaining}/20`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(101);

    this.scoreText = this.add.text(width / 2 + 60, 25, `Hits: ${this.score}/15`, {
      fontSize: '24px',
      color: this.score >= 15 ? '#27ae60' : '#e74c3c',
    }).setOrigin(0, 0.5).setDepth(101);

    // Points display
    this.pointsText = this.add.text(width / 2 + 220, 25, `${this.points} pts`, {
      fontSize: '20px',
      color: '#f1c40f', // Gold color
    }).setOrigin(0, 0.5).setDepth(101);

    this.add.text(width - 40, 25, '🏠', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (this.devMode) {
      // Skip 1 level (go to next level after boss)
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
    
    // Clean up
    if (this.bombTimer) this.bombTimer.destroy();
    
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
        soundEnabled: true,
        devMode: this.devMode,
        totalPoints: this.totalPoints,
      });
    }
  }

  private startBombAttack() {
    const bossNumber = this.level / 10;
    const bombDelay = Math.max(3000 - bossNumber * 200, 1000);

    this.bombTimer = this.time.addEvent({
      delay: bombDelay,
      callback: () => this.throwBomb(),
      loop: true,
    });
  }

  private throwBomb() {
    const bomb = this.add.container(this.owl.x, this.owl.y + 30);

    const bombBody = this.add.circle(0, 0, 15, 0x9b59b6, 0.8);
    const bombGlow = this.add.circle(0, 0, 20, 0xc39bd3, 0.3);
    bomb.add([bombGlow, bombBody]);

    this.bombs.push(bomb);

    // Bomb falls toward squirrel area
    this.tweens.add({
      targets: bomb,
      x: Phaser.Math.Between(100, 400),
      y: this.scale.height - 80,
      duration: 1500,
      ease: 'Quad.easeIn',
      onComplete: () => this.explodeBomb(bomb),
    });
  }

  private explodeBomb(bomb: Phaser.GameObjects.Container) {
    const x = bomb.x;
    const y = bomb.y;

    // Remove from array
    const idx = this.bombs.indexOf(bomb);
    if (idx > -1) this.bombs.splice(idx, 1);
    bomb.destroy();

    // Explosion effect
    const explosion = this.add.circle(x, y, 10, 0x9b59b6, 0.8);
    this.tweens.add({
      targets: explosion,
      scale: 5,
      alpha: 0,
      duration: 500,
      onComplete: () => explosion.destroy(),
    });

    // Push nut if nearby
    if (this.currentNut) {
      const dist = Phaser.Math.Distance.Between(x, y, this.currentNut.body.x, this.currentNut.body.y);
      if (dist < 100) {
        const body = this.currentNut.body.body as Phaser.Physics.Arcade.Body;
        if (body) {
          const angle = Phaser.Math.Angle.Between(x, y, this.currentNut.body.x, this.currentNut.body.y);
          const force = (100 - dist) * 5;
          body.velocity.x += Math.cos(angle) * force;
          body.velocity.y += Math.sin(angle) * force;
        }
      }
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.canShoot || this.currentNut) return;

    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.squirrel.x, this.squirrel.y);
    if (dist < 150 || pointer.x < this.scale.width * 0.35) {
      this.isAiming = true;
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

    this.trajectoryLine.fillStyle(0xffffff, 0.8);
    for (let t = 0; t < 1.5; t += 0.05) {
      const x = startX + vx * t;
      const y = startY + vy * t + 0.5 * 400 * t * t;
      if (y > this.scale.height - 60) break;
      if (Math.abs(x - startX) > this.scale.width * 0.5) break;
      this.trajectoryLine.fillCircle(x, y, 4);
    }

    this.trajectoryLine.lineStyle(3, 0x9b59b6, 0.8);
    this.trajectoryLine.lineBetween(startX, startY, this.dragCurrentPos.x, this.dragCurrentPos.y);
  }

  private launchNut() {
    if (this.shotsRemaining <= 0) return;

    this.canShoot = false;
    this.shotsRemaining--;
    this.hasScored = false;
    this.updateHUD();

    const startX = this.squirrel.x;
    const startY = this.squirrel.y - 30;

    const nutBody = this.add.circle(startX, startY, 12, 0x8B4513);
    this.physics.add.existing(nutBody);

    const body = nutBody.body as Phaser.Physics.Arcade.Body;

    const dragX = this.dragStartPos.x - this.dragCurrentPos.x;
    const dragY = this.dragStartPos.y - this.dragCurrentPos.y;
    const dragDist = Math.min(Math.sqrt(dragX * dragX + dragY * dragY), this.maxDragDistance);
    const angle = Math.atan2(dragY, dragX);
    const power = (dragDist / this.maxDragDistance) * 800;

    body.setVelocity(Math.cos(angle) * power, Math.sin(angle) * power);
    body.setBounce(0.6);
    body.setDrag(30);
    body.setCircle(12);

    const nutEmoji = this.add.text(startX, startY, '🥜', { fontSize: '24px' }).setOrigin(0.5);

    this.currentNut = { body: nutBody, emoji: nutEmoji };

    this.physics.add.collider(nutBody, this.ground);

    // Owl belly collision
    const bellyZone = (this.owl as any).bellyZone;
    if (bellyZone) {
      this.physics.add.overlap(nutBody, bellyZone, () => {
        if (!this.hasScored) {
          this.hasScored = true;
          this.onHit();
        }
      });
    }

    this.tweens.add({
      targets: nutEmoji,
      rotation: Math.PI * 6,
      duration: 3000,
      repeat: -1,
    });
  }

  private onHit() {
    if (!this.currentNut) return;

    // Flash owl
    this.tweens.add({
      targets: this.owlBody,
      alpha: 1,
      duration: 100,
      yoyo: true,
      repeat: 3,
    });

    // Hit effect
    const hitX = this.owl.x;
    const hitY = this.owl.y + 15;
    for (let i = 0; i < 5; i++) {
      const spark = this.add.circle(hitX, hitY, 5, 0xf1c40f);
      this.tweens.add({
        targets: spark,
        x: hitX + Phaser.Math.Between(-50, 50),
        y: hitY + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: 300,
        onComplete: () => spark.destroy(),
      });
    }

    this.score++;
    this.points += 100; // 100 points per hit
    this.totalPoints += 100; // Add to cumulative total
    this.updateHUD();
    this.cleanupNut();
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
    this.scoreText.setText(`Hits: ${this.score}/15`);
    this.scoreText.setColor(this.score >= 15 ? '#27ae60' : '#e74c3c');
    this.pointsText.setText(`${this.totalPoints} pts`); // Show cumulative total
  }

  private showWin() {
    this.bombTimer?.destroy();
    const { width, height } = this.scale;

    // Tornado animation for owl defeat
    this.tweens.add({
      targets: this.owl,
      rotation: Math.PI * 8,
      scale: 0,
      y: -100,
      duration: 2000,
      ease: 'Power2',
    });

    this.time.delayedCall(2000, () => {
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(300);

      this.add.text(width / 2, height / 2 - 80, '🌪️ BOSS DEFEATED! 🌪️', {
        fontSize: '48px',
        color: '#9b59b6',
      }).setOrigin(0.5).setDepth(301);

      this.add.text(width / 2, height / 2 - 10, `Hits: ${this.score}/20`, {
        fontSize: '32px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(301);
      
      this.add.text(width / 2, height / 2 + 30, `+${this.points} pts  (Total: ${this.totalPoints})`, {
        fontSize: '24px',
        color: '#f1c40f',
      }).setOrigin(0.5).setDepth(301);

      this.add.text(width / 2, height / 2 + 110, '[ CONTINUE ]', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#9b59b6',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.scene.start('GameScene', {
            level: this.level + 1,
            difficulty: this.difficulty,
            devMode: this.devMode,
            totalPoints: this.totalPoints,
          });
        });
    });
  }

  private showLose() {
    this.bombTimer?.destroy();
    const { width, height } = this.scale;
    
    // Points earned this attempt don't count
    const pointsBeforeThisLevel = this.totalPoints - this.points;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(300);

    this.add.text(width / 2, height / 2 - 60, '💀 DEFEATED!', {
      fontSize: '48px',
      color: '#e74c3c',
    }).setOrigin(0.5).setDepth(301);

    this.add.text(width / 2, height / 2 + 10, `Hits: ${this.score}/15 needed`, {
      fontSize: '24px',
      color: '#999999',
    }).setOrigin(0.5).setDepth(301);
    
    this.add.text(width / 2, height / 2 + 50, `Total: ${pointsBeforeThisLevel} pts`, {
      fontSize: '20px',
      color: '#f1c40f',
    }).setOrigin(0.5).setDepth(301);

    this.add.text(width / 2, height / 2 + 120, '[ RETRY ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#5d4e37',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('BossScene', {
        level: this.level,
        difficulty: this.difficulty,
        devMode: this.devMode,
        totalPoints: pointsBeforeThisLevel,
      }));
  }

  update() {
    // Move owl
    this.owl.x += this.owlSpeed * this.owlDirection;
    if (this.owl.x > this.scale.width - 100 || this.owl.x < this.scale.width / 2) {
      this.owlDirection *= -1;
    }

    // Update belly zone position
    const bellyZone = (this.owl as any).bellyZone;
    if (bellyZone && bellyZone.body) {
      (bellyZone.body as Phaser.Physics.Arcade.StaticBody).position.set(
        this.owl.x - 30,
        this.owl.y - 15
      );
    }

    // Sync nut
    if (this.currentNut && this.currentNut.body.active) {
      this.currentNut.emoji.setPosition(this.currentNut.body.x, this.currentNut.body.y);

      // Off screen = miss
      if (this.currentNut.body.x < -30 || this.currentNut.body.x > this.scale.width + 30 ||
          this.currentNut.body.y > this.scale.height + 30) {
        this.cleanupNut();
        if (this.shotsRemaining <= 0 && this.score < 15) {
          this.time.delayedCall(500, () => this.showLose());
        }
        return;
      }

      // Check if stopped
      const body = this.currentNut.body.body as Phaser.Physics.Arcade.Body;
      if (body) {
        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        if (speed < 10 && this.currentNut.body.y > this.scale.height - 100) {
          this.cleanupNut();
          if (this.shotsRemaining <= 0 && this.score < 15) {
            this.time.delayedCall(500, () => this.showLose());
          }
        }
      }
    }

    // Check win
    if (this.score >= 15 && !this.currentNut) {
      this.time.delayedCall(500, () => this.showWin());
      this.score = 999; // Prevent multiple triggers
    }
  }
}


