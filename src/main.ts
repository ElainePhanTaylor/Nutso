import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { BossScene } from './scenes/BossScene';
import { HighScoreScene } from './scenes/HighScoreScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 400 },
      debug: false,
    },
  },
  scene: [MainMenuScene, GameScene, BossScene, HighScoreScene],
};

new Phaser.Game(config);

