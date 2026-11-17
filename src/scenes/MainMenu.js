// ===============================
// MainMenu — หน้าเมนูหลัก (เล่นต่อ / เริ่มเกมใหม่ / ลบข้อมูลบันทึก)
// ===============================
import { Scene } from 'phaser';
import { hasSave, deleteSave } from '../systems/save-system.js';

const FONT = 'Courier New, monospace';

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x0a0a0a).setDepth(-1);

    this.add
      .text(400, 150, 'EMPIRE OF RAMPAGE', {
        fontFamily: FONT,
        fontSize: '52px',
        color: '#f59e0b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: { offsetX: 0, offsetY: 0, color: '#000', fill: true, blur: 30 },
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(400, 235, 'City Building / Strategy / Resource Management', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#9ca3af',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5);

    const line = this.add.line(400, 285, 200, 285, 600, 285, [0x1e293b, 0x1e293b, 0x334155], [0, 0, 0, 0]);
    line.setStrokeStyle(2, 0x1e293b);

    this.menuButtons = [];
    this.dialog = null;
    this.hasSave = this.checkSave();
    this.createButtons();

    this.add
      .text(400, 540, 'H/F/R/L/Q: สิ่งก่อสร้าง  |  M: ตลาด  |  P: เมนู  |  คลิกขวา: ลบ', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#9ca3af',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(400, 570, 'v1.0.0 - Empire of Rampage', {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#6b7280',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    this.cameras.main.setSize(800, 600);
    this.scale.on('resize', this.handleResize, this);
  }

  checkSave() {
    const s = getStorage();
    return s ? hasSave(s) : false;
  }

  makeButton(x, y, w, h, label, enabled, onClick, depthBase = 10) {
    const bg = this.add
      .rectangle(x, y, w, h, enabled ? 0x1a1207 : 0x111111, 0.95)
      .setOrigin(0.5)
      .setStrokeStyle(2, enabled ? 0x8b5a2b : 0x333333)
      .setDepth(depthBase);
    const text = this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: enabled ? '#e2e8f0' : '#6b7280',
      })
      .setOrigin(0.5)
      .setDepth(depthBase + 1);

    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(0x4a3517, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1207, 0.95));
      bg.on('pointerdown', onClick);
    }
    return { bg, text };
  }

  createButtons() {
    this.menuButtons.forEach((b) => {
      b.bg.destroy();
      b.text.destroy();
    });
    this.menuButtons = [];

    this.menuButtons.push(this.makeButton(400, 345, 300, 44, 'เล่นต่อ', this.hasSave, () => this.continueGame()));
    this.menuButtons.push(this.makeButton(400, 405, 300, 44, 'เริ่มเกมใหม่', true, () => this.newGame()));
    if (this.hasSave) {
      this.menuButtons.push(this.makeButton(400, 465, 300, 44, 'ลบข้อมูลบันทึก', true, () => this.confirmDelete()));
    }
  }

  continueGame() {
    this.scene.start('GameScene', { mode: 'continue' });
  }

  newGame() {
    if (!this.hasSave) {
      this.scene.start('GameScene', { mode: 'new' });
      return;
    }
    this.showConfirm('เริ่มเกมใหม่จะเขียนทับเซฟเดิมเมื่อบันทึกครั้งถัดไป', () => {
      this.scene.start('GameScene', { mode: 'new' });
    });
  }

  confirmDelete() {
    this.showConfirm('ลบข้อมูลบันทึกทิ้ง?', () => {
      const s = getStorage();
      if (s) deleteSave(s);
      this.hasSave = this.checkSave();
      this.createButtons();
    });
  }

  showConfirm(message, onConfirm) {
    this.closeDialog();

    const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.72).setOrigin(0, 0).setDepth(50).setInteractive();
    const box = this.add.rectangle(400, 300, 440, 190, 0x1a1207, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xf59e0b)
      .setDepth(51);
    const txt = this.add
      .text(400, 272, message, {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5)
      .setDepth(52);
    const yes = this.makeButton(330, 345, 120, 40, 'ยืนยัน', true, () => {
      this.closeDialog();
      onConfirm();
    }, 53);
    const no = this.makeButton(470, 345, 120, 40, 'ยกเลิก', true, () => this.closeDialog(), 53);

    this.dialog = [overlay, box, txt, yes.bg, yes.text, no.bg, no.text];
  }

  closeDialog() {
    if (this.dialog) {
      this.dialog.forEach((o) => o.destroy());
      this.dialog = null;
    }
  }

  handleResize() {}

  update() {}
}
