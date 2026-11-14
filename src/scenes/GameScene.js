// ===============================
// GameScene — หน้าเกมหลัก
// ===============================
// เขียนใหม่ให้ทำงานได้เองโดยใช้แค่ data/resources.js, data/buildings.js,
// ui/ResourceBar.js และ ui/BuildingMenu.js
// (ไม่ใช้ utils/grid.js, utils/pixel-art.js และ objects/* อีกต่อไป)
import Phaser from 'phaser';
import {
  RESOURCES,
  resetResources,
  getResource,
  addResource,
  removeResource,
} from '../data/resources.js';
import { BUILDINGS } from '../data/buildings.js';
import { ResourceBar } from '../ui/ResourceBar.js';
import { BuildingMenu } from '../ui/BuildingMenu.js';

// --- ค่าที่ปรับได้ ---
const GRID_SIZE = 64;          // แผนที่ 64x64 ช่อง
const TILE = 32;               // ช่องละ 32 px
const WORLD = GRID_SIZE * TILE;
const CAMERA_SPEED = 500;      // px ต่อวินาที

const POP_PER_HOUSE = 4;
const FOOD_PER_PERSON_PER_SEC = 0.05; // คนละ 1 อาหารต่อ 20 วินาที
const FARM_FOOD_EVERY = 2;     // ฟาร์มละ 1 อาหารต่อ 2 วินาที
const HOUSE_WOOD_EVERY = 4;    // บ้านละ 1 ไม้ต่อ 4 วินาที   (ค่าที่เพิ่มเอง ปรับ/ลบได้)
const HOUSE_STONE_EVERY = 8;   // บ้านละ 1 หินต่อ 8 วินาที   (ค่าที่เพิ่มเอง ปรับ/ลบได้)

const WIN_BUILDINGS = 5;
const WIN_FOOD = 1000;

const FONT = 'Courier New, monospace';

