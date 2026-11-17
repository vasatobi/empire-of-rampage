// ===============================
// ทดสอบ save-system.js ด้วย node:test (ไม่ติดตั้งแพ็กเกจเพิ่ม)
// รัน: node --test tests/
// ===============================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_VERSION,
  MAIN_KEY,
  BACKUP_KEY,
  CORRUPT_KEY,
  defaultState,
  serialize,
  validate,
  writeSave,
  readSave,
  hasSave,
  deleteSave,
} from '../src/systems/save-system.js';
import { RESOURCES } from '../src/data/resources.js';

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  const calls = { get: 0, set: 0, remove: 0 };
  return {
    calls,
    getItem(k) {
      calls.get++;
      const v = map.get(k);
      return v === undefined ? null : v;
    },
    setItem(k, v) {
      calls.set++;
      map.set(k, String(v));
    },
    removeItem(k) {
      calls.remove++;
      map.delete(k);
    },
  };
}

function sampleState() {
  const s = defaultState();
  s.savedAt = '2026-11-16T04:00:00.000Z';
  s.game.resources = { food: 120, wood: 45, stone: 67, gold: 89 };
  s.game.buildings = [
    { id: 'house', gx: 28, gy: 28 },
    { id: 'farm', gx: 33, gy: 28 },
    { id: 'road', gx: 20, gy: 20 },
  ];
  s.game.tickCount = 1234;
  s.game.taxRate = 1;
  s.game.population = 12.5;
  s.game.market.priceIndex = { food: 1, wood: 0.98, stone: 1.02 };
  s.game.camera = { x: 608, y: 692 };
  return s;
}

function json(state) {
  return JSON.stringify(state);
}

// ---------- 1. บันทึก → อ่าน ----------
test('บันทึก→อ่าน ได้ข้อมูลเท่าเดิมทุกฟิลด์', () => {
  const st = sampleState();
  const storage = makeStorage();
  const w = writeSave(storage, st);
  assert.equal(w.ok, true);

  const r = readSave(storage);
  assert.equal(r.ok, true);
  assert.deepEqual(r.state.game.resources, st.game.resources);
  assert.deepEqual(r.state.game.buildings, st.game.buildings);
  assert.equal(r.state.game.tickCount, 1234);
  assert.equal(r.state.game.taxRate, 1);
  assert.equal(r.state.game.population, 12.5);
  assert.deepEqual(r.state.game.market.priceIndex, st.game.market.priceIndex);
  assert.deepEqual(r.state.game.camera, st.game.camera);
});

test('serialize ให้ version 1 และตรงรูปแบบ', () => {
  const out = JSON.parse(serialize(sampleState()));
  assert.equal(out.version, SAVE_VERSION);
  assert.equal(typeof out.savedAt, 'string');
  assert.ok(out.game && typeof out.game === 'object');
});

// ---------- 2. ขาดฟิลด์ → ค่าเริ่มต้น ----------
test('ขาดฟิลด์ไม่บังคับ → เติมค่าเริ่มต้น', () => {
  const raw = json({ version: 1, game: { resources: { food: 10 }, buildings: [] } });
  const r = validate(raw);
  assert.equal(r.ok, true);
  assert.equal(r.state.game.resources.food, 10);
  assert.equal(r.state.game.resources.wood, RESOURCES.wood.base);
  assert.equal(r.state.game.resources.gold, RESOURCES.gold.base);
  assert.equal(r.state.game.tickCount, 0);
  assert.equal(r.state.game.taxRate, 1);
  assert.equal(r.state.game.population, 0);
  assert.deepEqual(r.state.game.camera, { x: 0, y: 0 });
  assert.equal(r.state.game.market.priceIndex.wood, 1);
});

// ---------- 3. JSON เสีย ----------
test('JSON เสีย → ปฏิเสธ', () => {
  const r = validate('{ not json');
  assert.equal(r.ok, false);
  assert.match(r.reason, /JSON/);
});

test('storage หลักเสีย → readSave คืน false ไม่ crash', () => {
  const storage = makeStorage({ [MAIN_KEY]: '฿฿ broken' });
  const r = readSave(storage);
  assert.equal(r.ok, false);
});

// ---------- 4. version ----------
test('version ผิด/ใหม่กว่า → ปฏิเสธ', () => {
  assert.equal(validate(json({ version: 0, game: {} })).ok, false);
  assert.equal(validate(json({ version: 99, game: {} })).ok, false);
  assert.equal(validate(json({ version: '1', game: {} })).ok, false);
  assert.equal(validate(json({ game: {} })).ok, false);
});

