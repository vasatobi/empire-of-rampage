// ===============================
// main.js — entry point
// ===============================
import Phaser from 'phaser';
import { Game } from 'phaser';
import { MainMenu } from './scenes/MainMenu.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenu, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
};

const game = new Game(config);

// debug handle สำหรับทดสอบอัตโนมัติ (เปิด console แล้วใช้ window.__game ได้)
window.__game = game;
