// ===============================
// EconomySystem — ระบบเศรษฐกิจ (Phase 7)
// - รายรับ: ภาษีจากประชากร + ถนน
// - รายจ่าย: ค่าบำรุงรักษาสิ่งก่อสร้าง
// - ทองเป็นสกุลเงินจริง ใช้ซื้อขายในตลาดได้
// ===============================
import { addResource, removeResource } from '../data/resources.js';
import { ECONOMY_CONFIG } from '../data/economy.js';

export class EconomySystem {
  constructor() {
    this.goldFraction = 0;
    this.lastIncomePerMin = 0;
    this.lastExpensePerMin = 0;
    this.lastNetPerMin = 0;
    this.totalIncome = 0;
    this.totalExpense = 0;
  }

  getUpkeepPerMin(buildings) {
    return buildings.reduce((sum, b) => sum + (b.upkeep || 0), 0);
  }

  update(deltaMs, { population = 0, buildings = [], taxRate = 1, roadCount = 0 } = {}) {
    const dtMin = deltaMs / 60000;

    const income =
      population * ECONOMY_CONFIG.taxPerPersonPerMin * taxRate +
      roadCount * ECONOMY_CONFIG.roadTaxBonusPerMin;
    const expense = this.getUpkeepPerMin(buildings);
    const net = income - expense;

    this.lastIncomePerMin = income;
    this.lastExpensePerMin = expense;
    this.lastNetPerMin = net;
    this.totalIncome += income * dtMin;
    this.totalExpense += expense * dtMin;

    // สะสมเศษทอง แล้วค่อยเพิ่ม/ลดเป็นจำนวนเต็ม
    this.goldFraction += net * dtMin;
    let gained = 0;
    if (this.goldFraction >= 1) {
      gained = Math.floor(this.goldFraction);
      this.goldFraction -= gained;
      addResource('gold', gained);
    } else if (this.goldFraction <= -1) {
      const loss = Math.floor(Math.abs(this.goldFraction));
      this.goldFraction += loss;
      removeResource('gold', loss);
      gained = -loss;
    }

    return { income, expense, net, gained };
  }
}
