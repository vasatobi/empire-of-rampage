// ===============================
// เครื่องมือสร้าง pixel art ด้วย Canvas
// ===============================
export function createSquareSprite(
  textureKey, color, size = 32, outline = '#000000'
) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  if (outline) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size - 1, size - 1);
  }
  return canvas;
}

export function createGrassTile(w = 32, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#7dd3a0');
  g.addColorStop(0.5, '#4ade80');
  g.addColorStop(1, '#22c55e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // grass texture lines
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i + 2, 0);
    ctx.lineTo(i + 2, 6);
    ctx.stroke();
  }
  for (let i = 0; i < h; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i + 2);
    ctx.lineTo(6, i + 2);
    ctx.stroke();
  }
  // grass tufts (decorative)
  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 5);
    ctx.lineTo(x + 2, y + 5);
    ctx.closePath();
    ctx.fill();
  }
  return canvas;
}

export function createRoadSprite(w = 32, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(0, 0, w, h);
  // road markings
  ctx.strokeStyle = '#f9fafb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, h / 2 - 4);
    ctx.lineTo(i + 8, h / 2 - 4);
    ctx.stroke();
  }
  return canvas;
}

export function createHouseSprite(w = 32, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const baseColor = '#6b4f9e';
  // House body
  ctx.fillStyle = baseColor;
  ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.55);
  // Roof
  ctx.fillStyle = '#4338ca';
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.3);
  ctx.lineTo(w * 0.5, 0);
  ctx.lineTo(w * 0.95, h * 0.3);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(w * 0.42, h * 0.55, w * 0.16, h * 0.3);
  // Windows
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(w * 0.25, h * 0.4, w * 0.12, w * 0.12);
  ctx.fillRect(w * 0.63, h * 0.4, w * 0.12, w * 0.12);
  // Window glow
  ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.fillRect(w * 0.25, h * 0.4, w * 0.12, w * 0.12);
  ctx.fillRect(w * 0.63, h * 0.4, w * 0.12, w * 0.12);
  // Windows outline
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.25, h * 0.4, w * 0.12, w * 0.12);
  ctx.strokeRect(w * 0.63, h * 0.4, w * 0.12, w * 0.12);
  // Yard
  ctx.fillStyle = '#d1d5db';
  ctx.fillRect(w * 0.1, h * 0.85, w * 0.8, h * 0.1);
  return canvas;
}

export function createFarmSprite(w = 32, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const baseColor = '#4ade80';
  // Farm field
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);
  // Quadrants
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(w * 0.25, h * 0.15, w * 0.25, h * 0.3);
  ctx.fillRect(w * 0.5,  h * 0.15, w * 0.25, h * 0.3);
  ctx.fillRect(w * 0.25, h * 0.5,  w * 0.25, h * 0.35);
  ctx.fillRect(w * 0.5,  h * 0.5,  w * 0.25, h * 0.35);
  // Crop stalks
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 8);
    ctx.stroke();
  }
  // Barn
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(w * 0.35, h * 0.6, w * 0.3, h * 0.25);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(w * 0.38, h * 0.65, w * 0.24, h * 0.1);
  // Sign
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(w * 0.46, h * 0.63, w * 0.08, h * 0.04);
  // Leaves / decoration
  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

export function createRoadPieceSprite(w = 32, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(0, 0, w, h);
  // dashed line
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // edge lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 1, 0);
  ctx.lineTo(w - 1, h);
  ctx.stroke();
  return canvas;
}

// ===============================
// Building Sprite Factory
// ===============================
export function createBuildingSprite(buildingId, size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (buildingId === 'house') {
    // House
    ctx.fillStyle = '#6b4f9e';
    ctx.fillRect(6, 9, 20, 14);
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(16, 0);
    ctx.lineTo(32, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(13, 23, 6, 9);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 13, 4, 4);
    ctx.fillRect(18, 13, 4, 4);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 13, 4, 4);
    ctx.strokeRect(18, 13, 4, 4);
    return canvas;
  }

  if (buildingId === 'farm') {
    // Farm
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(8, 4, 8, 10);
    ctx.fillRect(16, 4, 8, 10);
    ctx.fillRect(8, 22, 8, 12);
    ctx.fillRect(16, 22, 8, 12);
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 1, y + 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(10, 25, 12, 7);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(12, 28, 8, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(17, 26, 3, 3);
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  }

  if (buildingId === 'road') {
    // Road
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size - 1, 0);
    ctx.lineTo(size - 1, size);
    ctx.stroke();
    return canvas;
  }

  // Fallback: generic building
  ctx.fillStyle = '#374151';
  ctx.fillRect(8, 6, 16, 20);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(8, 6, 16, 4);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(10, 10, 12, 4);
  ctx.fillStyle = '#374151';
  ctx.fillRect(10, 14, 6, 6);
  return canvas;
}
