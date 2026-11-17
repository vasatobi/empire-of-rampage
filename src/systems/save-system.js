// ===============================
// SaveSystem — บันทึก/โหลดอาณาจักร (Phase 8)
// ไม่ import Phaser ใช้งานได้กับ storage จำลอง (node:test) ได้
// คีย์ทรัพยากร/อาคาร/ตลาดดึงจาก RESOURCES และ BUILDINGS แบบไดนามิก
// ===============================
import { RESOURCES } from '../data/resources.js';
import { BUILDINGS } from '../data/buildings.js';
import { TAX_RATES } from '../data/economy.js';

export const SAVE_VERSION = 1;
export const STORAGE_PREFIX = 'empire-of-rampage:';
export const MAIN_KEY = `${STORAGE_PREFIX}save:v1`;
export const BACKUP_KEY = `${MAIN_KEY}:backup`;
export const CORRUPT_KEY = `${MAIN_KEY}:corrupt`;

const GRID_SIZE = 64;
const WORLD = GRID_SIZE * 32; // 2048
const TAX_VALUES = TAX_RATES.map((r) => r.mult);
const RESOURCE_KEYS = Object.keys(RESOURCES);
const BUILDING_IDS = Object.keys(BUILDINGS);
const TRADABLE_KEYS = RESOURCE_KEYS.filter((k) => RESOURCES[k].tradable);

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ค่าเริ่มต้นของฟิลด์ที่ไม่บังคับ เพื่อให้เซฟเก่าขาดฟิลด์ยังอ่านได้
export function defaultState() {
  const resources = {};
  for (const k of RESOURCE_KEYS) resources[k] = RESOURCES[k].base ?? 0;

  const priceIndex = {};
  for (const k of TRADABLE_KEYS) priceIndex[k] = 1;

  return {
    version: SAVE_VERSION,
    savedAt: null,
    game: {
      resources,
      buildings: [],
      tickCount: 0,
      taxRate: 1,
      population: 0,
      market: { priceIndex },
      camera: { x: 0, y: 0 },
    },
  };
}

// แปลง state เป็น JSON ตามรูปแบบ { version, savedAt, game }
export function serialize(state) {
  return JSON.stringify({
    version: SAVE_VERSION,
    savedAt: state.savedAt ?? new Date().toISOString(),
    game: state.game,
  });
}

