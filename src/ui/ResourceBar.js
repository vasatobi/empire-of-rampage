// ===============================
// ResourceBar — แถบแสดงทรัพยากร
// ===============================
import { RESOURCES, getResource } from '../data/resources.js';

export class ResourceBar {
  constructor(scene, x, y, width = 400) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.items = [];

    // Header
    this.header = scene.add.text(x, y, 'เศรษฐกิจจักรวรรดิ', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#f59e0b',
      bold: true,
    }).setOrigin(0.5, 0.5);

    // Resource items
    this.resourceKeys = Object.values(RESOURCES).map(r => r.key);

    this.resourceLabels = {};
    this.resourceValues = {};

    const itemHeight = 36;
    const startY = y + 36;
    const spacing = 60;

    this.resourceKeys.forEach((key, i) => {
      const res = getResource(key);
      const icon = res.symbol;
      const label = res.name;
      const current = res.current;
      const max = res.max;
      const color = res.color;

      const labelText = scene.add.text(x, startY + i * spacing, `${icon} ${label}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#e2e8f0',
      }).setOrigin(0, 0.5);

      const valueText = scene.add.text(x + 180, startY + i * spacing, `${current.toLocaleString()} / ${max.toLocaleString()}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: color,
        bold: true,
      }).setOrigin(0, 0.5);

      this.items.push({ label: labelText, value: valueText });
    });

    // Level / progress indicator
    const levelText = scene.add.text(x, startY + this.resourceKeys.length * spacing + 20, 'ระดับจักรวรรดิ: 1', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#9ca3af',
    }).setOrigin(0, 0.5);

    this.header.setdepth(10);
    this.header.setScrollFactor(0);
  }

  update() {
    this.items.forEach(item => {
      if (item.label) item.label.setVisible(true);
      if (item.value) item.value.setVisible(true);
    });
  }

  cleanup() {
    this.items.forEach(item => {
      if (item.label) item.label.destroy();
      if (item.value) item.value.destroy();
    });
    if (this.header) this.header.destroy();
  }
}
