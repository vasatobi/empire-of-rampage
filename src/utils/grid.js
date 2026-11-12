// ===============================
// ระบบจัดการ grid
// ===============================
import { BUILDINGS } from '../data/buildings.js';

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cells = [];
    for (let y = 0; y < h; y++) {
      this.cells[y] = [];
      for (let x = 0; x < w; x++) {
        this.cells[y][x] = {
          x, y,
          type: 'grass',       // grass | road | building | water
          building: null,
          passable: true,
        };
      }
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.w && y >= 0 && y < this.h;
  }

  // พื้นที่ทั้งหมดที่ได้รับผลกระทบจาก building ขนาด w x h ที่จุด (cx, cy) กลาง
  getBuildingArea(cx, cy, w, h) {
    const area = [];
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const x = cx - Math.floor(w / 2) + dx;
        const y = cy - Math.floor(h / 2) + dy;
        if (this.inBounds(x, y)) {
          area.push({ x, y });
        }
      }
    }
    return area;
  }

  // ตรวจสอบว่าจุด (x, y) ว่าง (passable)
  canPlaceAt(x, y) {
    return this.inBounds(x, y) && this.cells[y][x].passable;
  }

  // ตรวจสอบพื้นที่ทั้งหมดสำหรับการวาง
  canPlaceAtPosition(cx, cy, building) {
    const { w, h } = BUILDINGS[building].area || { w: 1, h: 1 };
    const area = this.getBuildingArea(cx, cy, w, h);
    return area.every(pt => this.canPlaceAt(pt.x, pt.y));
  }

  // วาง building ลงไป
  placeBuilding(cx, cy, buildingId) {
    const building = BUILDINGS[buildingId];
    if (!building) return false;

    const { w, h } = building.area;
    const area = this.getBuildingArea(cx, cy, w, h);

    // ตรวจสอบว่าทุกจุดว่าง
    if (!area.every(pt => this.canPlaceAt(pt.x, pt.y))) return false;

    // วางสิ่งก่อสร้างลงไป
    area.forEach(pt => {
      this.cells[pt.y][pt.x] = {
        x: pt.x, y: pt.y,
        type: 'building',
        building: { id: buildingId, ...building },
        passable: false,
      };
    });

    return true;
  }

  // นำ building ออก
  removeBuilding(x, y) {
    if (!this.inBounds(x, y)) return false;
    if (this.cells[y][x].type !== 'building') return false;
    this.cells[y][x] = { x, y, type: 'grass', building: null, passable: true };
    return true;
  }

  // คืนค่าข้อมูล total building ของแต่ละ type
  getBuildingCounts() {
    const counts = {};
    this.cells.forEach(row => {
      row.forEach(cell => {
        if (cell.building) {
          counts[cell.building.id] = (counts[cell.building.id] || 0) + 1;
        }
      });
    });
    return counts;
  }
}
