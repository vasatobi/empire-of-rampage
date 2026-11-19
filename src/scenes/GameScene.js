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
import { MARKET_CONFIG } from '../data/market.js';
import { PopulationSystem } from '../systems/PopulationSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { MarketSystem } from '../systems/MarketSystem.js';
import { ResourceBar } from '../ui/ResourceBar.js';
import { EconomyBar } from '../ui/EconomyBar.js';
import { BuildingMenu } from '../ui/BuildingMenu.js';
import { MarketPanel } from '../ui/MarketPanel.js';
import { generateTextures, hasBuildingTexture, textureKey } from '../art/generate-textures.js';
import { SAVE_VERSION, writeSave, readSave, hasSave } from '../systems/save-system.js';

// --- ค่าที่ปรับได้ ---
const GRID_SIZE = 64;          // แผนที่ 64x64 ช่อง
const TILE = 32;               // ช่องละ 32 px
const WORLD = GRID_SIZE * TILE;
const CAMERA_SPEED = 500;      // px ต่อวินาที

const WIN_BUILDINGS = 5;
const WIN_FOOD = 1000;

const SAVE_INTERVAL_MS = 60000;  // บันทึกอัตโนมัติทุก 60 วินาที
const SAVE_THROTTLE_MS = 2000;   // กันบันทึกถี่หลังวาง/ลบอาคาร

const FONT = 'Courier New, monospace';

const hex = (s) => parseInt(String(s).replace('#', ''), 16);

const clampNum = (v, lo, hi) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
};

