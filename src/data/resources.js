// ===============================
// ข้อมูลทรัพยากรของจักรวรรดิ
// ===============================
// base = จำนวนเริ่มต้นเมื่อเริ่มเกม (เดิมเป็น 0 ทั้งหมด ทำให้สร้างอะไรไม่ได้เลย)
// price = ราคาตลาดต่อหน่วย (ฐานซื้อ/ขาย), tradable = ซื้อขายในตลาดได้ไหม (ทองเป็นสกุลเงิน)
export const RESOURCES = {
  food:  { key: 'food',  name: 'อาหาร', symbol: '🍞', base: 50,  max: 9999, color: '#4ade80', price: 10, tradable: true },
  // 🪵 และ 🪨 เป็นอีโมจิใหม่ (ปี 2020) Windows 10 ไม่มีฟอนต์ จึงแสดงเป็นกรอบสี่เหลี่ยม
  // เปลี่ยนเป็นอีโมจิรุ่นเก่าที่ทุกเครื่องแสดงได้
  wood:  { key: 'wood',  name: 'ไม้',   symbol: '🌲', base: 100, max: 9999, color: '#facc15', price: 15, tradable: true },
  stone: { key: 'stone', name: 'หิน',   symbol: '🧱', base: 50,  max: 9999, color: '#9ca3af', price: 20, tradable: true },
  gold:  { key: 'gold',  name: 'ทอง',   symbol: '👑', base: 0,   max: 9999, color: '#f59e0b', price: 25, tradable: false },
};

// ต้องเรียกก่อนสร้าง UI ทุกครั้ง เพราะฟิลด์ current ถูกสร้างที่นี่เท่านั้น
export function resetResources() {
  Object.values(RESOURCES).forEach((r) => {
    r.current = r.base;
  });
}

export function getResource(key) {
  return RESOURCES[key] || null;
}

// คืนค่า "จำนวนที่เปลี่ยนจริง" (บวก = เพิ่ม, ลบ = ลด) และไม่ให้ต่ำกว่า 0 หรือเกิน max
export function addResource(key, amount = 1) {
  const res = RESOURCES[key];
  if (!res) return 0;
  const before = res.current ?? 0;
  res.current = Math.max(0, Math.min(res.max, before + amount));
  return res.current - before;
}

export function removeResource(key, amount = 1) {
  return addResource(key, -amount);
}

// มีทรัพยากรพอหรือไม่
export function hasResource(key, amount = 1) {
  const res = RESOURCES[key];
  return !!res && (res.current ?? 0) >= amount;
}

// ตรวจสอบว่ามีทรัพยากรครบตาม cost หรือไม่
export function canAfford(cost = {}) {
  return Object.entries(cost).every(([key, amount]) => hasResource(key, amount));
}
