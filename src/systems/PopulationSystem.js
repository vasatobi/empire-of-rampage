// ===============================
// PopulationSystem — ระบบประชากรและความสุข (Phase 7)
// - บ้านมีความจุ ประชากรเพิ่มเมื่ออาหารพอและความสุขดี
// - ประชากรกินอาหารทุกวินาที
// - ความสุขขึ้นกับอาหาร ที่อยู่ งาน และภาษี
// ===============================
import { getResource, removeResource } from '../data/resources.js';
import { POPULATION_CONFIG as CFG } from '../data/population.js';

export class PopulationSystem {
  constructor() {
    this.population = 0;                 // จำนวนจริง (ทศนิยม)
    this.happiness = CFG.baseHappiness;  // 0 - 100
    this.capacity = 0;
    this.foodFraction = 0;               // เศษอาหารที่สะสมไว้
  }

  update(deltaMs, { houses = 0, jobs = 0, taxRate = 1, capacity = 0 } = {}) {
    const dt = deltaMs / 1000;
    this.capacity = capacity;

    // ประชากรกินอาหาร (สะสมเศษทศนิยม แล้วค่อยหักเป็นจำนวนเต็ม)
    this.foodFraction += this.population * CFG.foodPerPersonPerSec * dt;
    let eaten = 0;
    if (this.foodFraction >= 1) {
      eaten = Math.floor(this.foodFraction);
      this.foodFraction -= eaten;
      removeResource('food', eaten);
    }

    const foodNow = getResource('food')?.current ?? 0;

    // คำนวณความสุข
    let h = CFG.baseHappiness;
    if (foodNow <= 0) h += CFG.starvationPenalty;
    else if (foodNow < this.population * 5) h += CFG.foodLowBonus;
    else h += CFG.foodComfortBonus;

    if (capacity > 0 && capacity > this.population) h += CFG.housingBonus;
    else if (capacity > 0 && capacity <= this.population) h += CFG.overcrowdPenalty;

    if (jobs >= this.population) h += CFG.jobsBonus;
    else h += CFG.unemploymentPenalty;

    h -= taxRate * CFG.taxHappinessCost;

    this.happiness = Math.max(0, Math.min(100, h));

    // ประชากรเพิ่มเมื่อ: มีอาหาร + ความสุข >= เกณฑ์ + ยังไม่เกินความจุ
    if (foodNow > 0 && this.happiness >= CFG.growthHappinessThreshold && this.population < capacity) {
      this.population += CFG.growthPerHousePerSec * houses * dt;
    } else if (foodNow <= 0 && this.population > 0) {
      // อดอาหาร: ประชากรลดลง
      this.population = Math.max(0, this.population - CFG.declinePerSec * dt);
    }

    if (this.population > capacity) this.population = capacity;

    return {
      population: Math.floor(this.population),
      happiness: Math.round(this.happiness),
      capacity,
      eaten,
    };
  }
}
