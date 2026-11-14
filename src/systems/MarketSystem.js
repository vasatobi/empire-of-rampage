// ===============================
// MarketSystem — ระบบตลาด (Phase 7)
// - ราคาซื้อ/ขายคำนวณจากราคาหลัก × ดัชนีราคา
// - ราคาเปลี่ยนตามการซื้อขาย และคืนตัวเฉลี่ย
// - ถนนลดค่าธรรมเนียม
// - ป้องกันซื้อขายเมื่อทรัพยากร/ทองไม่พอ
// ===============================
import { RESOURCES, getResource, addResource, removeResource } from '../data/resources.js';
import { MARKET_CONFIG as CFG } from '../data/market.js';

export class MarketSystem {
  constructor() {
    this.priceIndex = { food: 1, wood: 1, stone: 1 };
  }

  update(deltaMs) {
    const dt = deltaMs / 1000;
    for (const key of Object.keys(this.priceIndex)) {
      const idx = this.priceIndex[key];
      this.priceIndex[key] = idx + (1 - idx) * CFG.meanReversion * dt;
    }
  }

  getFeeFactor(roadCount = 0) {
    return Math.max(CFG.minFeeFactor, CFG.feeFactor - roadCount * CFG.roadFeeDiscount);
  }

  getPrices(roadCount = 0) {
    const fee = this.getFeeFactor(roadCount);
    const prices = {};
    for (const key of Object.keys(this.priceIndex)) {
      const base = RESOURCES[key]?.price ?? 10;
      const idx = this.priceIndex[key];
      prices[key] = {
        buy: Math.max(1, Math.ceil(base * idx * (1 + fee))),
        sell: Math.max(1, Math.floor(base * idx * (1 - fee))),
        index: idx,
      };
    }
    return prices;
  }

  canBuy(key, amount, roadCount = 0) {
    const res = getResource(key);
    const gold = getResource('gold');
    if (!res || !res.tradable) return { ok: false, reason: 'สินค้านี้ซื้อไม่ได้' };
    const price = this.getPrices(roadCount)[key];
    const cost = price.buy * amount;
    if ((gold.current ?? 0) < cost) return { ok: false, reason: `ทองไม่เพียงพอ (ต้องใช้ ${cost})` };
    if ((res.current ?? 0) >= res.max) return { ok: false, reason: 'สินค้าเต็มคลัง' };
    return { ok: true, cost };
  }

  canSell(key, amount) {
    const res = getResource(key);
    if (!res || !res.tradable) return { ok: false, reason: 'สินค้านี้ขายไม่ได้' };
    if ((res.current ?? 0) < amount) {
      return { ok: false, reason: `${res.name}ไม่เพียงพอ (มี ${Math.floor(res.current ?? 0)})` };
    }
    const gold = getResource('gold');
    if ((gold.current ?? 0) >= gold.max) return { ok: false, reason: 'ทองเต็มคลัง' };
    return { ok: true };
  }

  buy(key, amount, roadCount = 0) {
    const check = this.canBuy(key, amount, roadCount);
    if (!check.ok) return check;
    removeResource('gold', check.cost);
    addResource(key, amount);
    this.priceIndex[key] = Math.min(
      CFG.maxIndex,
      this.priceIndex[key] * (1 + CFG.priceImpact * amount)
    );
    return { ok: true, cost: check.cost };
  }

  sell(key, amount) {
    const check = this.canSell(key, amount);
    if (!check.ok) return check;
    const price = this.getPrices()[key];
    const gain = price.sell * amount;
    removeResource(key, amount);
    addResource('gold', gain);
    this.priceIndex[key] = Math.max(
      CFG.minIndex,
      this.priceIndex[key] * (1 - CFG.priceImpact * amount)
    );
    return { ok: true, gain };
  }
}