const hex = (s) => parseInt(String(s).replace('#', ''), 16);

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // สถานะทั้งหมดต้องตั้งใหม่ทุกครั้งที่ create() (รวมถึงตอน scene.restart)
    this.gameOver = false;
    this.selectedBuilding = null;
    this.preview = null;
    this.buildings = [];
    this.occupancy = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    this.tickCount = 0;
    this.foodEaten = 0;

    resetResources(); // ต้องมาก่อน createUI เสมอ

    this.createTerrain();
    this.createUI();
    this.setupCamera();
    this.setupInput();

    // ฟาร์มเริ่มต้นกลางแผนที่
    const start = this.placeBuilding('farm', 30, 30);
    this.cameras.main.centerOn(
      start.gx * TILE + (start.w * TILE) / 2,
      start.gy * TILE + (start.h * TILE) / 2
    );

    // เศรษฐกิจเดินทุก 1 วินาที
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });

    this.refreshUI();
  }

  // ---------- แผนที่ ----------
  createTerrain() {
    this.add.rectangle(0, 0, WORLD, WORLD, 0x2f6b2f).setOrigin(0, 0).setDepth(0);

    // เส้นตาราง (ใช้ Rectangle บางๆ เพื่อไม่พึ่ง API ที่ต่างกันระหว่าง Phaser 3/4)
    for (let i = 0; i <= GRID_SIZE; i++) {
      const p = i * TILE;
      this.add.rectangle(p, 0, 1, WORLD, 0x1f4d1f, 0.5).setOrigin(0, 0).setDepth(1);
      this.add.rectangle(0, p, WORLD, 1, 0x1f4d1f, 0.5).setOrigin(0, 0).setDepth(1);
    }
  }

  // ---------- UI ----------
  createUI() {
    this.resourceBar = new ResourceBar(this, 0, 0, 800);
    this.buildingMenu = new BuildingMenu(this, 400, 592, (id) => this.selectBuilding(id));

    this.hint = this.add
      .text(
        400,
        526,
        'ลูกศร/WASD: เลื่อนกล้อง  |  คลิกซ้าย: วาง  |  คลิกขวา: ลบ  |  Esc: ยกเลิก',
        { fontFamily: FONT, fontSize: '12px', color: '#9ca3af' }
      )
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(51);
  }

  refreshUI() {
    this.resourceBar.update({ population: this.getPopulation() });
  }

  // ---------- กล้อง ----------
  setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD, WORLD);
  }

  // ---------- อินพุต ----------
  setupInput() {
    // กันเมนูคลิกขวาของเบราว์เซอร์ (ใช้คลิกขวาเพื่อลบ)
    this.input.mouse?.disableContextMenu?.();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.input.keyboard.on('keydown-H', () => this.selectBuilding('house'));
    this.input.keyboard.on('keydown-F', () => this.selectBuilding('farm'));
    this.input.keyboard.on('keydown-R', () => this.selectBuilding('road'));
    this.input.keyboard.on('keydown-ONE', () => this.selectBuilding('house'));
    this.input.keyboard.on('keydown-TWO', () => this.selectBuilding('farm'));
    this.input.keyboard.on('keydown-THREE', () => this.selectBuilding('road'));
    this.input.keyboard.on('keydown-ESC', () => this.selectBuilding(null));

    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  handlePointerDown(pointer, currentlyOver) {
    if (this.gameOver) return;
    // ถ้าคลิกโดนปุ่ม UI ไม่ต้องวางของบนแผนที่
    if (currentlyOver && currentlyOver.length > 0) return;

    const gx = Math.floor(pointer.worldX / TILE);
    const gy = Math.floor(pointer.worldY / TILE);
    if (!this.inBounds(gx, gy)) return;

    if (pointer.rightButtonDown()) {
      this.removeBuildingAt(gx, gy);
      return;
    }
    if (!this.selectedBuilding) return;
    this.tryPlace(this.selectedBuilding, gx, gy, pointer);
  }

  // เลือกสิ่งก่อสร้าง (เลือกซ้ำ = ยกเลิก, null = ยกเลิก)
  selectBuilding(id) {
    const next = id && id === this.selectedBuilding ? null : id;
    this.selectedBuilding = next && BUILDINGS[next] ? next : null;
    this.buildingMenu.setSelected(this.selectedBuilding);

    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }
    if (this.selectedBuilding) {
      const { w, h } = BUILDINGS[this.selectedBuilding].area;
      this.preview = this.add
        .rectangle(0, 0, w * TILE, h * TILE, 0x34d399, 0.45)
        .setOrigin(0, 0)
        .setDepth(10)
        .setVisible(false);
    }
  }

  // ---------- Grid / การวาง ----------
  inBounds(gx, gy) {
    return gx >= 0 && gy >= 0 && gx < GRID_SIZE && gy < GRID_SIZE;
  }

  canPlace(gx, gy, w, h) {
    if (!this.inBounds(gx, gy) || !this.inBounds(gx + w - 1, gy + h - 1)) return false;
    for (let y = gy; y < gy + h; y++) {
      for (let x = gx; x < gx + w; x++) {
        if (this.occupancy[y][x]) return false;
      }
    }
    return true;
  }

  // คืนรายการทรัพยากรที่ยังขาด เช่น ['ไม้ 5', 'หิน 2']
  getMissing(cost) {
    return Object.entries(cost)
      .map(([key, amount]) => {
        const have = getResource(key)?.current ?? 0;
        return have < amount ? `${RESOURCES[key].name} ${amount - have}` : null;
      })
      .filter(Boolean);
  }

  tryPlace(id, gx, gy, pointer) {
    const def = BUILDINGS[id];
    const { w, h } = def.area;

    if (!this.canPlace(gx, gy, w, h)) {
      this.flashMessage(pointer, 'วางตรงนี้ไม่ได้');
      return;
    }
    const missing = this.getMissing(def.cost);
    if (missing.length > 0) {
      this.flashMessage(pointer, `ทรัพยากรไม่พอ: ${missing.join(', ')}`);
      return;
    }

    Object.entries(def.cost).forEach(([key, amount]) => removeResource(key, amount));
    this.placeBuilding(id, gx, gy);
    this.refreshUI();
    this.checkGameState();
  }

  placeBuilding(id, gx, gy) {
    const def = BUILDINGS[id];
    const { w, h } = def.area;
    const px = gx * TILE;
    const py = gy * TILE;

    const rect = this.add
      .rectangle(px + 1, py + 1, w * TILE - 2, h * TILE - 2, hex(def.color))
      .setOrigin(0, 0)
      .setStrokeStyle(2, hex(def.highlight))
      .setDepth(5);

    const icon = this.add
      .text(px + (w * TILE) / 2, py + (h * TILE) / 2, def.icon, {
        fontFamily: FONT,
        fontSize: `${Math.floor(Math.min(w, h) * TILE * 0.55)}px`,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);

    const building = { id, gx, gy, w, h, rect, icon };
    for (let y = gy; y < gy + h; y++) {
      for (let x = gx; x < gx + w; x++) {
        this.occupancy[y][x] = building;
      }
    }
    this.buildings.push(building);
    return building;
  }

  removeBuildingAt(gx, gy) {
    const building = this.occupancy[gy][gx];
    if (!building) return;

    for (let y = building.gy; y < building.gy + building.h; y++) {
      for (let x = building.gx; x < building.gx + building.w; x++) {
        this.occupancy[y][x] = null;
      }
    }
    building.rect.destroy();
    building.icon.destroy();
    this.buildings = this.buildings.filter((b) => b !== building);
    this.refreshUI();
  }

  // ข้อความลอยสั้นๆ ที่ตำแหน่งเมาส์ (พิกัดหน้าจอ)
  flashMessage(pointer, message) {
    const msg = this.add
      .text(pointer.x, pointer.y - 12, message, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ef4444',
        backgroundColor: '#0a0a0a',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);
    this.time.delayedCall(1500, () => msg.destroy());
  }

  // ---------- เศรษฐกิจ ----------
  countOf(id) {
    return this.buildings.filter((b) => b.id === id).length;
  }

  getPopulation() {
    return this.countOf('house') * POP_PER_HOUSE;
  }

  tick() {
    if (this.gameOver) return;
    this.tickCount++;

    const farms = this.countOf('farm');
    const houses = this.countOf('house');

    if (farms && this.tickCount % FARM_FOOD_EVERY === 0) addResource('food', farms);
    if (houses && this.tickCount % HOUSE_WOOD_EVERY === 0) addResource('wood', houses);
    if (houses && this.tickCount % HOUSE_STONE_EVERY === 0) addResource('stone', houses);

    // ประชากรกินอาหาร (สะสมเศษทศนิยมไว้ก่อน แล้วค่อยหักเป็นจำนวนเต็ม)
    this.foodEaten += this.getPopulation() * FOOD_PER_PERSON_PER_SEC;
    if (this.foodEaten >= 1) {
      const eaten = Math.floor(this.foodEaten);
      this.foodEaten -= eaten;
      removeResource('food', eaten);
    }

    this.refreshUI();
    this.checkGameState();
  }

  checkGameState() {
    if (this.gameOver) return;
    const food = getResource('food').current;

    // แพ้: มีประชากรแต่อาหารหมด
    if (this.getPopulation() > 0 && food <= 0) {
      this.endGame(false);
      return;
    }
    // ชนะ: มีสิ่งก่อสร้างครบและอาหารพอ
    if (this.buildings.length >= WIN_BUILDINGS && food >= WIN_FOOD) {
      this.endGame(true);
    }
  }

  endGame(win) {
    this.gameOver = true;

    this.add
      .rectangle(0, 0, 800, 600, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99);
    this.add
      .text(
        400,
        300,
        win ? '🏆  ชนะ! จักรวรรดิของคุณเจริญรุ่งเรือง!' : '🏚️  เกมสิ้นสุด - อาหารหมด!',
        {
          fontFamily: FONT,
          fontSize: '28px',
          fontStyle: 'bold',
          color: win ? '#34d399' : '#ef4444',
        }
      )
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(100);

    this.time.delayedCall(3000, () => this.scene.restart());
  }

  // ---------- วนทุกเฟรม ----------
  update(time, delta) {
    if (this.gameOver) return;

    // เลื่อนกล้องด้วยลูกศร / WASD
    const cam = this.cameras.main;
    const step = (CAMERA_SPEED * delta) / 1000;
    if (this.cursors.left.isDown || this.wasd.A.isDown) cam.scrollX -= step;
    if (this.cursors.right.isDown || this.wasd.D.isDown) cam.scrollX += step;
    if (this.cursors.up.isDown || this.wasd.W.isDown) cam.scrollY -= step;
    if (this.cursors.down.isDown || this.wasd.S.isDown) cam.scrollY += step;

    this.updatePreview();
  }

  // กรอบเงาแสดงตำแหน่งที่จะวาง (เขียว = วางได้, แดง = วางไม่ได้/ทรัพยากรไม่พอ)
  updatePreview() {
    if (!this.preview || !this.selectedBuilding) return;

    const pointer = this.input.activePointer;
    const overHud = pointer.y < 36 || pointer.y > 520; // แถบบน / แถบล่าง
    const gx = Math.floor(pointer.worldX / TILE);
    const gy = Math.floor(pointer.worldY / TILE);

    if (overHud || !this.inBounds(gx, gy)) {
      this.preview.setVisible(false);
      return;
    }

    const def = BUILDINGS[this.selectedBuilding];
    const { w, h } = def.area;
    const ok = this.canPlace(gx, gy, w, h) && this.getMissing(def.cost).length === 0;

    this.preview
      .setPosition(gx * TILE, gy * TILE)
      .setFillStyle(ok ? 0x34d399 : 0xef4444, 0.45)
      .setVisible(true);
  }
}
