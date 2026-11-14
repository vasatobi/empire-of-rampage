// ===============================
// ResourceBar — แถบทรัพยากร + ประชากร + ความสุข (Phase 7)
// ===============================
import { RESOURCES } from '../data/resources.js';

const FONT = 'Courier New, monospace';

export class ResourceBar {
  constructor(scene, x = 0, y = 0, width = 800) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 36;
    this.items = [];

    // พื้นหลังแถบ (ติดกับหน้าจอ ไม่เลื่อนตามกล้อง)
    this.bg = scene.add
      .rectangle(x, y, width, this.height, 0x0a0a0a, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x8b5a2b)
      .setScrollFactor(0)
      .setDepth(50);

    const keys = Object.keys(RESOURCES);
    const slots = keys.length + 2; // ทรัพยากรทุกชนิด + ประชากร + ความสุข
    const slotWidth = width / slots;
    const midY = y + this.height / 2;

    keys.forEach((key, i) => {
      const res = RESOURCES[key];
      const text = scene.add
        .text(x + i * slotWidth + 8, midY, '', {
          fontFamily: FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          color: res.color,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(51);
      this.items.push({ key, text, last: null });
    });

    this.popText = scene.add
      .text(x + keys.length * slotWidth + 8, midY, '', {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e2e8f0',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51);
    this.lastPop = null;

    this.happyText = scene.add
      .text(x + (keys.length + 1) * slotWidth + 8, midY, '', {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#4ade80',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51);
    this.lastHappy = null;

    this.update();
  }

  // เรียกทุกครั้งที่ค่าเปลี่ยน (เรียกบ่อยได้ เพราะเปลี่ยนข้อความเฉพาะเมื่อค่าไม่เหมือนเดิม)
  update(stats = {}) {
    this.items.forEach((item) => {
      const res = RESOURCES[item.key];
      const current = res.current ?? res.base ?? 0;
      if (item.last !== current) {
        item.last = current;
        item.text.setText(`${res.symbol} ${res.name} ${current.toLocaleString()}`);
      }
    });

    const pop = stats.population ?? 0;
    const cap = stats.capacity ?? 0;
    const popLabel = `👥 ${pop}/${cap}`;
    if (this.lastPop !== popLabel) {
      this.lastPop = popLabel;
      this.popText.setText(popLabel);
    }

    const happy = stats.happiness ?? 0;
    const face = happy >= 70 ? '😊' : happy >= 40 ? '😐' : '😡';
    const happyLabel = `${face} ${happy}`;
    if (this.lastHappy !== happyLabel) {
      this.lastHappy = happyLabel;
      this.happyText.setText(happyLabel);
      this.happyText.setColor(happy >= 70 ? '#4ade80' : happy >= 40 ? '#facc15' : '#ef4444');
    }
  }

  cleanup() {
    this.items.forEach((item) => item.text.destroy());
    this.items = [];
    if (this.popText) this.popText.destroy();
    if (this.happyText) this.happyText.destroy();
    if (this.bg) this.bg.destroy();
  }
}
