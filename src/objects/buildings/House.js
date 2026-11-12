// ===============================
// House Building Object
// ===============================
import { BuildingTile } from '../tiles/BuildingTile.js';

export class House extends BuildingTile {
  constructor(scene, x, y) {
    super(scene, x, y, 'house', 32);
    this.population = 1;
    this.happiness = 100;
  }

  spawn() {
    const s = super.spawn();
    s.setTint(0xffffff);
    return s;
  }

  // Update population over time
  update(scene) {
    // House maintains 1 population
    // In a more complex system, this would increase with food surplus
  }

  getPopulation() {
    return this.population;
  }
}
