# Empire of Rampage

เกม 2D City Building / Strategy / Resource Management
เล่นผ่านเว็บเบราว์เซอร์ (JavaScript + Phaser 3 + Vite)

---

## 1. วิธีเปิดเกม

### เปิดในโหมดพัฒนา (Dev)

```bash
# 1) cd เข้าโฟลเดอร์โปรเจกต์
cd Empire-of-Rampage

# 2) ติดตั้ง dependencies
npm install

# 3) รัน dev server
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:5173/`

---

### Build และทำ Production (Preview)

```bash
# 1) สร้างไฟล์ dist
npm run build

# 2) รัน preview server
npm run preview
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:4173/`

---

## 2. โครงสร้างโปรเจกต์

```
Empire-of-Rampage/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js              # entry point (สร้าง Phaser.Game)
│   ├── style.css            # ใส่สไตล์ให้ canvas
│   ├── scenes/
│   │   ├── MainMenu.js      # หน้าเมนูหลัก
│   │   └── GameScene.js     # หน้าเกมหลัก
│   ├── data/
│   │   ├── resources.js     # อาหาร / ไม้ / หิน / ทอง
│   │   └── buildings.js     # บ้าน / ฟาร์ม / ถนน
│   ├── ui/
│   │   ├── ResourceBar.js   # แถบแสดงทรัพยากร
│   │   └── BuildingMenu.js  # เมนูเลือกสิ่งก่อสร้าง
│   ├── utils/
│   │   ├── grid.js          # ระบบ Grid
│   │   └── pixel-art.js     # สร้างกราฟิก pixel art
│   ├── objects/
│   │   ├── tiles/           # Grass, Road, Building
│   │   └── buildings/       # House, Farm, Road
│   └── systems/
│       └── grid-system.js   # ระบบ Grid หลัก
└── dist/                    # output ของ npm run build
```

---

## 3. เทคนิคที่ใช้

| ส่วน | เทคนิค |
|---|---|
| Rendering | Phaser 3 (Canvas/WebGL) |
| Grid | 2D grid (64×64 cells), tile-based |
| Pixel art | สร้างกราฟิกด้วย JavaScript (Canvas 2D) ในโค้ด |
| Resource | ระบบออบเจ็กต์ + update loop |
| UI | Phaser Text objects + Rectangle containers |
| Input | Pointer events + Keyboard (H/R/F keys) |
| State | Phaser Scene system (MainMenu → GameScene) |

---

## 4. คีย์ลัด

| Key | Action |
|---|---|
| H | เลือก House |
| R | เลือก Road |
| F | เลือก Farm |
| Right-click | ลบ building |

---

## 5. วิธีพัฒนาต่อ

1. `cd Empire-of-Rampage`
2. `npm run dev`
3. แก้ไขไฟล์ `src/` (auto-reload)
4. ทดสอบใน browser

---

## 6. สิ่งที่ทำไปแล้ว

- ✅ สร้างโปรเจกต์ Vite + Phaser 3
- ✅ โครงสร้างโฟลเดอร์เรียบร้อย
- ✅ Data (resources, buildings)
- ✅ Grid system + Pixel art utilities
- ✅ Tile objects (Grass, Road, Building)
- ✅ Building objects (House, Farm, Road)
- ✅ UI (ResourceBar, BuildingMenu)
- ✅ GameScene + MainMenu
- ✅ Build & Preview ใน browser