// ตรวจข้อมูลทั้งไฟล์: ถ้ารายการใดผิด ปฏิเสธทั้งไฟล์ (ไม่ข้ามเฉพาะรายการ)
// คืน { ok:true, state } ที่เติมค่าเริ่มต้นแล้ว หรือ { ok:false, reason }
export function validate(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'JSON ไม่ถูกต้อง' };
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'โครงสร้างข้อมูลไม่ถูกต้อง' };
  }
  if (data.version !== SAVE_VERSION) {
    if (typeof data.version === 'number' && data.version > SAVE_VERSION) {
      return { ok: false, reason: `version สูงเกินที่รู้จัก (${data.version})` };
    }
    return { ok: false, reason: 'version ไม่ถูกต้อง' };
  }
  if (!data.game || typeof data.game !== 'object' || Array.isArray(data.game)) {
    return { ok: false, reason: 'ไม่มี game object' };
  }

  const base = defaultState();
  const out = {
    version: SAVE_VERSION,
    savedAt: typeof data.savedAt === 'string' ? data.savedAt : null,
    game: base.game,
  };

  // --- ทรัพยากร: ขาด → ค่าเริ่มต้น, มีแต่ไม่ถูก → ปฏิเสธ ---
  const res = data.game.resources;
  if (res !== undefined) {
    if (!res || typeof res !== 'object' || Array.isArray(res)) {
      return { ok: false, reason: 'resources ไม่ถูกต้อง' };
    }
    for (const k of RESOURCE_KEYS) {
      const v = res[k];
      if (v === undefined) continue;
      if (!isFiniteNumber(v)) return { ok: false, reason: `resources.${k} ไม่ใช่ตัวเลข finite` };
      if (v < 0 || v > RESOURCES[k].max) {
        return { ok: false, reason: `resources.${k} อยู่นอกช่วง 0..${RESOURCES[k].max}` };
      }
      out.game.resources[k] = v;
    }
  }

  // --- อาคาร: id ต้องรู้จัก, พิกัด integer, อยู่ในแผนที่, ห้ามซ้อน/ซ้ำ ---
  if (data.game.buildings !== undefined) {
    if (!Array.isArray(data.game.buildings)) {
      return { ok: false, reason: 'buildings ต้องเป็น array' };
    }
    const occupied = new Set();
    const buildings = [];
    for (const b of data.game.buildings) {
      if (!b || typeof b !== 'object') return { ok: false, reason: 'building ไม่ถูกต้อง' };
      if (typeof b.id !== 'string' || !BUILDING_IDS.includes(b.id)) {
        return { ok: false, reason: `ไม่รู้จักอาคาร ${String(b.id)}` };
      }
      if (!Number.isInteger(b.gx) || !Number.isInteger(b.gy)) {
        return { ok: false, reason: 'พิกัดอาคารต้องเป็นจำนวนเต็ม' };
      }
      const { w, h } = BUILDINGS[b.id].area;
      if (b.gx < 0 || b.gy < 0 || b.gx + w > GRID_SIZE || b.gy + h > GRID_SIZE) {
        return { ok: false, reason: 'อาคารอยู่นอกแผนที่' };
      }
      for (let y = b.gy; y < b.gy + h; y++) {
        for (let x = b.gx; x < b.gx + w; x++) {
          const key = `${x},${y}`;
          if (occupied.has(key)) return { ok: false, reason: 'อาคารซ้อนกันหรือซ้ำ' };
          occupied.add(key);
        }
      }
      buildings.push({ id: b.id, gx: b.gx, gy: b.gy });
    }
    out.game.buildings = buildings;
  }

  // --- tickCount ---
  if (data.game.tickCount !== undefined) {
    if (!Number.isInteger(data.game.tickCount) || data.game.tickCount < 0) {
      return { ok: false, reason: 'tickCount ไม่ถูกต้อง' };
    }
    out.game.tickCount = data.game.tickCount;
  }

  // --- taxRate: ขาด → 1.0, มีแต่ไม่ใช่ 0.5/1/1.5 → ปฏิเสธ ---
  if (data.game.taxRate !== undefined) {
    if (!isFiniteNumber(data.game.taxRate) || !TAX_VALUES.includes(data.game.taxRate)) {
      return { ok: false, reason: 'taxRate ไม่ถูกต้อง' };
    }
    out.game.taxRate = data.game.taxRate;
  }

  // --- population ---
  if (data.game.population !== undefined) {
    if (!isFiniteNumber(data.game.population) || data.game.population < 0) {
      return { ok: false, reason: 'population ไม่ถูกต้อง' };
    }
    out.game.population = data.game.population;
  }

  // --- ดัชนีราคาตลาด: ขาด → ค่าเริ่มต้น, มีแต่ไม่ถูก → ปฏิเสธ ---
  const market = data.game.market;
  if (market !== undefined) {
    if (!market || typeof market !== 'object' || Array.isArray(market)) {
      return { ok: false, reason: 'market ไม่ถูกต้อง' };
    }
    const pi = market.priceIndex;
    if (pi !== undefined) {
      if (!pi || typeof pi !== 'object' || Array.isArray(pi)) {
        return { ok: false, reason: 'market.priceIndex ไม่ถูกต้อง' };
      }
      for (const k of TRADABLE_KEYS) {
        const v = pi[k];
        if (v === undefined) continue;
        if (!isFiniteNumber(v) || v <= 0) {
          return { ok: false, reason: `priceIndex.${k} ไม่ถูกต้อง` };
        }
        out.game.market.priceIndex[k] = v;
      }
    }
  }

  // --- กล้อง: ขาด/ไม่ใช่ตัวเลข → ค่าเริ่มต้น, เกินขอบ → clamp (ไม่ปฏิเสธ) ---
  const cam = data.game.camera;
  if (cam && typeof cam === 'object') {
    if (isFiniteNumber(cam.x)) out.game.camera.x = clamp(cam.x, 0, WORLD);
    if (isFiniteNumber(cam.y)) out.game.camera.y = clamp(cam.y, 0, WORLD);
  }

  return { ok: true, state: out };
}

