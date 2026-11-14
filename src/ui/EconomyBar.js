// ===============================
// EconomyBar — แถบเศรษฐกิจ: ภาษี + รายรับ/รายจ่าย (Phase 7)
// ===============================
import { TAX_RATES } from '../data/economy.js';

const FONT = 'Courier New, monospace';

export class EconomyBar {
  // onTaxRate(mult) เรียกเมื่อผู้เล่นเปลี่ยนอัตราภาษี
  constructor(scene, x, y, width, onTaxRate) {
    this.scene = scene;
    this.onTaxRate = onTaxRate;
    this.height = 26;
    this.buttons = [];
    this.taxRate = 1;

    this.bg = scene.add
      .rectangle(x, y, width, this.height, 0x1a1207, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x8b5a2b)
      .setScrollFactor(0)
      .setDepth(50);

    const midY = y + this.height / 2;

    this.taxLabel = scene.add
      .text(x + 8, midY, 'ภาษี:', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#9ca3af',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51);

    let bx = x + 52;
    TAX_RATES.forEach((rate) => {
      const btn = scene.add
        .rectangle(bx, y + 3, 72, 20, 0x2a1f0e, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x8b5a2b)
        .setScrollFactor(0)
        .setDepth(51)
        .setInteractive({ useHandCursor: true });

      const label = scene.add
        .text(bx + 36, midY, rate.label, {
          fontFamily: FONT,
          fontSize: '12px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(52);

      btn.on('pointerover', () => btn.setFillStyle(0x4a3517, 1));
      btn.on('pointerout', () => {
        const active = rate.mult === this.taxRate;
        btn.setFillStyle(active ? 0x4a3517 : 0x2a1f0e, 1);
      });
      btn.on('pointerdown', () => this.onTaxRate(rate.mult));

      this.buttons.push({ rate, btn, label });
      bx += 78;
    });

    this.rateText = scene.add
      .text(x + 300, midY, '', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#e2e8f0',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(51);

    this.marketBtn = scene.add
      .text(x + width - 8, midY, '📜 ตลาด [M]', {
        fontFamily: FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f59e0b',
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(51)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => scene.toggleMarket());
  }

  update({ income = 0, expense = 0, net = 0, taxRate = 1 } = {}) {
    this.taxRate = taxRate;
    this.buttons.forEach(({ rate, btn }) => {
      const active = rate.mult === taxRate;
      btn.setStrokeStyle(1, active ? 0xf59e0b : 0x8b5a2b);
      btn.setFillStyle(active ? 0x4a3517 : 0x2a1f0e, 1);
    });

    const sign = net >= 0 ? '+' : '';
    this.rateText.setText(
      `รายรับ ${income.toFixed(1)}/นาที  |  รายจ่าย ${expense.toFixed(1)}/นาที  |  กำไร ${sign}${net.toFixed(1)}/นาที`
    );
    this.rateText.setColor(net >= 0 ? '#4ade80' : '#ef4444');
  }

  cleanup() {
    this.buttons.forEach(({ btn, label }) => {
      btn.destroy();
      label.destroy();
    });
    this.buttons = [];
    if (this.taxLabel) this.taxLabel.destroy();
    if (this.rateText) this.rateText.destroy();
    if (this.marketBtn) this.marketBtn.destroy();
    if (this.bg) this.bg.destroy();
  }
}
