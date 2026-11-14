// ===============================
// ResourceBar — แถบแสดงทรัพยากรด้านบนจอ
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
      .rectangle(x, y, width, this.height, 0x0a0a0a, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1e293b)
      .setScrollFactor(0)
      .setDepth(50);

    const keys = Object.keys(RESOURCES);
    const slots = keys.length + 1; // ทรัพยากรทุกชนิด + ประชากร
    const slotWidth = width / slots;
    const midY = y + this.height / 2;

    keys.forEach((key, i) => {
      const res = RESOURCES[key];
      const text = scene.add
        .text(x + i * slotWidth + 12, midY, '', {
          fontFamily: FONT,
          fontSize: '15px',
          fontStyle: 'bold',
          color: res.color,
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(51);
      this.items.push({ key, text, last: null });
    });

    this.popText = scene.add
      .text(x + keys.length * slotWidth + 12, midY, '', {
        fontFamily: FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#e2e8f0',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51);
    this.lastPop = null;

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
    if (this.lastPop !== pop) {
      this.lastPop = pop;
      this.popText.setText(`👥 ประชากร ${pop.toLocaleString()}`);
    }
  }

  cleanup() {
    this.items.forEach((item) => item.text.destroy());
    this.items = [];
    if (this.popText) this.popText.destroy();
    if (this.bg) this.bg.destroy();
  }
}
