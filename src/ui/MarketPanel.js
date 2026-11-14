// ===============================
// MarketPanel — แผงซื้อขายทรัพยากร (Phase 7)
// สร้าง object แบบ absolute (ไม่ใช้ Container) เพื่อให้ input ทำงานได้ทุกปุ่ม
// ===============================
import { RESOURCES } from '../data/resources.js';

const FONT = 'Courier New, monospace';
const TRADE_KEYS = ['food', 'wood', 'stone'];

export class MarketPanel {
  // rightX = ขอบขวาของหน้าจอ, topY = ตำแหน่งเริ่มแสดง
  // onTrade(type, key) เรียกเมื่อกดซื้อ/ขาย
  constructor(scene, rightX = 800, topY = 96, onTrade = () => {}) {
    this.scene = scene;
    this.onTrade = onTrade;
    this.W = 252;
    this.H = 300;
    this.x = rightX - this.W - 8;
    this.y = topY;
    this.isOpen = false;
    this.objects = [];
    this.rows = {};
    this.build();
    this.setEnabled(false);
  }

  add(obj) {
    this.objects.push(obj);
    return obj;
  }

  build() {
    const s = this.scene;
    const X = this.x;
    const Y = this.y;
    const W = this.W;
    const H = this.H;

    // พื้นหลัง: interactive เพื่อกันคลิกทะลุไปวางสิ่งก่อสร้าง
    this.add(
      s.add
        .rectangle(X, Y, W, H, 0x1a1207, 0.97)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0xf59e0b)
        .setScrollFactor(0)
        .setDepth(60)
        .setInteractive()
    );

    this.add(
      s.add
        .rectangle(X + 3, Y + 3, W - 6, H - 6, 0x000000, 0)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x8b5a2b)
        .setScrollFactor(0)
        .setDepth(60)
    );

    this.add(
      s.add
        .text(X + W / 2, Y + 16, '📜 ตลาดสินค้า', {
          fontFamily: FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#f59e0b',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(61)
    );

    this.goldText = this.add(
      s.add
        .text(X + 10, Y + 38, '', {
          fontFamily: FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#f59e0b',
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(61)
    );

    const closeBtn = this.add(
      s.add
        .text(X + W - 12, Y + 16, '✕', {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#9ca3af',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(61)
        .setInteractive({ useHandCursor: true })
    );
    closeBtn.on('pointerover', () => closeBtn.setColor('#ef4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#9ca3af'));
    closeBtn.on('pointerdown', () => this.toggle(false));

    TRADE_KEYS.forEach((key, i) => {
      const ry = Y + 66 + i * 62;
      const res = RESOURCES[key];

      this.add(
        s.add
          .text(X + 10, ry, `${res.symbol} ${res.name}`, {
            fontFamily: FONT,
            fontSize: '14px',
            fontStyle: 'bold',
            color: res.color,
          })
          .setOrigin(0, 0.5)
          .setScrollFactor(0)
          .setDepth(61)
      );

      const price = this.add(
        s.add
          .text(X + 10, ry + 18, '', {
            fontFamily: FONT,
            fontSize: '12px',
            color: '#e2e8f0',
          })
          .setOrigin(0, 0.5)
          .setScrollFactor(0)
          .setDepth(61)
      );

      const buyBtn = this.makeButton(X + 10, ry + 32, 108, 20, 'ซื้อ', () =>
        this.onTrade('buy', key)
      );
      const sellBtn = this.makeButton(X + 126, ry + 32, 108, 20, 'ขาย', () =>
        this.onTrade('sell', key)
      );

      this.rows[key] = { price, buyBg: buyBtn.bg, sellBg: sellBtn.bg };
    });

    this.statusText = this.add(
      s.add
        .text(X + W / 2, Y + H - 16, '', {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#4ade80',
          align: 'center',
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(61)
    );
  }

  makeButton(x, y, w, h, label, cb) {
    const bg = this.scene.add
      .rectangle(x, y, w, h, 0x2a1f0e, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x8b5a2b)
      .setScrollFactor(0)
      .setDepth(61)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x + w / 2, y + h / 2, label, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(62);
    this.add(bg);
    this.add(text);
    bg.on('pointerover', () => bg.setFillStyle(0x4a3517, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x2a1f0e, 1));
    bg.on('pointerdown', cb);
    return { bg, text };
  }

  setEnabled(v) {
    this.objects.forEach((o) => {
      o.setVisible(v);
      if (o.input) o.input.enabled = v;
    });
  }

  toggle(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    this.setEnabled(this.isOpen);
    if (this.scene.refreshUI) this.scene.refreshUI();
  }

  isVisible() {
    return this.isOpen;
  }

  update(prices = {}, gold = 0) {
    this.goldText.setText(`👑 ทอง ${gold.toLocaleString()}`);
    TRADE_KEYS.forEach((key) => {
      const p = prices[key];
      if (!p) return;
      this.rows[key].price.setText(
        `ซื้อ ${p.buy}  |  ขาย ${p.sell}  (${Math.round(p.index * 100)}%)`
      );
    });
  }

  showMessage(msg, ok = true) {
    this.statusText.setText(msg);
    this.statusText.setColor(ok ? '#4ade80' : '#ef4444');
    this.scene.time.delayedCall(2200, () => this.statusText.setText(''));
  }

  cleanup() {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
  }
}