test('version สูงกว่า → ไม่ลบ/ไม่เขียนทับ แต่ลอง backup', () => {
  const a = sampleState();
  a.game.tickCount = 1234;
  const b = sampleState();
  b.game.tickCount = 555;
  const storage = makeStorage();
  writeSave(storage, a);
  writeSave(storage, b); // สร้าง backup = a
  storage.setItem(MAIN_KEY, json({ version: 99, game: {} }));
  const r = readSave(storage);
  assert.equal(r.ok, true);
  assert.equal(r.state.game.tickCount, 1234);
  // ไม่ลบหลัก
  assert.notEqual(storage.getItem(MAIN_KEY), null);
});

// ---------- 5. ทรัพยากร ----------
test('ทรัพยากรติดลบ/NaN/เกิน max/ไม่ใช่ตัวเลข → ปฏิเสธ', () => {
  const bad = [-1, NaN, RESOURCES.food.max + 1, '5', null, Infinity];
  for (const v of bad) {
    const raw = json({ version: 1, game: { resources: { food: v } } });
    assert.equal(validate(raw).ok, false, `food=${String(v)}`);
  }
});

test('ทรัพยากรครบทุกคีย์ที่ RESOURCES รู้จัก', () => {
  const raw = json({
    version: 1,
    game: {
      resources: {
        food: 1,
        wood: 2,
        stone: 3,
        gold: 4,
        futureRes: 999,
      },
    },
  });
  const r = validate(raw);
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.state.game.resources).sort(), Object.keys(RESOURCES).sort());
});

// ---------- 6. อาคาร ----------
test('id อาคารไม่รู้จัก → ปฏิเสธ', () => {
  const raw = json({ version: 1, game: { buildings: [{ id: 'castle', gx: 0, gy: 0 }] } });
  assert.equal(validate(raw).ok, false);
});

test('พิกัดนอกแผนที่ (รวมพื้นที่ w×h) → ปฏิเสธ', () => {
  const cases = [
    { id: 'farm', gx: 62, gy: 0 },   // farm w=3 → 62+3=65
    { id: 'house', gx: 0, gy: 63 },  // house h=2 → 63+2=65
    { id: 'road', gx: -1, gy: 0 },
    { id: 'road', gx: 0, gy: 64 },
    { id: 'road', gx: 1.5, gy: 0 },
  ];
  for (const b of cases) {
    const raw = json({ version: 1, game: { buildings: [b] } });
    assert.equal(validate(raw).ok, false, JSON.stringify(b));
  }
});

test('อาคารซ้อนกัน → ปฏิเสธ', () => {
  const raw = json({
    version: 1,
    game: { buildings: [{ id: 'house', gx: 10, gy: 10 }, { id: 'farm', gx: 11, gy: 11 }] },
  });
  assert.equal(validate(raw).ok, false);
});

test('อาคารซ้ำ → ปฏิเสธ', () => {
  const raw = json({
    version: 1,
    game: { buildings: [{ id: 'road', gx: 5, gy: 5 }, { id: 'road', gx: 5, gy: 5 }] },
  });
  assert.equal(validate(raw).ok, false);
});

test('อาคารชิดกันไม่ซ้อน → ผ่าน', () => {
  const raw = json({
    version: 1,
    game: { buildings: [{ id: 'road', gx: 5, gy: 5 }, { id: 'road', gx: 6, gy: 5 }] },
  });
  assert.equal(validate(raw).ok, true);
});

// ---------- 7. taxRate ----------
test('taxRate ขาด → 1.0, มีแต่ไม่ใช่ 0.5/1/1.5 → ปฏิเสธ', () => {
  const missing = validate(json({ version: 1, game: {} }));
  assert.equal(missing.ok, true);
  assert.equal(missing.state.game.taxRate, 1);

  for (const v of [0, 2, 1.2, '1', null]) {
    const raw = json({ version: 1, game: { taxRate: v } });
    assert.equal(validate(raw).ok, false, `taxRate=${String(v)}`);
  }
  for (const v of [0.5, 1, 1.5]) {
    const raw = json({ version: 1, game: { taxRate: v } });
    assert.equal(validate(raw).ok, true, `taxRate=${v}`);
  }
});

// ---------- 8. กล้อง ----------
test('กล้องขาด/ไม่ใช่ตัวเลข → ค่าเริ่มต้น (ไม่ปฏิเสธ)', () => {
  const miss = validate(json({ version: 1, game: {} }));
  assert.equal(miss.ok, true);
  assert.deepEqual(miss.state.game.camera, { x: 0, y: 0 });

  const bad = validate(json({ version: 1, game: { camera: { x: 'a', y: null } } }));
  assert.equal(bad.ok, true);
  assert.deepEqual(bad.state.game.camera, { x: 0, y: 0 });
});

