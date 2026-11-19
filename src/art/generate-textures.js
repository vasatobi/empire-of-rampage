// ===============================
// สร้าง texture ของสไปรต์จากตารางตัวอักษร
// ===============================
// ไม่ import Phaser: รับ scene เข้ามาแล้วใช้ scene.textures.addCanvas (มีใน Phaser 4.2.1)
// วาด 1 พิกเซลศิลป์เป็นสี่เหลี่ยม ART_SCALE x ART_SCALE ลงบน canvas ตรงๆ
// จึงคมชัดโดยไม่ต้องตั้ง pixelArt หรือฟิลเตอร์ใดๆ และไม่กระทบตัวหนังสือของ UI
import { PALETTE, ART_SCALE, TRANSPARENT } from './palette.js';
import { SPRITES } from './sprites.js';

export const textureKey = (id) => `bld_${id}`;
export const thumbKey = (id) => `bld_${id}_thumb`;

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawSprite(sprite) {
  const canvas = makeCanvas(sprite.w * ART_SCALE, sprite.h * ART_SCALE);
  const ctx = canvas.getContext('2d');
  sprite.art.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === TRANSPARENT) continue;
      ctx.fillStyle = PALETTE[ch];
      ctx.fillRect(x * ART_SCALE, y * ART_SCALE, ART_SCALE, ART_SCALE);
    }
  });
  return canvas;
}

// ภาพย่อสำหรับปุ่มเลือกอาคาร: ย่อครึ่งหนึ่งแบบ nearest-neighbor (ถนน 32x32 ใช้ขนาดเดิม)
function drawThumb(source, id) {
  const half = id === 'road' ? 1 : 0.5;
  const canvas = makeCanvas(Math.round(source.width * half), Math.round(source.height * half));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// เรียกซ้ำได้อย่างปลอดภัย (ข้ามอันที่มีอยู่แล้ว) ควรเรียกก่อนสร้างอาคารหรือเมนูทุกครั้ง
export function generateTextures(scene) {
  const textures = scene.textures;
  Object.entries(SPRITES).forEach(([id, sprite]) => {
    const key = textureKey(id);
    const thumb = thumbKey(id);
    if (textures.exists(key) && textures.exists(thumb)) return;

    const canvas = drawSprite(sprite);
    if (!textures.exists(key)) textures.addCanvas(key, canvas);
    if (!textures.exists(thumb)) textures.addCanvas(thumb, drawThumb(canvas, id));
  });
}

// ใช้ตรวจก่อนวาดอาคาร: ถ้า texture ไม่มี ให้ใช้วิธีวาดแบบสี่เหลี่ยมเดิมแทน (กัน crash)
export function hasBuildingTexture(scene, id) {
  return scene.textures.exists(textureKey(id));
}
