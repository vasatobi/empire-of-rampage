// ===============================
// Road Tile Object
// ===============================
import { createRoadPieceSprite } from '../../utils/pixel-art.js';

export class RoadTile {
  constructor(scene, x, y, size = 32) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.sprite = null;
  }

  spawn() {
    const canvas = createRoadPieceSprite(this.size, this.size);
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
