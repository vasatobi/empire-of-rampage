// ===============================
// BuildingMenu — เมนูเลือกสิ่งก่อสร้าง
// ===============================
import { BUILDINGS, BUILDING_GROUPS } from '../data/buildings.js';

export class BuildingMenu {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.visible = false;
    this.selectedGroup = 0;
    this.buildings = [];
    this.selectedBuilding = null;

    this.bg = scene.add.rectangle(x, y, 480, 440, 0x0a0a0a, 0.92);
    this.bg.setStrokeStyle(1, 0x1e293b);
    this.bg.setDepth(20);
    this.bg.setInteractive({ useHandCursor: true });

    this.title = scene.add.text(x, y - 60, 'เลือกสิ่งก่อสร้าง', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#f59e0b',
      bold: true,
    }).setOrigin(0.5, 0.5);

    this.buildList = BUILDING_GROUPS.map((g, gi) => ({
      group: g,
      index: gi,
      title: null,
      items: [],
    }));

    this.build(groups);
  }

  build(groups) {
    groups.forEach((g, gi) => {
      const group = this.buildList[gi];
      group.title = this.scene.add.text(this.x, this.y + 50 + gi * 130, g.title, {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: g.color,
        bold: true,
      }).setOrigin(0, 0.5);

      group.items = [];
      const itemData = [];
      if (g.id === 'residential') {
        itemData.push({ id: 'house', icon: '🏠', name: 'บ้าน', desc: 'ที่อยู่อาศัยผู้คน', cost: { wood: 10, stone: 5 } });
        itemData.push({ id: 'road', icon: '🛣️', name: 'ถนน', desc: 'เชื่อมต่อและเดินทาง', cost: { stone: 3 } });
      } else if (g.id === 'production') {
        itemData.push({ id: 'farm', icon: '🌾', name: 'ฟาร์ม', desc: 'ผลิตอาหาร', cost: { wood: 20, food: 5 } });
      } else if (g.id === 'infrastructure') {
        itemData.push({ id: 'road', icon: '🛤️', name: 'ทางหลวง', desc: 'เชื่อมต่อเมือง', cost: { stone: 10 } });
      }

      itemData.forEach((item, bi) => {
        const yOff = this.y + 70 + bi * 36;
        const iconText = this.scene.add.text(this.x, yOff, item.icon, {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: g.color,
          bold: true,
        }).setOrigin(0, 0.5);

        const infoText = this.scene.add.text(this.x + 30, yOff, `${item.name} - ${item.desc}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: '#e2e8f0',
        }).setOrigin(0, 0.5);

        const costText = this.scene.add.text(this.x + 240, yOff, `ค่าใช้จ่าย: ${Object.entries(item.cost).map(([k, v]) => `${RESOURCES[k]?.symbol || ''}${v}`).join(' ')}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '11px',
          color: '#9ca3af',
        }).setOrigin(0, 0.5);

        const btn = this.scene.add.text(this.x + 420, yOff, 'วาง', {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          color: '#34d399',
          bold: true,
        }).setOrigin(0, 0.5);

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          this.selectedBuilding = item.id;
          this.hide();
        });

        group.items.push({ ...item, iconText, infoText, costText, btn });
      });
    });
  }

  show() {
    this.visible = true;
    if (this.bg) this.bg.setVisible(true);
    if (this.title) this.title.setVisible(true);
    this.buildList.forEach(g => {
      g.items.forEach(it => {
        if (it.iconText) it.iconText.setVisible(true);
        if (it.infoText) it.infoText.setVisible(true);
        if (it.costText) it.costText.setVisible(true);
        if (it.btn) it.btn.setVisible(true);
      });
    });
  }

  hide() {
    this.visible = false;
    if (this.bg) this.bg.setVisible(false);
    if (this.title) this.title.setVisible(false);
    this.buildList.forEach(g => {
      g.items.forEach(it => {
        if (it.iconText) it.iconText.setVisible(false);
        if (it.infoText) it.infoText.setVisible(false);
        if (it.costText) it.costText.setVisible(false);
        if (it.btn) it.btn.setVisible(false);
      });
    });
  }

  cleanup() {
    if (this.bg) this.bg.destroy();
    if (this.title) this.title.destroy();
    this.buildList.forEach(g => {
      g.items.forEach(it => {
        if (it.iconText) it.iconText.destroy();
        if (it.infoText) it.infoText.destroy();
        if (it.costText) it.costText.destroy();
        if (it.btn) it.btn.destroy();
      });
    });
  }
}
