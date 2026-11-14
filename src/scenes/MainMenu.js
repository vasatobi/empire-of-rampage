// ===============================
// MainMenu — หน้าเมนูหลัก
// ===============================
import { Scene } from 'phaser';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    // Background with gradient effect
    const bg = this.add.rectangle(400, 300, 800, 600, 0x0a0a0a);
    bg.setDepth(-1);

    // Title with glow effect
    const title = this.add.text(400, 180, 'EMPIRE OF RAMPAGE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '52px',
      color: '#f59e0b',
      bold: true,
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#000', fill: true, blur: 30 },
    }).setOrigin(0.5, 0.5);

    // Subtitle
    const subtitle = this.add.text(400, 270, 'City Building / Strategy / Resource Management', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#9ca3af',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);

    // Decorative line
    const line = this.add.line(400, 320, 200, 320, 600, 320, [0x1e293b, 0x1e293b, 0x334155], [0, 0, 0, 0]);
    line.setStrokeStyle(2, 0x1e293b);

    // Start button
    this.startBtn = this.add.text(400, 380, '▶  START', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#34d399',
      bold: true,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.startBtn.setColor('#6ee7b7');
        this.startBtn.setScale(1.05);
      })
      .on('pointerout', () => {
        this.startBtn.setColor('#34d399');
        this.startBtn.setScale(1);
      })
      .on('pointerdown', () => {
        this.startButtonDown();
      });

    // Instructions
    const instructions = this.add.text(400, 480, 'H/F/R/L/Q: สิ่งก่อสร้าง  |  M: ตลาด  |  คลิกขวา: ลบ', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#9ca3af',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    const version = this.add.text(400, 520, 'v1.0.0 - Empire of Rampage', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#6b7280',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // Set canvas size
    this.cameras.main.setSize(800, 600);

    // Resize handling
    this.scale.on('resize', this.handleResize, this);
  }

  startButtonDown() {
    // Visual feedback
    this.startBtn.setColor('#22c55e');
    this.startBtn.setScale(0.95);
    this.time.delayedCall(100, () => {
      this.startBtn.setColor('#34d399');
      this.startBtn.setScale(1);
      this.startGame();
    });
  }

  handleResize() {
    // Adjust canvas size
  }

  startGame() {
    this.scene.start('GameScene');
  }

  update() {
    // Update nothing for menu
  }
}
