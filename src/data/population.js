// ===============================
// ค่าปรับแต่งระบบประชากร (Phase 7)
// ===============================
export const POPULATION_CONFIG = {
  capacityPerHouse: 5,        // ความจุต่อบ้าน 1 หลัง
  foodPerPersonPerSec: 0.05,  // อาหารที่คนกินต่อวินาที
  growthPerHousePerSec: 0.12, // ประชากรเพิ่มต่อบ้านต่อวินาที (เมื่อเงื่อนไขเหมาะสม)
  declinePerSec: 0.25,        // ประชากรลดลงเมื่ออดอาหาร
  growthHappinessThreshold: 50,

  baseHappiness: 50,
  foodComfortBonus: 20,       // อาหารเพียงพอ
  foodLowBonus: 10,           // อาหารมีแต่น้อย
  starvationPenalty: -30,     // อาหารหมด
  housingBonus: 15,           // มีที่อยู่เหลือ
  overcrowdPenalty: -10,      // ที่อยู่เกินความจุ
  jobsBonus: 10,              // มีงานเพียงพอ
  unemploymentPenalty: -10,   // งานไม่พอ
  taxHappinessCost: 20,       // ภาษีแต่ละ 1.0 ทำให้ความสุขลด
};
