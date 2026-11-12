// ===============================
// Road Building Object
// ===============================
import { BuildingTile } from '../tiles/BuildingTile.js';

export class Road extends BuildingTile {
  constructor(scene, x, y) {
    super(scene, x, y, 'road', 32);
  }

  spawn() {
    const s = super.spawn();
    s.setTint(0xffffff);
    return s;
  }
}
