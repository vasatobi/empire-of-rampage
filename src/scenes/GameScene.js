// ===============================
// GameScene — หน้าเกมหลัก
// ===============================
import { Scene } from 'phaser';
import { Grid } from '../utils/grid.js';
import { RESOURCES, resetResources, getResource, addResource, removeResource } from '../data/resources.js';
import { BUILDINGS, BUILDING_GROUPS } from '../data/buildings.js';
import { createGrassTile, createBuildingSprite } from '../utils/pixel-art.js';
import { GrassTile } from '../objects/tiles/GrassTile.js';
import { BuildingTile } from '../objects/tiles/BuildingTile.js';
import { House } from '../objects/buildings/House.js';
import { Farm } from '../objects/buildings/Farm.js';
import { Road } from '../objects/buildings/Road.js';
import { ResourceBar } from '../ui/ResourceBar.js';
import { BuildingMenu } from '../ui/BuildingMenu.js';

export class GameScene extends Scene {
  constructor() {
    super('GameScene');
    this.gridOffset = { x: 0, y: 0 };
  }

  create() {
    // --- Config ---
    this.gridSize = 64;
    this.tileSize = 32;
    this.showGrid = true;

    // --- Grid ---
    this.grid = new Grid(this.gridSize, this.gridSize);

    // --- Game state ---
    this.buildings = [];
    this.buildingPreview = null;
    this.selectedBuilding = null;
    this.nextBuildId = 1; // ลำดับ ID ของ building

    // --- UI ---
    this.createUI();

    // --- Terrain ---
    this.createTerrain();

    // --- Reset resources (ย้ายขึ้นมาก่อน UI) ---
    resetResources();

    // --- Camera ---
    this.cameras.main.setSize(this.gridSize * this.tileSize, this.gridSize * this.tileSize);
    this.cameras.main.setPosition(0, 0);

    // --- Input ---
    this.setupInput();

    // --- Game state ---
    this.gameStateChanged = false;

    // --- Handle resize ---
    this.scale.on('resize', this.handleResize, this);

    // --- Place a default farm to show production ---
    this.placeDefaultFarm();
  }

