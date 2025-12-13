import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  private selectedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private soundEnabled: boolean = true;
  private devMode: boolean = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2d5a27, 0x2d5a27, 0x1a3d17, 0x1a3d17, 1);
    bg.fillRect(0, 0, width, height);

    // Ambient leaves (cosmetic)
    this.createAmbientLeaves();

    // Greeting
    this.add.text(width / 2, height * 0.15, 'Hello, Ethan!', {
      fontSize: '32px',
      fontFamily: 'Georgia, serif',
      color: '#a9dfbf',
    }).setOrigin(0.5);

    // Title
    this.add.text(width / 2, height * 0.28, '🐿️ NUTSO 🥜', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#f4d03f',
      stroke: '#5d4e37',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Play Button
    this.createButton(width / 2, height * 0.45, '▶  PLAY', () => {
      this.scene.start('GameScene', { 
        level: 1, 
        difficulty: this.selectedDifficulty,
        soundEnabled: this.soundEnabled,
        devMode: this.devMode,
        totalPoints: 0
      });
    });

    // High Scores Button
    this.createSmallButton(width / 2, height * 0.55, '🏆 HIGH SCORES', () => {
      this.scene.start('HighScoreScene', { score: 0, level: 0, isNewScore: false });
    });

    // Difficulty selector
    this.add.text(width / 2, height * 0.6, 'DIFFICULTY', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.createDifficultyButtons(width / 2, height * 0.68);

    // Sound toggle
    this.createSoundToggle(width / 2, height * 0.78);

    // Dev mode toggle
    this.createDevModeToggle(width / 2, height * 0.88);

    // Branding
    this.add.text(width / 2, height - 30, 'Taylor Made Games', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#a9dfbf',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0.8);
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x5d4e37, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 15);
    bg.lineStyle(3, 0xf4d03f, 1);
    bg.strokeRoundedRect(-120, -30, 240, 60, 15);

    const label = this.add.text(0, 0, text, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(240, 60);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.05);
    });

    button.on('pointerout', () => {
      button.setScale(1);
    });

    button.on('pointerdown', callback);

    return button;
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void) {
    const button = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#f1c40f',
      backgroundColor: '#3d2e17',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.05));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);

    return button;
  }

  private createDifficultyButtons(x: number, y: number) {
    const difficulties: Array<{ key: 'easy' | 'medium' | 'hard'; label: string }> = [
      { key: 'easy', label: 'Easy' },
      { key: 'medium', label: 'Medium' },
      { key: 'hard', label: 'Hard' },
    ];

    const buttonWidth = 100;
    const spacing = 20;
    const totalWidth = difficulties.length * buttonWidth + (difficulties.length - 1) * spacing;
    const startX = x - totalWidth / 2 + buttonWidth / 2;

    difficulties.forEach((diff, index) => {
      const btnX = startX + index * (buttonWidth + spacing);
      const isSelected = this.selectedDifficulty === diff.key;

      const container = this.add.container(btnX, y);

      const bg = this.add.graphics();
      bg.fillStyle(isSelected ? 0xf4d03f : 0x5d4e37, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -20, buttonWidth, 40, 10);

      const label = this.add.text(0, 0, diff.label, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: isSelected ? '#5d4e37' : '#ffffff',
      }).setOrigin(0.5);

      container.add([bg, label]);
      container.setSize(buttonWidth, 40);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedDifficulty = diff.key;
        this.scene.restart();
      });
    });
  }

  private createSoundToggle(x: number, y: number) {
    const container = this.add.container(x, y);

    const label = this.add.text(-60, 0, '🔊 Sound:', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.graphics();
    toggleBg.fillStyle(this.soundEnabled ? 0x27ae60 : 0x7f8c8d, 1);
    toggleBg.fillRoundedRect(40, -15, 80, 30, 15);

    const toggleText = this.add.text(80, 0, this.soundEnabled ? 'ON' : 'OFF', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([label, toggleBg, toggleText]);
    container.setSize(200, 40);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.soundEnabled = !this.soundEnabled;
      this.scene.restart();
    });
  }

  private createDevModeToggle(x: number, y: number) {
    const container = this.add.container(x, y);

    const label = this.add.text(-80, 0, '🔧 Dev Mode:', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.graphics();
    toggleBg.fillStyle(this.devMode ? 0xe74c3c : 0x555555, 1);
    toggleBg.fillRoundedRect(40, -12, 60, 24, 12);

    const toggleText = this.add.text(70, 0, this.devMode ? 'ON' : 'OFF', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([label, toggleBg, toggleText]);
    container.setSize(200, 30);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      this.devMode = !this.devMode;
      this.scene.restart();
    });
  }

  private createAmbientLeaves() {
    // Create floating leaves for atmosphere
    for (let i = 0; i < 5; i++) {
      const leaf = this.add.text(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        ['🍂', '🍁', '🍃'][Phaser.Math.Between(0, 2)],
        { fontSize: '32px' }
      );
      leaf.setAlpha(0.6);

      this.tweens.add({
        targets: leaf,
        x: leaf.x + Phaser.Math.Between(-100, 100),
        y: this.scale.height + 50,
        rotation: Phaser.Math.Between(-2, 2),
        duration: Phaser.Math.Between(8000, 15000),
        repeat: -1,
        onRepeat: () => {
          leaf.setPosition(
            Phaser.Math.Between(0, this.scale.width),
            -50
          );
        },
      });
    }
  }
}

