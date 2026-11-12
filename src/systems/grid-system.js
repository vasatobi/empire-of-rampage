// ===============================
// GridSystem — ระบบจัดการ grid หลัก
// ===============================
import { Grid } from '../utils/grid.js';
import { Resources } from '../data/resources.js';

export class GridSystem {
  constructor(scene, width = 100, height = 100) {
    this.scene = scene;
    this.grid = new Grid(width, height);
    this.tileSize = 32;
    this.tiles = [];
    this.coords = [];
    this.gridOffset = { x: 0, y: 0 };

    // แถบทรัพยากร
    this.resourceBar = scene.physics.add.staticGroup();

    // เส้นกริด (grid lines)
    this.gridLines = [];
    for (let x = 0; x <= width; x++) {
      const line = scene.add.line(x * this.tileSize, 0, x * this.tileSize, height * this.tileSize, 0x1a1a2e, 1, 0x1a1a2e, 1, 0x1a1a2e);
      this.gridLines.push(line);
    }
    for (let y = 0; y <= height; y++) {
      const line = scene.add.line(0, y * this.tileSize, width * this.tileSize, y * this.tileSize, 0x1a1a2e, 1, 0x1a1a2e, 1, 0x1a1a2e);
      this.gridLines.push(line);
    }
  }

  update() {}
}