  createTerrain() {
    const size = this.tileSize;
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tile = new GrassTile(this, x * size, y * size, size);
        tile.spawn();
        this.tiles.push(tile);
      }
    }
  }

  placeDefaultFarm() {
    // Place a farm to show production system
    const farm = new Farm(this, 4 * this.tileSize, 4 * this.tileSize);
    farm.spawn();
    this.buildings.push(farm);
    // Register on grid
    this.grid.placeBuilding(4, 4, 'farm');
  }

  createUI() {
    this.resourceBar = new ResourceBar(this, 20, 20, 400);
    this.buildingMenu = new BuildingMenu(this, 580, 20);
  }

  setupInput() {
    // Left click — place building
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) return;
      if (this.buildingMenu.visible === true) return;
      const cell = this.getCellAt(pointer.x, pointer.y);
      if (cell) {
        const buildingId = this.selectedBuilding;
        if (buildingId && BUILDINGS[buildingId]) {
          const building = BUILDINGS[buildingId];
          const { cost } = building;
          let canAfford = true;
          const missing = [];
          Object.entries(cost).forEach(([resKey, amount]) => {
            const res = getResource(resKey);
            if (res.current < amount) {
              canAfford = false;
              missing.push(`${res.symbol} ${amount - res.current}`);
            }
          });
          if (canAfford) {
            // Deduct
            Object.entries(cost).forEach(([resKey, amount]) => {
              removeResource(resKey, amount);
            });
            // Place
            this.grid.placeBuilding(Math.floor(cell.x), Math.floor(cell.y), buildingId);
            this.updateTerrain();
            this.gameStateChanged = true;
          } else {
            const msg = this.add.text(pointer.x, pointer.y, `ไม่พอ: ${missing.join(', ')}`, {
              fontFamily: 'Courier New, monospace',
              fontSize: '13px',
              color: '#ef4444',
            }).setDepth(100);
            this.time.delayedCall(1500, () => msg.destroy());
          }
        }
      }
    });

    // Right click — remove building
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        const cell = this.getCellAt(pointer.x, pointer.y);
        if (cell) {
          this.grid.removeBuilding(Math.floor(cell.x), Math.floor(cell.y));
          this.updateTerrain();
        }
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-R', () => this.selectBuilding('road'));
    this.input.keyboard.on('keydown-H', () => this.selectBuilding('house'));
    this.input.keyboard.on('keydown-F', () => this.selectBuilding('farm'));
    this.input.keyboard.on('keydown-1', () => this.selectBuilding('house'));
    this.input.keyboard.on('keydown-2', () => this.selectBuilding('farm'));
    this.input.keyboard.on('keydown-3', () => this.selectBuilding('road'));
  }

  getCellAt(px, py) {
    const col = Math.floor((px - this.gridOffset.x) / this.tileSize);
    const row = Math.floor((py - this.gridOffset.y) / this.tileSize);
    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return null;
    return { x: col, y: row };
  }

  selectBuilding(buildingId) {
    this.selectedBuilding = buildingId;
    this.buildingMenu.selectedBuilding = buildingId;
    // Highlight
    if (this.buildingPreview) {
      this.buildingPreview.destroy();
      this.buildingPreview = null;
    }
    if (BUILDINGS[buildingId]) {
      const b = BUILDINGS[buildingId];
      const px = this.grid.cells[0][0].x * this.tileSize;
      const py = this.grid.cells[0][0].y * this.tileSize;
      const img = this.add.image(px, py, b.icon)
        .setOrigin(0.5, 0.5)
        .setDepth(10)
        .setScale(2);
      this.buildingPreview = img;
    }
  }

  updateTerrain() {
    // If there are no buildings, rebuild terrain
    if (this.buildings.length === 0 && this.grid.getBuildingCounts().totalBuildings === 0) {
      this.createTerrain();
      return;
    }

    // Remove old tiles (keep grass, remove old building sprites)
    this.tiles.forEach(t => t.despawn());
    this.tiles = [];

    // Rebuild terrain
    this.createTerrain();

    // Remove old building sprite instances
    // Note: building tiles are already removed by despawn in next step
    this.buildings.forEach(b => {
      if (b.sprite) {
        b.sprite.destroy();
      }
    });
    this.buildings = [];

    // Re-add buildings from grid
    const placed = this.grid.getBuildingCounts();
    Object.entries(placed).forEach(([bId, count]) => {
      for (let i = 0; i < count; i++) {
        for (let y = 0; y < this.gridSize; y++) {
          for (let x = 0; x < this.gridSize; x++) {
            const cell = this.grid.cells[y][x];
            if (cell.building && cell.building.id === bId) {
              const BuildingClass = this.getBuildingClass(bId);
              if (BuildingClass) {
                const tile = new BuildingClass(this, x * this.tileSize, y * this.tileSize);
                tile.spawn();
                this.buildings.push(tile);
              }
              break;
            }
          }
        }
      }
    });
  }

  getBuildingClass(buildingId) {
    const map = {
      house: House,
      farm: Farm,
      road: Road,
    };
    return map[buildingId];
  }

  update() {
    // Update resource bar
    this.resourceBar.update();

    // Game loop: update buildings (production)
    this.updateBuildings();

    // Game state management
    this.updateGameState();

    // Update camera
    this.updateCamera();
  }

  // Pathfinding: check if two cells are connected via roads
  areConnected(x1, y1, x2, y2) {
    // Simple BFS to check if two cells are connected
    if (x1 === x2 && y1 === y2) return true;
    const visited = new Set();
    const queue = [{ x: x1, y: y1 }];
    visited.add(`${x1},${y1}`);

    while (queue.length > 0) {
      const current = queue.shift();
      const [cx, cy] = [current.x, current.y];

      // Check neighbors
      const neighbors = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy - 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (visited.has(key)) continue;
        if (!this.grid.inBounds(neighbor.x, neighbor.y)) continue;
        const cell = this.grid.cells[neighbor.y][neighbor.x];
        if (cell.type === 'road' || (cell.building && cell.building.id === 'road')) {
          visited.add(key);
          queue.push(neighbor);
          if (neighbor.x === x2 && neighbor.y === y2) return true;
        } else if (cell.type === 'grass') {
          // Skip grass, continue BFS through passages
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  // Check if a new road placement would create a valid connection
  canConnectRoads(cx, cy) {
    // Check if this road connects to at least one existing road or building
    const cellsToCheck = [
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 },
    ];

    let hasConnection = false;
    for (const { x, y } of cellsToCheck) {
      if (!this.grid.inBounds(x, y)) continue;
      const cell = this.grid.cells[y][x];
      if (cell.type === 'road' || cell.building?.id === 'road' || cell.building?.id === 'house') {
        hasConnection = true;
        break;
      }
    }
    return hasConnection;
  }

  updateBuildings() {
    // Farm produces 1 food per 2 seconds
    for (const building of this.buildings) {
      if (building instanceof Farm) {
        building.updateProduction(this);
      }
    }

    // House: no production, but tracks population
    for (const building of this.buildings) {
      if (building instanceof House) {
        building.update(this);
      }
    }
  }

  // Game state management
  updateGameState() {
    // Check lose condition: no food available
    if (getResource('food').current <= 0) {
      this.loseGame();
    }

    // Check goal condition: reach 5 buildings and 1000 food
    if (this.buildings.length >= 5) {
      // Check if food is plenty (1000+)
      if (getResource('food').current >= 1000) {
        this.winGame();
      }
    }
  }

  loseGame() {
    // Game over - show message
    const msg = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '🏚️  เกมสิ้นสุด - ไม่มีอาหาร!',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        color: '#ef4444',
        bold: true,
      }
    ).setOrigin(0.5, 0.5).setDepth(100);

    // Disable input
    this.input.enabled = false;

    // Auto restart after 3 seconds
    this.time.delayedCall(3000, () => {
      this.restartGame();
    });
  }

  winGame() {
    // Victory
    const msg = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '🏆  ชนะ! จักรวรรดิของคุณเจริญรุ่งเรือง!',
      {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        color: '#34d399',
        bold: true,
      }
    ).setOrigin(0.5, 0.5).setDepth(100);

    this.input.enabled = false;

    this.time.delayedCall(3000, () => {
      this.restartGame();
    });
  }

  restartGame() {
    // Reload the scene
    this.scene.restart();
  }

  // Resource production system
  updateBuildings() {
    // Farm produces 1 food per 2 seconds
    for (const building of this.buildings) {
      if (building instanceof Farm) {
        building.updateProduction(this);
      }
    }

    // House: no production, but increases population
    for (const building of this.buildings) {
      if (building instanceof House) {
        building.update(this);
      }
    }
  }

  updateCamera() {
    // Camera follows mouse cursor in game world
    const pointer = this.input.activePointer;
    if (pointer.active) {
      const worldPoint = this.cameras.main.worldPoint;
      // Get mouse position in world coordinates
      const mx = pointer.x / this.cameras.main.scrollX;
      const my = pointer.y / this.cameras.main.scrollY;
      // The camera should look at where the mouse is pointing
      // We need to compute target based on mouse
      const targetX = this.grid.cells[0][0].x + (pointer.x / this.tileSize);
      const targetY = this.grid.cells[0][0].y + (pointer.y / this.tileSize);
      this.cameras.main.scrollX += (targetX - this.cameras.main.scrollX) * 0.05;
      this.cameras.main.scrollY += (targetY - this.cameras.main.scrollY) * 0.05;
    } else {
      // Fallback: center on origin
      const targetX = this.grid.cells[0][0].x;
      const targetY = this.grid.cells[0][0].y;
      this.cameras.main.scrollX += (targetX - this.cameras.main.scrollX) * 0.05;
      this.cameras.main.scrollY += (targetY - this.cameras.main.scrollY) * 0.05;
    }
  }

  handleResize() {
    // Nothing to do
  }
}
