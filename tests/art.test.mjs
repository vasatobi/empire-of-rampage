// ทดสอบข้อมูลสไปรต์ด้วย node ล้วน (ไม่ต้องใช้เบราว์เซอร์/Phaser)
// รัน: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE, ART_SCALE, TRANSPARENT } from '../src/art/palette.js';
import { SPRITES } from '../src/art/sprites.js';
import { BUILDINGS } from '../src/data/buildings.js';

const TILE = 32;
const MAX_COLORS = 18;

test('พาเล็ตต์: รหัสสี hex ถูกต้อง ไม่เกิน 18 สี และไม่ใช้ตัวอักษรโปร่งใสเป็นสี', () => {
  const keys = Object.keys(PALETTE);
  assert.ok(keys.length <= MAX_COLORS, `มี ${keys.length} สี`);
  keys.forEach((k) => {
    assert.equal(k.length, 1, `คีย์ ${k} ต้องเป็นตัวอักษรเดียว`);
    assert.notEqual(k, TRANSPARENT);
    assert.match(PALETTE[k], /^#[0-9A-Fa-f]{6}$/, `สี ${k} ไม่ถูกต้อง`);
  });
  assert.equal(new Set(Object.values(PALETTE).map((c) => c.toLowerCase())).size, keys.length, 'มีสีซ้ำกัน');
});

test('ทุกอาคารใน buildings.js มีสไปรต์ และไม่มีสไปรต์เกิน', () => {
  assert.deepEqual(Object.keys(SPRITES).sort(), Object.keys(BUILDINGS).sort());
});

test('ขนาดสไปรต์ตรงกับ area x 32 px ของอาคาร', () => {
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    const { w, h } = BUILDINGS[id].area;
    assert.equal(sprite.w * ART_SCALE, w * TILE, `${id}: กว้างไม่ตรง`);
    assert.equal(sprite.h * ART_SCALE, h * TILE, `${id}: สูงไม่ตรง`);
  });
});

test('ตารางพิกเซล: จำนวนแถวและความยาวทุกแถวตรงกับ w x h', () => {
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    assert.equal(sprite.art.length, sprite.h, `${id}: จำนวนแถวไม่ตรง`);
    sprite.art.forEach((row, y) => {
      assert.equal(row.length, sprite.w, `${id}: แถว ${y} ยาว ${row.length} ต้องเป็น ${sprite.w}`);
    });
  });
});

test('ตารางพิกเซล: ใช้เฉพาะตัวอักษรในพาเล็ตต์หรือ "."', () => {
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    sprite.art.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        assert.ok(ch === TRANSPARENT || ch in PALETTE, `${id}: ตัวอักษร "${ch}" ที่ (${x},${y}) ไม่อยู่ในพาเล็ตต์`);
      });
    });
  });
});

test('สไปรต์ไม่ว่างเปล่า และอาคารทุกชนิด (ยกเว้นถนน) ไม่มีพิกเซลสีติดขอบกรอบ (ขอบกรอบเป็นได้แค่ "." หรือเส้นขอบมืด K)', () => {
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    const opaque = sprite.art.join('').replaceAll(TRANSPARENT, '').length;
    assert.ok(opaque > 0, `${id}: ไม่มีพิกเซลสี`);
    if (id === 'road') return; // ถนนเต็มช่องเพื่อต่อกันได้สนิท
    const last = sprite.h - 1;
    const lastCol = sprite.w - 1;
    const edgeOk = (ch) => ch === TRANSPARENT || ch === 'K';
    assert.ok([...sprite.art[0]].every(edgeOk), `${id}: แถวบนสุดมีพิกเซลสีที่ไม่ใช่ขอบ`);
    assert.ok([...sprite.art[last]].every(edgeOk), `${id}: แถวล่างสุดมีพิกเซลสีที่ไม่ใช่ขอบ`);
    sprite.art.forEach((row, y) => {
      assert.ok(edgeOk(row[0]), `${id}: คอลัมน์ซ้ายสุดแถว ${y} มีพิกเซลสีที่ไม่ใช่ขอบ`);
      assert.ok(edgeOk(row[lastCol]), `${id}: คอลัมน์ขวาสุดแถว ${y} มีพิกเซลสีที่ไม่ใช่ขอบ`);
    });
  });
});

test('อาคารที่ไม่ใช่ถนนมีขอบมืด (K) ครบรอบตัวอาคาร: ไม่มีพิกเซลสีที่ติดกับพื้นโปร่งใสโดยไม่มีขอบ', () => {
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    if (id === 'road') return;
    sprite.art.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === TRANSPARENT || ch === 'K') return;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const n = sprite.art[y + dy]?.[x + dx];
          assert.notEqual(n, TRANSPARENT, `${id}: พิกเซล "${ch}" ที่ (${x},${y}) ติดพื้นโปร่งใสโดยไม่มีขอบ`);
        });
      });
    });
  });
});
