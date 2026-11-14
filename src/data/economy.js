// ===============================
// ค่าปรับแต่งระบบเศรษฐกิจ (Phase 7)
// ===============================
export const ECONOMY_CONFIG = {
  taxPerPersonPerMin: 0.5,   // รายรับจากภาษี ต่อคนต่อนาที (อ้างอิงภาษีกลาง)
  roadTaxBonusPerMin: 0.05,  // ถนนแต่ละช่องเพิ่มรายรับต่อนาที
  goldMax: 9999,
};

// อัตราภาษี: mult = ตัวคูณรายรับ และใช้ลดความสุขด้วย
export const TAX_RATES = [
  { id: 'low',    label: 'ภาษีต่ำ',  mult: 0.5 },
  { id: 'normal', label: 'ภาษีกลาง', mult: 1.0 },
  { id: 'high',   label: 'ภาษีสูง',  mult: 1.5 },
];

export const DEFAULT_TAX_RATE = 1.0;
