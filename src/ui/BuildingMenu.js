// ===============================
// BuildingMenu — แถบเลือกสิ่งก่อสร้างด้านล่างจอ
// ===============================
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';

const FONT = 'Courier New, monospace';
const HOTKEYS = { house: 'H', farm: 'F', road: 'R' };

const BUTTON_W = 180;
const BUTTON_H = 58;
const GAP = 12;

export class BuildingMenu {
  // centerX = กึ่งกลางแนวนอน, bottomY = ขอบล่างของแถบ (พิกัดหน้าจอ)
  // onSelect(id) จะถูกเรียกเมื่อคลิกปุ่ม
  constructor(scene, centerX, bottomY, onSelect = () => {}) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.selectedBuilding = null;
    this.buttons = [];

    const ids = Object.keys(BUILDINGS);
    const totalW = ids.length * BUTTON_W + (ids.length - 1) * GAP;
    const startX = centerX - totalW / 2;
    const top = bottomY - BUTTON_H;

    ids.forEach((id, i) => {
      const def = BUILDINGS[id];
      const bx = startX + i * (BUTTON_W + GAP);

      // คลิกทะลุปุ่มลงไปวางของบนแผนที่ไม่ได้ เพราะปุ่มเป็น interactive object
      const bg = scene.add
        .rectangle(bx, top, BUTTON_W, BUTTON_H, 0x0a0a0a, 0.9)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x1e293b)
        .setScrollFactor(0)
        .setDepth(50)
        .setInteractive({ useHandCursor: true });

      const hotkey = HOTKEYS[id] ? ` [${HOTKEYS[id]}]` : '';
      const title = scene.add
        .text(bx + 10, top + 8, `${def.icon} ${def.name}${hotkey}`, {
          fontFamily: FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#e2e8f0',
        })
        .setScrollFactor(0)
        .setDepth(51);

      const costLabel = Object.entries(def.cost)
        .map(([key, amount]) => `${RESOURCES[key]?.name ?? key} ${amount}`)
        .join('  ');
      const cost = scene.add
        .text(bx + 10, top + 32, costLabel, {
          fontFamily: FONT,
          fontSize: '14px',
          color: '#9ca3af',
        })
        .setScrollFactor(0)
        .setDepth(51);

      bg.on('pointerover', () => {
        if (this.selectedBuilding !== id) bg.setFillStyle(0x1e293b, 0.95);
      });
      bg.on('pointerout', () => {
        if (this.selectedBuilding !== id) bg.setFillStyle(0x0a0a0a, 0.9);
      });
      bg.on('pointerdown', () => this.onSelect(id));

      this.buttons.push({ id, bg, title, cost });
    });
  }

  // id = สิ่งก่อสร้างที่เลือกอยู่ หรือ null ถ้าไม่ได้เลือก
  setSelected(id) {
    this.selectedBuilding = id;
    this.buttons.forEach((b) => {
      const active = b.id === id;
      b.bg.setStrokeStyle(2, active ? 0xf59e0b : 0x1e293b);
      b.bg.setFillStyle(active ? 0x1e293b : 0x0a0a0a, active ? 0.95 : 0.9);
    });
  }

  cleanup() {
    this.buttons.forEach((b) => {
      b.bg.destroy();
      b.title.destroy();
      b.cost.destroy();
    });
    this.buttons = [];
  }
}
