/**
 * Параллакс-фон и улучшенная дорога
 */
const BackgroundRenderer = {
  trees: [],
  clouds: [],
  roadMarkOffset: 0,

  reset(w) {
    this.trees = [];
    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      this.trees.push({
        side: Math.random() > 0.5 ? 'left' : 'right',
        x: Math.random() * w,
        y: Math.random() * 800,
        scale: 0.5 + Math.random() * 0.8,
      });
    }
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * w,
        y: 30 + Math.random() * 120,
        w: 60 + Math.random() * 80,
        speed: 0.2 + Math.random() * 0.3,
      });
    }
  },

  update(scroll, w, h) {
    this.roadMarkOffset += scroll;
    this.trees.forEach((t) => {
      t.y += scroll * 0.85;
      if (t.y > h + 100) {
        t.y = -100;
        t.x = Math.random() * w;
        t.scale = 0.5 + Math.random() * 0.8;
      }
    });
    this.clouds.forEach((c) => {
      c.x += c.speed;
      if (c.x > w + 100) c.x = -100;
    });
  },

  drawSky(ctx, w, h, weather) {
    const palettes = {
      clear: ['#4facfe', '#00f2fe', '#87CEEB'],
      rain: ['#4b5563', '#6b7280', '#9ca3af'],
      fog: ['#9ca3af', '#d1d5db', '#e5e7eb'],
      night: ['#0f0c29', '#302b63', '#24243e'],
      desert: ['#f4a261', '#e9c46a', '#f9dcc4'],
    };
    const p = palettes[weather] || palettes.clear;
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    g.addColorStop(0, p[0]);
    g.addColorStop(0.5, p[1]);
    g.addColorStop(1, p[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Солнце / луна
    if (weather === 'night') {
      ctx.fillStyle = 'rgba(255,255,220,0.9)';
      ctx.beginPath();
      ctx.arc(w * 0.75, 80, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53) % (h * 0.4);
        ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;
    } else if (weather !== 'rain' && weather !== 'fog') {
      const sunG = ctx.createRadialGradient(w * 0.8, 70, 10, w * 0.8, 70, 60);
      sunG.addColorStop(0, 'rgba(255,255,200,0.9)');
      sunG.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = sunG;
      ctx.fillRect(0, 0, w, h * 0.4);
    }

    // Облака
    if (weather !== 'night') {
      this.clouds.forEach((c) => {
        ctx.fillStyle = weather === 'rain' ? 'rgba(150,160,170,0.7)' : 'rgba(255,255,255,0.85)';
        this._drawCloud(ctx, c.x, c.y, c.w);
      });
    }
  },

  _drawCloud(ctx, x, y, w) {
    const h = w * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, h * 0.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.25, y - h * 0.2, h * 0.55, 0, Math.PI * 2);
    ctx.arc(x + w * 0.55, y, h * 0.45, 0, Math.PI * 2);
    ctx.arc(x + w * 0.35, y + h * 0.15, h * 0.4, 0, Math.PI * 2);
    ctx.fill();
  },

  drawHills(ctx, w, h, roadY, weather) {
    const hillColor = weather === 'desert' ? '#c2a366' : weather === 'night' ? '#1a2e1a' : '#2d5016';
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    for (let x = 0; x <= w; x += 40) {
      const y = roadY - 30 - Math.sin(x * 0.008 + 1) * 25 - Math.sin(x * 0.02) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, roadY);
    ctx.closePath();
    ctx.fill();

    if (SpriteAtlas.ready && SpriteAtlas.images.hill) {
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        SpriteAtlas.draw(ctx, 'hill', i * (w / 2) - 50, roadY - 55, w / 2 + 100, 50);
      }
      ctx.globalAlpha = 1;
    }
  },

  drawRoadside(ctx, w, h, roadY, scroll, weather) {
    const grass = weather === 'desert' ? '#d4a574' : '#3d6b2a';
    ctx.fillStyle = grass;
    ctx.fillRect(0, roadY, w, h - roadY);

    // Деревья / кактусы
    this.trees.forEach((t) => {
      const laneW = w / CONFIG.LANES;
      const roadLeft = 0;
      const roadRight = w;
      let tx, tw, th;
      if (t.side === 'left') {
        tx = roadLeft + laneW * 0.15;
      } else {
        tx = roadRight - laneW * 0.15 - 50 * t.scale;
      }
      const ty = t.y;
      tw = 50 * t.scale;
      th = 85 * t.scale;

      if (weather === 'desert') {
        ctx.font = `${40 * t.scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🌵', tx + tw / 2, ty);
      } else if (SpriteAtlas.ready) {
        SpriteAtlas.draw(ctx, 'tree', tx, ty - th, tw, th, { alpha: 0.85 + t.scale * 0.1 });
      }
    });
  },

  drawRoad(ctx, w, h, roadY, roadOffset, weather) {
    const roadW = w;
    const asphalt1 = weather === 'desert' ? '#5c5c5c' : '#3a3a48';
    const asphalt2 = weather === 'desert' ? '#4a4a4a' : '#2f2f3a';

    const rg = ctx.createLinearGradient(0, roadY, 0, h);
    rg.addColorStop(0, asphalt1);
    rg.addColorStop(1, asphalt2);
    ctx.fillStyle = rg;
    ctx.fillRect(0, roadY, roadW, h - roadY);

    // Текстура асфальта
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 80; i++) {
      const px = (i * 73 + roadOffset * 0.3) % w;
      const py = roadY + ((i * 47) % (h - roadY));
      ctx.fillRect(px, py, 2, 1);
    }

    // Бордюр
    const curbG = ctx.createLinearGradient(0, roadY - 6, 0, roadY + 4);
    curbG.addColorStop(0, '#ffd166');
    curbG.addColorStop(1, '#f59e0b');
    ctx.fillStyle = curbG;
    ctx.fillRect(0, roadY - 5, w, 6);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, roadY + 1, w, 2);

    // Разметка
    const laneW = w / CONFIG.LANES;
    ctx.strokeStyle = 'rgba(255,255,220,0.9)';
    ctx.lineWidth = 4;
    ctx.setLineDash([35, 28]);
    ctx.lineDashOffset = -roadOffset % 63;
    ctx.shadowColor = 'rgba(255,255,150,0.5)';
    ctx.shadowBlur = 6;
    for (let i = 1; i < CONFIG.LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW, roadY + 10);
      ctx.lineTo(i * laneW, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Блики на мокрой дороге
    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 20; i++) {
        const rx = (i * 131 + roadOffset) % w;
        const ry = roadY + 20 + (i * 67) % (h - roadY - 40);
        ctx.fillRect(rx, ry, 30, 2);
      }
    }
  },

  drawRain(ctx, w, h, offset) {
    ctx.strokeStyle = 'rgba(174,200,255,0.45)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 100; i++) {
      const rx = (i * 137 + offset * 3) % w;
      const ry = (i * 89 + offset * 8) % h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 18);
      ctx.stroke();
    }
  },

  drawFog(ctx, w, h, roadY) {
    const fg = ctx.createLinearGradient(0, roadY, 0, h);
    fg.addColorStop(0, 'rgba(255,255,255,0)');
    fg.addColorStop(0.4, 'rgba(220,220,230,0.55)');
    fg.addColorStop(1, 'rgba(255,255,255,0.75)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, roadY, w, h - roadY);
  },

  drawHeadlights(ctx, px, py, pw, ph) {
    const lg = ctx.createRadialGradient(px + pw / 2, py, 10, px + pw / 2, py - 100, 140);
    lg.addColorStop(0, 'rgba(255,255,180,0.35)');
    lg.addColorStop(0.5, 'rgba(255,255,150,0.12)');
    lg.addColorStop(1, 'rgba(255,255,150,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(px - 50, 0, pw + 100, py + ph);
  },
};