// เข้าถึง localStorage เฉพาะในเบราว์เซอร์ (try/catch เฉพาะจุดนี้)
function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(data = {}) {
    // สร้าง texture สไปรต์ (เรียกซ้ำได้ ข้ามอันที่มีอยู่แล้ว) ต้องมาก่อนวาดอาคาร/เมนู
    generateTextures(this);

    // สถานะทั้งหมดต้องตั้งใหม่ทุกครั้งที่ create() (รวมถึงตอน scene.restart)
    this.gameOver = false;
    this.selectedBuilding = null;
    this.preview = null;
    this.buildings = [];
    this.occupancy = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    this.tickCount = 0;
    this.taxRate = 1;

    // โหมด: 'continue' โหลดเซฟ, 'new' เริ่มเกมใหม่ (โหลดเริ่มฉากใหม่เท่านั้น ไม่โหลดทับฉากที่กำลังเล่น)
    this.mode = data && data.mode === 'continue' ? 'continue' : 'new';
    this.hasProgress = false;
    this.lastSaveAt = 0;
    this.saveNotice = null;
    this.saveTimer = null;
    this.menuOpen = false;
    this.tickTimer = null;
    this.menuObjects = [];
    this.menuButtons = {};

    resetResources(); // ต้องมาก่อน createUI เสมอ

    // ระบบ Phase 7: ประชากร / เศรษฐกิจ / ตลาด (สร้างใหม่ทุก create)
    this.populationSystem = new PopulationSystem();
    this.economySystem = new EconomySystem();
    this.marketSystem = new MarketSystem();

    this.createTerrain();
    this.createUI();
    this.setupCamera();
    this.setupInput();

    if (this.mode === 'continue') {
      if (this.loadFromSave()) {
        this.hasProgress = true;
      } else {
        this.startNewGame();
        this.showSaveNotice('ข้อมูลบันทึกเสียหาย เริ่มเกมใหม่');
      }
    } else {
      this.startNewGame();
    }

    // เศรษฐกิจเดินทุก 1 วินาที
    this.tickTimer = this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });

    // บันทึกอัตโนมัติทุก 60 วินาที
    this.saveTimer = this.time.addEvent({
      delay: SAVE_INTERVAL_MS,
      loop: true,
      callback: () => this.autoSave(false, true),
      callbackScope: this,
    });

    // บันทึกตอนปิด/ซ่อนหน้า
    this.onVisibility = () => {
      if (document.hidden) this.autoSave(false, true);
    };
    this.onPageHide = () => this.autoSave(false, true);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
    this.events.once('shutdown', this.cleanupSaveListeners, this);

    this.refreshUI();
  }

  // เริ่มเกมใหม่: รีเซ็ตทุกอย่างแล้ววางฟาร์มเริ่มต้น
  startNewGame() {
    this.tickCount = 0;
    this.taxRate = 1;
    this.buildings = [];
    this.occupancy = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    this.hasProgress = false;
    resetResources();
    this.populationSystem = new PopulationSystem();
    this.economySystem = new EconomySystem();
    this.marketSystem = new MarketSystem();

    const start = this.placeBuilding('farm', 30, 30);
    this.cameras.main.centerOn(
      start.gx * TILE + (start.w * TILE) / 2,
      start.gy * TILE + (start.h * TILE) / 2
    );
  }

  // โหลดเซฟ (เรียกจาก create เท่านั้น) คืน true ถ้าสำเร็จ
  loadFromSave() {
    const storage = getStorage();
    if (!storage) return false;
    const res = readSave(storage);
    if (!res.ok) return false;
    const g = res.state.game;

    // 1) ทรัพยากร (resetResources ถูกเรียกไปแล้ว)
    for (const k of Object.keys(RESOURCES)) {
      const v = g.resources ? g.resources[k] : undefined;
      if (typeof v === 'number' && Number.isFinite(v)) {
        RESOURCES[k].current = Math.max(0, Math.min(RESOURCES[k].max, v));
      }
    }

    // 2) tickCount / taxRate
    this.tickCount = Number.isInteger(g.tickCount) && g.tickCount >= 0 ? g.tickCount : 0;
    this.taxRate =
      typeof g.taxRate === 'number' && [0.5, 1, 1.5].includes(g.taxRate) ? g.taxRate : 1;

    // 3) วางอาคารทีลัง: canPlace ก่อน placeBuilding ทุกครั้ง
    const placed = [];
    for (const b of g.buildings) {
      const def = BUILDINGS[b.id];
      if (!def) {
        this.cancelRestore(placed);
        return false;
      }
      if (!this.canPlace(b.gx, b.gy, def.area.w, def.area.h)) {
        this.cancelRestore(placed);
        return false;
      }
      placed.push(this.placeBuilding(b.id, b.gx, b.gy));
    }

    // 4) กล้อง (clamp ไม่ปฏิเสธ)
    this.cameras.main.scrollX = clampNum(g.camera && g.camera.x, 0, WORLD);
    this.cameras.main.scrollY = clampNum(g.camera && g.camera.y, 0, WORLD);

    // 5) ความจุก่อน แล้วจึงตั้งประชากร/ตลาด
    this.refreshCapacity();
    this.populationSystem.restore(g);
    this.marketSystem.restore(g.market);

    return true;
  }

  // ยกเลิก restore ที่ล้มเหลว: ทำลายอาคารที่วางไป รีเซ็ตระบบ ห้ามแตะไฟล์เซฟ
  cancelRestore(placed) {
    for (const b of placed) {
      for (let y = b.gy; y < b.gy + b.h; y++) {
        for (let x = b.gx; x < b.gx + b.w; x++) {
          if (this.occupancy[y] && this.occupancy[y][x] === b) this.occupancy[y][x] = null;
        }
      }
      b.parts.forEach((p) => p.destroy());
    }
    this.buildings = [];
    this.tickCount = 0;
    this.taxRate = 1;
    resetResources();
    this.populationSystem = new PopulationSystem();
    this.economySystem = new EconomySystem();
    this.marketSystem = new MarketSystem();
  }

  // สร้าง state สำหรับเซฟ (เฉพาะข้อมูลหลัก)
  getSaveState() {
    const resources = {};
    for (const k of Object.keys(RESOURCES)) resources[k] = RESOURCES[k].current ?? 0;
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      game: {
        resources,
        buildings: this.buildings.map((b) => ({ id: b.id, gx: b.gx, gy: b.gy })),
        tickCount: this.tickCount,
        taxRate: this.taxRate,
        population: this.populationSystem.population,
        market: { priceIndex: { ...this.marketSystem.priceIndex } },
        camera: { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY },
      },
    };
  }

  // manual = ผู้เล่นกดบันทึกเอง, force = ข้าม throttle (ปิด/ซ่อนหน้า)
  autoSave(manual = false, force = false) {
    if (this.gameOver) return { ok: false, reason: 'game-over' };
    const storage = getStorage();
    if (!storage) {
      this.showSaveNotice('บันทึกไม่สำเร็จ');
      return { ok: false, reason: 'no-storage' };
    }
    if (!this.hasProgress) {
      if (manual && hasSave(storage)) {
        this.showSaveNotice('ยังไม่มีความคืบหน้าใหม่ให้บันทึก');
        return { ok: false, reason: 'no-progress' };
      }
      if (!manual) return { ok: false, reason: 'no-progress' };
    }
    const now = Date.now();
    if (!force && now - this.lastSaveAt < SAVE_THROTTLE_MS) {
      return { ok: false, reason: 'throttle' };
    }
    const result = writeSave(storage, this.getSaveState());
    if (!result.ok) {
      this.showSaveNotice('บันทึกไม่สำเร็จ');
      return result;
    }
    this.lastSaveAt = now;
    this.showSaveNotice(manual ? 'บันทึกแล้ว' : 'บันทึกอัตโนมัติแล้ว');
    return result;
  }

  // ข้อความสั้นมุมจอ หายเองใน 1.5 วิ
  showSaveNotice(msg) {
    if (this.saveNotice) {
      this.saveNotice.destroy();
      this.saveNotice = null;
    }
    const t = this.add
      .text(792, 60, msg, {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f59e0b',
        backgroundColor: '#0a0a0a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(120);
    this.saveNotice = t;
    this.time.delayedCall(1500, () => {
      if (this.saveNotice === t) {
        t.destroy();
        this.saveNotice = null;
      }
    });
  }

  // ล้าง listener ตอนฉากปิด (กันซ้ำเมื่อ scene.restart); ตัวจับเวลาของ scene ถูกทำลายเอง
  cleanupSaveListeners() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
    if (this.saveNotice) {
      this.saveNotice.destroy();
      this.saveNotice = null;
    }
  }

  // ---------- เมนูหยุดเกม ----------
  createPauseMenu() {
    const add = (o) => {
      this.menuObjects.push(o);
      return o;
    };

    // พื้นหลังเต็มจอ (interactive กันคลิกทะลุลงแผนที่)
    add(
      this.add
        .rectangle(0, 0, 800, 600, 0x000000, 0.72)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(90)
        .setInteractive()
    );
    add(
      this.add
        .rectangle(400, 300, 340, 320, 0x1a1207, 0.98)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xf59e0b)
        .setScrollFactor(0)
        .setDepth(91)
    );
    add(
      this.add
        .text(400, 178, 'เมนู', {
          fontFamily: FONT,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#f59e0b',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(92)
    );

    const mk = (key, y, label, cb) => {
      const bg = add(
        this.add
          .rectangle(400, y, 240, 40, 0x2a1f0e, 1)
          .setOrigin(0.5)
          .setStrokeStyle(1, 0x8b5a2b)
          .setScrollFactor(0)
          .setDepth(92)
      );
      const text = add(
        this.add
          .text(400, y, label, {
            fontFamily: FONT,
            fontSize: '16px',
            color: '#e2e8f0',
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(93)
      );
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setFillStyle(0x4a3517, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x2a1f0e, 1));
      bg.on('pointerdown', cb);
      this.menuButtons[key] = { bg, text };
    };

    mk('resume', 240, 'เล่นต่อ', () => this.toggleMenu(false));
    mk('save', 295, 'บันทึกเกม', () => this.manualSave());
    mk('load', 350, 'โหลดเกม', () => this.loadFromMenu());
    mk('main', 405, 'กลับเมนูหลัก', () => this.backToMainMenu());

    this.setMenuVisible(false);
  }

  setMenuVisible(v) {
    this.menuObjects.forEach((o) => {
      o.setVisible(v);
      if (o.input) o.input.enabled = v;
    });
  }

  toggleMenu(force) {
    if (this.gameOver) return;
    const next = force !== undefined ? force : !this.menuOpen;
    this.menuOpen = next;
    if (next && this.marketPanel.isVisible()) this.marketPanel.toggle(false);
    this.setMenuVisible(next);
    if (this.tickTimer) this.tickTimer.paused = next;
  }

  manualSave() {
    this.autoSave(true, true);
  }

  loadFromMenu() {
    const storage = getStorage();
    if (!storage || !hasSave(storage)) {
      this.showSaveNotice('ไม่มีข้อมูลบันทึก');
      return;
    }
    this.toggleMenu(false);
    this.scene.restart({ mode: 'continue' });
  }

  backToMainMenu() {
    this.toggleMenu(false);
    this.scene.start('MainMenu');
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
    this.economyBar = new EconomyBar(this, 0, 36, 800, (rate) => this.setTaxRate(rate));
    this.buildingMenu = new BuildingMenu(this, 400, 592, (id) => this.selectBuilding(id));
    this.marketPanel = new MarketPanel(this, 800, 96, (type, key) => this.handleTrade(type, key));
    this.createPauseMenu();

    this.menuBtn = this.add
      .text(792, 532, 'เมนู [P]', {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#f59e0b',
        backgroundColor: '#0a0a0a',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(51)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.menuOpen) this.toggleMenu(true);
      });

    this.hint = this.add
      .text(
        400,
        526,
        'ลูกศร/WASD: เลื่อนกล้อง  |  คลิกซ้าย: วาง  |  คลิกขวา: ลบ  |  M: ตลาด  |  Esc: ยกเลิก',
        { fontFamily: FONT, fontSize: '12px', color: '#9ca3af' }
      )
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(51);
  }

  setTaxRate(rate) {
    if (this.menuOpen) return;
    this.taxRate = rate;
    this.refreshUI();
  }

  toggleMarket() {
    this.marketPanel.toggle();
    this.refreshUI();
  }

  refreshCapacity() {
    const counts = this.getCounts();
    this.populationSystem.capacity = (counts.house || 0) * (BUILDINGS.house.capacity || 0);
  }

  refreshUI() {
    this.refreshCapacity();
    this.resourceBar.update({
      population: this.getPopulation(),
      capacity: this.getCapacity(),
      happiness: this.getHappiness(),
    });
    this.economyBar.update({
      income: this.economySystem.lastIncomePerMin,
      expense: this.economySystem.lastExpensePerMin,
      net: this.economySystem.lastNetPerMin,
      taxRate: this.taxRate,
    });
    if (this.marketPanel.isVisible()) {
      this.marketPanel.update(
        this.marketSystem.getPrices(this.countOf('road')),
        getResource('gold').current ?? 0
      );
    }
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

    this.input.keyboard.on('keydown-H', () => { if (!this.menuOpen) this.selectBuilding('house'); });
    this.input.keyboard.on('keydown-F', () => { if (!this.menuOpen) this.selectBuilding('farm'); });
    this.input.keyboard.on('keydown-R', () => { if (!this.menuOpen) this.selectBuilding('road'); });
    this.input.keyboard.on('keydown-L', () => { if (!this.menuOpen) this.selectBuilding('lumberjack'); });
    this.input.keyboard.on('keydown-Q', () => { if (!this.menuOpen) this.selectBuilding('quarry'); });
    this.input.keyboard.on('keydown-ONE', () => { if (!this.menuOpen) this.selectBuilding('house'); });
    this.input.keyboard.on('keydown-TWO', () => { if (!this.menuOpen) this.selectBuilding('farm'); });
    this.input.keyboard.on('keydown-THREE', () => { if (!this.menuOpen) this.selectBuilding('road'); });
    this.input.keyboard.on('keydown-FOUR', () => { if (!this.menuOpen) this.selectBuilding('lumberjack'); });
    this.input.keyboard.on('keydown-FIVE', () => { if (!this.menuOpen) this.selectBuilding('quarry'); });
    this.input.keyboard.on('keydown-ESC', () => { if (!this.menuOpen) this.selectBuilding(null); });
    this.input.keyboard.on('keydown-M', () => { if (!this.menuOpen) this.toggleMarket(); });
    this.input.keyboard.on('keydown-P', () => { if (!this.gameOver) this.toggleMenu(); });

    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  handlePointerDown(pointer, currentlyOver) {
    if (this.gameOver || this.menuOpen) return;
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
    if (this.menuOpen) return;
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
    this.hasProgress = true;
    this.autoSave(false);
    this.refreshUI();
    this.checkGameState();
  }

  placeBuilding(id, gx, gy) {
    const def = BUILDINGS[id];
    const { w, h } = def.area;
    const px = gx * TILE;
    const py = gy * TILE;

    const parts = [];
    if (hasBuildingTexture(this, id)) {
      // สไปรต์ขนาด w*TILE x h*TILE พอดี (texture วาดตาม ART_SCALE ให้ตรงกันแล้ว)
      parts.push(this.add.image(px, py, textureKey(id)).setOrigin(0, 0).setDepth(5));
    } else {
      // fallback สี่เหลี่ยม+อีโมจิ ถ้า texture ไม่มี
      parts.push(
        this.add
          .rectangle(px + 1, py + 1, w * TILE - 2, h * TILE - 2, hex(def.color))
          .setOrigin(0, 0)
          .setStrokeStyle(2, hex(def.highlight))
          .setDepth(5)
      );
      parts.push(
        this.add
          .text(px + (w * TILE) / 2, py + (h * TILE) / 2, def.icon, {
            fontFamily: FONT,
            fontSize: `${Math.floor(Math.min(w, h) * TILE * 0.55)}px`,
          })
          .setOrigin(0.5, 0.5)
          .setDepth(6)
      );
    }

    const building = { id, gx, gy, w, h, parts };
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
    building.parts.forEach((p) => p.destroy());
    this.buildings = this.buildings.filter((b) => b !== building);
    this.hasProgress = true;
    this.autoSave(false);
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

  // ---------- ระบบ ----------
  countOf(id) {
    return this.buildings.filter((b) => b.id === id).length;
  }

  getCounts() {
    const counts = {};
    this.buildings.forEach((b) => {
      counts[b.id] = (counts[b.id] || 0) + 1;
    });
    return counts;
  }

  getPopulation() {
    return Math.floor(this.populationSystem.population);
  }

  getCapacity() {
    return this.populationSystem.capacity;
  }

  getHappiness() {
    return Math.round(this.populationSystem.happiness);
  }

  tick() {
    if (this.gameOver) return;
    this.tickCount++;

    const counts = this.getCounts();

    // 1) ผลิตทรัพยากรจากสิ่งก่อสร้าง
    Object.entries(BUILDINGS).forEach(([id, def]) => {
      if (!def.produce) return;
      const n = counts[id] || 0;
      if (n > 0 && this.tickCount % def.produceEvery === 0) {
        Object.entries(def.produce).forEach(([key, amount]) => addResource(key, amount * n));
      }
    });

    // 2) ประชากร + ความสุข + การกินอาหาร
    const capacity = (counts.house || 0) * (BUILDINGS.house.capacity || 0);
    const jobs = ['farm', 'lumberjack', 'quarry'].reduce(
      (sum, id) => sum + (counts[id] || 0) * (BUILDINGS[id].jobs || 0),
      0
    );
    this.populationSystem.update(1000, {
      houses: counts.house,
      jobs,
      taxRate: this.taxRate,
      capacity,
    });

    // 3) เศรษฐกิจ: รายรับ/รายจ่าย
    this.economySystem.update(1000, {
      population: this.getPopulation(),
      buildings: this.buildings.map((b) => ({ upkeep: BUILDINGS[b.id]?.upkeep || 0 })),
      taxRate: this.taxRate,
      roadCount: counts.road,
    });

    // 4) ตลาด: ราคาคืนตัว
    this.marketSystem.update(1000, counts.road);

    this.refreshUI();
    this.checkGameState();
  }

  // ซื้อ/ขายในตลาด (type = 'buy' | 'sell')
  handleTrade(type, key) {
    const amount = MARKET_CONFIG.tradeAmount;
    const result =
      type === 'buy'
        ? this.marketSystem.buy(key, amount, this.countOf('road'))
        : this.marketSystem.sell(key, amount, this.countOf('road'));

    if (!result.ok) {
      this.marketPanel.showMessage(result.reason, false);
      return;
    }

    const res = getResource(key);
    const msg =
      type === 'buy'
        ? `ซื้อ ${res.name} ${amount} หน่วย (-${result.cost} ทอง)`
        : `ขาย ${res.name} ${amount} หน่วย (+${result.gain} ทอง)`;
    this.marketPanel.showMessage(msg, true);
    this.refreshUI();
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
    if (this.gameOver || this.menuOpen) return;

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
    const overHud = pointer.y < 62 || pointer.y > 520; // แถบบน (ทรัพยากร+เศรษฐกิจ) / แถบล่าง
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
