import Phaser from 'phaser';
import { getHighScores, saveHighScore, isHighScore, HighScoreEntry } from '../data/highScores';

interface HighScoreData {
  score: number;
  level: number;
  isNewScore?: boolean;
}

export class HighScoreScene extends Phaser.Scene {
  private score: number = 0;
  private level: number = 1;
  private isNewScore: boolean = false;
  private initials: string[] = ['A', 'A', 'A'];
  private currentPosition: number = 0;
  private letterTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'HighScoreScene' });
  }

  init(data: HighScoreData) {
    this.score = data?.score || 0;
    this.level = data?.level || 1;
    this.isNewScore = data?.isNewScore ?? isHighScore(this.score);
    this.initials = ['A', 'A', 'A'];
    this.currentPosition = 0;
    this.letterTexts = [];
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 60, '🏆 HIGH SCORES 🏆', {
      fontSize: '48px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.isNewScore) {
      this.createInitialsEntry();
    } else {
      this.displayHighScores();
    }
  }

  private createInitialsEntry() {
    const { width } = this.scale;

    // Congrats message
    this.add.text(width / 2, 130, '🎉 NEW HIGH SCORE! 🎉', {
      fontSize: '32px',
      color: '#27ae60',
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, `Score: ${this.score.toLocaleString()} pts`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, 230, 'Enter your initials:', {
      fontSize: '24px',
      color: '#bdc3c7',
    }).setOrigin(0.5);

    // Letter selection boxes
    const startX = width / 2 - 80;
    for (let i = 0; i < 3; i++) {
      // Box background
      const box = this.add.rectangle(startX + i * 60, 300, 50, 60, 0x2c3e50);
      box.setStrokeStyle(3, i === 0 ? 0xf1c40f : 0x7f8c8d);
      
      // Letter
      const letter = this.add.text(startX + i * 60, 300, this.initials[i], {
        fontSize: '40px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
      this.letterTexts.push(letter);
      
      // Make boxes interactive
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => this.selectPosition(i));
    }

    // Up/Down arrows
    this.add.text(width / 2, 370, '▲', {
      fontSize: '40px',
      color: '#3498db',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeLetter(1));

    this.add.text(width / 2, 420, '▼', {
      fontSize: '40px',
      color: '#3498db',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.changeLetter(-1));

    // Instructions
    this.add.text(width / 2, 480, 'Click ▲/▼ to change letter, click box to select', {
      fontSize: '16px',
      color: '#7f8c8d',
    }).setOrigin(0.5);

    // Submit button
    this.add.text(width / 2, 550, '[ SUBMIT ]', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 30, y: 15 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.submitScore());

    // Keyboard support
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        this.changeLetter(1);
      } else if (event.key === 'ArrowDown') {
        this.changeLetter(-1);
      } else if (event.key === 'ArrowRight') {
        this.selectPosition((this.currentPosition + 1) % 3);
      } else if (event.key === 'ArrowLeft') {
        this.selectPosition((this.currentPosition + 2) % 3);
      } else if (event.key === 'Enter') {
        this.submitScore();
      } else if (event.key.length === 1 && event.key.match(/[A-Za-z]/)) {
        this.initials[this.currentPosition] = event.key.toUpperCase();
        this.letterTexts[this.currentPosition].setText(this.initials[this.currentPosition]);
        this.selectPosition((this.currentPosition + 1) % 3);
      }
    });
  }

  private selectPosition(pos: number) {
    this.currentPosition = pos;
    // Update box highlights
    this.children.each((child) => {
      if (child instanceof Phaser.GameObjects.Rectangle) {
        const idx = Math.round((child.x - (this.scale.width / 2 - 80)) / 60);
        if (idx >= 0 && idx < 3) {
          child.setStrokeStyle(3, idx === pos ? 0xf1c40f : 0x7f8c8d);
        }
      }
    });
  }

  private changeLetter(delta: number) {
    const current = this.initials[this.currentPosition].charCodeAt(0);
    let next = current + delta;
    if (next > 90) next = 65; // Wrap Z -> A
    if (next < 65) next = 90; // Wrap A -> Z
    this.initials[this.currentPosition] = String.fromCharCode(next);
    this.letterTexts[this.currentPosition].setText(this.initials[this.currentPosition]);
  }

  private submitScore() {
    const entry: HighScoreEntry = {
      initials: this.initials.join(''),
      score: this.score,
      level: this.level,
      date: new Date().toISOString().split('T')[0],
    };
    
    saveHighScore(entry);
    
    // Show the high score table
    this.scene.restart({ score: 0, level: 0, isNewScore: false });
  }

  private displayHighScores() {
    const { width, height } = this.scale;
    const scores = getHighScores();

    // Table header
    this.add.text(width / 2 - 180, 140, 'RANK', { fontSize: '20px', color: '#f1c40f' });
    this.add.text(width / 2 - 80, 140, 'NAME', { fontSize: '20px', color: '#f1c40f' });
    this.add.text(width / 2 + 20, 140, 'SCORE', { fontSize: '20px', color: '#f1c40f' });
    this.add.text(width / 2 + 140, 140, 'LVL', { fontSize: '20px', color: '#f1c40f' });

    // Score entries
    scores.forEach((entry, index) => {
      const y = 180 + index * 40;
      const color = index < 3 ? '#f1c40f' : '#ffffff';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      
      this.add.text(width / 2 - 180, y, `${medal} ${index + 1}`, { fontSize: '24px', color });
      this.add.text(width / 2 - 80, y, entry.initials, { fontSize: '24px', color, fontStyle: 'bold' });
      this.add.text(width / 2 + 20, y, entry.score.toLocaleString(), { fontSize: '24px', color });
      this.add.text(width / 2 + 140, y, `${entry.level}`, { fontSize: '24px', color });
    });

    // Back to menu button
    this.add.text(width / 2, height - 80, '[ MAIN MENU ]', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#5d4e37',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}

