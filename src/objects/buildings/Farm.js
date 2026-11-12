// ===============================
// Farm Building Object
// ===============================
import { BuildingTile } from '../tiles/BuildingTile.js';
import { addResource } from '../../data/resources.js';

export class Farm extends BuildingTile {
  constructor(scene, x, y) {
    super(scene, x, y, 'farm', 32);
    this.produceAmount = 1;
    this.produceInterval = 2000; // 2 seconds
    this.lastProduceTime = 0;
  }

  spawn() {
    const s = super.spawn();
    s.setTint(0xffffff);
    this.lastProduceTime = performance.now();
    return s;
  }

  updateProduction(scene) {
    const now = performance.now();
    if (now - this.lastProduceTime >= this.produceInterval) {
      // Farm produces 1 food
      const gained = addResource('food', this.produceAmount);
      if (gained > 0) {
        // Optionally show feedback
      }
      this.lastProduceTime = now;
    }
  }
}
