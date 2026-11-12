// ===============================
// Building Tile Object
// ===============================
import { createHouseSprite, createFarmSprite } from '../../utils/pixel-art.js';

export class BuildingTile {
  constructor(scene, x, y, type, size = 32) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.sprite = null;
    this.isSelected = false;
  }

  spawn() {
    let canvas;
    if (this.type === 'house') {
      canvas = createHouseSprite(this.size, this.size);
    } else if (this.type === 'farm') {
      canvas = createFarmSprite(this.size, this.size);
    } else {
      // Fallback: use type icon
      const ctx = document.createElement('canvas').getContext('2d');
      canvas = document.createElement('canvas');
      canvas.width = this.size;
      canvas.height = this.size;
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, this.size, this.size);
      return this.sprite;
    }

    this.sprite = this.scene.add.sprite(this.x - this.size/2, this.y - this.size/2, canvas);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(1);
    return this.sprite;
  }

  despawn() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  setHighlight(bool) {
    if (!this.sprite) return;
    this.isSelected = bool;
    this.sprite.setTint(bool ? 0xffffff : 0xffffff);
  }
}
