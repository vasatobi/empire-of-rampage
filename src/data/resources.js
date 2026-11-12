// ===============================
// ข้อมูลทรัพยากรของจักรวรรดิ
// ===============================
export const RESOURCES = {
  food:    { key: 'food',    name: 'อาหาร',    symbol: '🍞', base: 0,  max: 9999,  color: '#4ade80',  price: 10 },
  wood:    { key: 'wood',    name: 'ไม้',      symbol: '🪵', base: 0,  max: 9999,  color: '#facc15',  price: 15 },
  stone:   { key: 'stone',   name: 'หิน',      symbol: '🪨', base: 0,  max: 9999,  color: '#9ca3af',  price: 20 },
  gold:    { key: 'gold',    name: 'ทอง',     symbol: '👑', base: 0,  max: 9999,  color: '#f59e0b',  price: 25 },
};

export function resetResources() {
  Object.values(RESOURCES).forEach(r => { r.current = r.base; });
}

export function getResource(key) {
  return RESOURCES[key] || null;
}

export function addResource(key, amount = 1) {
  const res = RESOURCES[key];
  if (!res) return 0;
  const newVal = Math.min(res.max, res.current + amount);
  res.current = newVal;
  return newVal - res.current; // negative if capped
}

export function removeResource(key, amount = 1) {
  return addResource(key, -amount);
}
