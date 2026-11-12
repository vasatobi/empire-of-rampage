// ===============================
// Grass Tile Object
// ===============================
import { createGrassTile } from '../../utils/pixel-art.js';

export class GrassTile {
  constructor(scene, x, y, size = 32) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.sprite = scene.add.tileSprite(x, y, size, size, 0);
  }

  spawn() {
    const canvas = createGrassTile(this.size, this.size);
    this.sprite = this.scene.add.sprite(this.x - this.size/2, this.y - this.size/2, canvas);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(0);
    return this.sprite;
  }

  despawn() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