test('กล้องเกินขอบ → clamp', () => {
  const r = validate(json({ version: 1, game: { camera: { x: 99999, y: -50 } } }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.state.game.camera, { x: 2048, y: 0 });
});

// ---------- 9. population ----------
test('population ติดลบ/ไม่ finite → ปฏิเสธ', () => {
  for (const v of [-1, NaN, '5', null]) {
    const raw = json({ version: 1, game: { population: v } });
    assert.equal(validate(raw).ok, false, `population=${String(v)}`);
  }
});

// ---------- 10. ดัชนีราคาตลาด ----------
test('priceIndex ติดลบ/NaN → ปฏิเสธ, ขาด → 1', () => {
  for (const v of [0, -1, NaN, '1']) {
    const raw = json({ version: 1, game: { market: { priceIndex: { wood: v } } } });
    assert.equal(validate(raw).ok, false, `wood=${String(v)}`);
  }
  const missing = validate(json({ version: 1, game: { market: { priceIndex: {} } } }));
  assert.equal(missing.ok, true);
  assert.equal(missing.state.game.market.priceIndex.wood, 1);
});

// ---------- 11. storage โยน error ----------
test('storage setItem โยน error → writeSave คืน false ไม่ throw', () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceeded');
    },
    removeItem: () => {},
  };
  const w = writeSave(storage, sampleState());
  assert.equal(w.ok, false);
  assert.match(w.reason, /ล้มเหลว/);
});

test('storage getItem โยน error → readSave คืน false ไม่ throw', () => {
  const storage = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {},
    removeItem: () => {},
  };
  const r = readSave(storage);
  assert.equal(r.ok, false);
});

// ---------- 12. การหมุน backup ----------
test('การหมุน backup: เขียน 2 ครั้ง → backup เป็นชุดแรก', () => {
  const storage = makeStorage();
  const a = sampleState();
  a.game.tickCount = 1;
  const b = sampleState();
  b.game.tickCount = 2;
  assert.equal(writeSave(storage, a).ok, true);
  assert.equal(writeSave(storage, b).ok, true);

  assert.equal(JSON.parse(storage.getItem(MAIN_KEY)).game.tickCount, 2);
  assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)).game.tickCount, 1);
});

test('เซฟหลักเสีย → ใช้ backup และเก็บสำเนาไว้ :corrupt', () => {
  const storage = makeStorage();
  const a = sampleState();
  a.game.tickCount = 7;
  const b = sampleState();
  b.game.tickCount = 8;
  writeSave(storage, a);
  writeSave(storage, b); // backup = a (tickCount 7)
  storage.setItem(MAIN_KEY, '{ broken');

  const r = readSave(storage);
  assert.equal(r.ok, true);
  assert.equal(r.state.game.tickCount, 7);
  assert.equal(storage.getItem(CORRUPT_KEY), '{ broken');
  // หลักเดิมไม่ถูกลบ
  assert.equal(storage.getItem(MAIN_KEY), '{ broken');
});

test('ทั้งหลักและ backup เสีย → คืน false พร้อม reason', () => {
  const storage = makeStorage({
    [MAIN_KEY]: 'x',
    [BACKUP_KEY]: 'y',
  });
  const r = readSave(storage);
  assert.equal(r.ok, false);
  assert.ok(r.reason);
});

// ---------- 13. ไม่เขียนซ้ำ ----------
test('ข้อมูลเหมือนเดิม → ไม่เขียนซ้ำ', () => {
  const storage = makeStorage();
  const st = sampleState();
  writeSave(storage, st);
  const setsBefore = storage.calls.set;
  const w = writeSave(storage, st);
  assert.equal(w.ok, true);
  assert.equal(w.unchanged, true);
  assert.equal(storage.calls.set, setsBefore);
});

// ---------- 14. hasSave / deleteSave ----------
test('hasSave ถูกต้อง (มีเซฟอยู่ = true ไม่ว่าใช้ได้หรือไม่)', () => {
  const storage = makeStorage();
  assert.equal(hasSave(storage), false);
  const a = sampleState();
  a.game.tickCount = 1;
  writeSave(storage, a);
  assert.equal(hasSave(storage), true);
  storage.setItem(MAIN_KEY, 'broken');
  assert.equal(hasSave(storage), true); // ยังมีเซฟอยู่
  storage.setItem(BACKUP_KEY, 'broken');
  assert.equal(hasSave(storage), true); // ยังมีเซฟอยู่ (แต่เสีย)
  deleteSave(storage);
  assert.equal(hasSave(storage), false);
});

test('deleteSave ลบหลัก+backup', () => {
  const storage = makeStorage();
  writeSave(storage, sampleState());
  writeSave(storage, sampleState());
  assert.equal(hasSave(storage), true);
  const d = deleteSave(storage);
  assert.equal(d.ok, true);
  assert.equal(storage.getItem(MAIN_KEY), null);
  assert.equal(storage.getItem(BACKUP_KEY), null);
  assert.equal(hasSave(storage), false);
});