// เปรียบเทียบเนื้อหา game (ไม่สน savedAt) เพื่อลดการเขียนซ้ำ
function sameGameContent(existingJson, state) {
  try {
    const prev = JSON.parse(existingJson);
    if (!prev || !prev.game) return false;
    return JSON.stringify(prev.game) === JSON.stringify(state.game);
  } catch {
    return false;
  }
}

// บันทึก: ถ้าเนื้อหาเหมือนเดิมไม่เขียน, ก่อนเขียนทับย้ายชุดเดิมไป :backup
// storage ล้มเหลว → คืน { ok:false } ห้าม throw
export function writeSave(storage, state) {
  let json;
  try {
    json = serialize(state);
  } catch {
    return { ok: false, reason: 'serialize ล้มเหลว' };
  }

  let existing = null;
  try {
    existing = storage.getItem(MAIN_KEY);
  } catch {
    return { ok: false, reason: 'อ่าน storage ไม่ได้' };
  }

  if (existing !== null && existing !== undefined && sameGameContent(existing, state)) {
    return { ok: true, unchanged: true };
  }

  try {
    if (existing !== null && existing !== undefined) {
      storage.setItem(BACKUP_KEY, existing);
    }
    storage.setItem(MAIN_KEY, json);
  } catch {
    return { ok: false, reason: 'บันทึกล้มเหลว (storage เต็มหรือปิดใช้งาน)' };
  }
  return { ok: true };
}

// อ่าน: ลองหลัก → เสียเก็บสำเนาไว้ :corrupt แล้วลอง :backup → ไม่ได้ทั้งคู่คืน reason
// ห้าม crash ห้ามลบข้อมูลเดิม
export function readSave(storage) {
  const read = (key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const main = read(MAIN_KEY);
  if (main !== null && main !== undefined) {
    const r = validate(main);
    if (r.ok) return { ok: true, state: r.state };
    try {
      storage.setItem(CORRUPT_KEY, main);
    } catch {
      /* เก็บสำเนาไม่ได้ก็ข้าม ห้าม throw */
    }
    const backup = read(BACKUP_KEY);
    if (backup !== null && backup !== undefined) {
      const rb = validate(backup);
      if (rb.ok) return { ok: true, state: rb.state };
    }
    return { ok: false, reason: r.reason };
  }

  const backup = read(BACKUP_KEY);
  if (backup !== null && backup !== undefined) {
    const rb = validate(backup);
    if (rb.ok) return { ok: true, state: rb.state };
    return { ok: false, reason: rb.reason };
  }
  return { ok: false, reason: 'ไม่มีข้อมูลบันทึก' };
}

// มีเซฟอยู่หรือไม่ (หลักหรือ backup ไม่ว่าง) — ใช้เปิดปุ่ม "เล่นต่อ"
// ข้อมูลเสียจะถูกจัดการตอน readSave (แจ้งเสียหาย ไม่ crash)
export function hasSave(storage) {
  const read = (key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };
  const exists = (v) => v !== null && v !== undefined && String(v).length > 0;
  return exists(read(MAIN_KEY)) || exists(read(BACKUP_KEY));
}

// ลบเซฟหลัก + backup (ไม่ลบ :corrupt เพื่อเก็บหลักฐาน)
export function deleteSave(storage) {
  try {
    storage.removeItem(MAIN_KEY);
    storage.removeItem(BACKUP_KEY);
  } catch {
    return { ok: false, reason: 'ลบข้อมูลไม่สำเร็จ' };
  }
  return { ok: true };
}
