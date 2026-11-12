// ===============================
// ข้อมูลสิ่งก่อสร้าง
// ===============================
export const BUILDINGS = {
  house: {
    id: 'house',
    name: 'บ้าน',
    icon: '🏠',
    desc: 'ที่อยู่อาศัยผู้คน',
    cost: { wood: 10, stone: 5 },
    area: { w: 2, h: 2 },
    color: '#6b4f9e',
    highlight: '#c084fc',
    type: 'residential',
  },
  farm: {
    id: 'farm',
    name: 'ฟาร์ม',
    icon: '🌾',
    desc: 'ผลิตอาหาร',
    cost: { wood: 20, food: 5 },
    area: { w: 3, h: 2 },
    color: '#4ade80',
    highlight: '#86efac',
    type: 'production',
  },
  road: {
    id: 'road',
    name: 'ถนน',
    icon: '🛣️',
    desc: 'เชื่อมต่อและเดินทาง',
    cost: { stone: 3 },
    area: { w: 1, h: 1 },
    color: '#6b7280',
    highlight: '#9ca3af',
    type: 'infrastructure',
  },
};

export const BUILDING_GROUPS = [
  { id: 'residential', title: 'ที่อยู่อาศัย', color: '#6b4f9e', icon: '🏚️' },
  { id: 'production',  title: 'ผลิตสินค้า',  color: '#4ade80', icon: '⚙️' },
  { id: 'infrastructure', title: 'โครงสร้างพื้นฐาน', color: '#6b7280', icon: '🛤️' },
];
