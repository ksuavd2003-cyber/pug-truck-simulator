/**
 * Сущности: игрок, препятствия, частицы, отрисовка спрайтов
 */

/** Игрок — мопс на красной фуре */
class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.lane = 1;
    this.targetX = 0;
    this.speed = 0;
    this.fuel = CONFIG.PLAYER.fuelMax;
    this.hp = 100;
    this.width = CONFIG.PLAYER.width;
    this.height = CONFIG.PLAYER.height;
    this.truckColor = '#e63946';
    this.skin = 'default';
    this.upgrades = { tank: false, engine: false, armor: false };
    this.sleeping = false;
    this.doshirak = false;
    this.honkTimer = 0;
    this.phraseTimer = 0;
    this.currentPhrase = '';
    this.smokePhase = 0;
  }

  reset(canvasW, canvasH, upgrades, skin) {
    this.lane = Math.floor(CONFIG.LANES / 2);
    this.x = 0;
    this.y = canvasH - this.height - 50;
    this.targetX = this.x;
    this.speed = 0;
    this.fuel = CONFIG.PLAYER.fuelMax * (upgrades.tank ? 1.5 : 1);
    this.hp = 100;
    this.sleeping = false;
    this.doshirak = false;
    this.upgrades = upgrades || {};
    this.skin = skin || 'default';
    this.updateLaneX(canvasW);
  }

  updateLaneX(canvasW) {
    const laneW = canvasW / CONFIG.LANES;
    this.targetX = laneW * this.lane + laneW / 2 - this.width / 2;
  }

  steer(dir, dt, canvasW) {
    if (dir !== 0) {
      this.lane = Math.max(0, Math.min(CONFIG.LANES - 1, this.lane + dir));
      this.updateLaneX(canvasW);
    }
    this.x += (this.targetX - this.x) * Math.min(1, dt * 8);
  }

  accelerate(dt, mult = 1) {
    if (this.sleeping) return;
    const max = CONFIG.PLAYER.maxSpeed * mult * (this.upgrades.engine ? 1.2 : 1);
    this.speed = Math.min(max, this.speed + CONFIG.PLAYER.accel * dt);
  }

  brake(dt) {
    this.speed = Math.max(0, this.speed - CONFIG.PLAYER.brake * dt);
  }

  coast(dt) {
    this.speed = Math.max(0, this.speed - CONFIG.PLAYER.friction * dt * 0.5);
  }

  burnFuel(dt, mult = 1) {
    const burn = CONFIG.PLAYER.fuelBurn * mult * (this.speed / CONFIG.PLAYER.maxSpeed + 0.3);
    this.fuel = Math.max(0, this.fuel - burn * dt);
    return this.fuel <= 0;
  }

  addFuel(amount) {
    const max = CONFIG.PLAYER.fuelMax * (this.upgrades.tank ? 1.5 : 1);
    this.fuel = Math.min(max, this.fuel + amount);
  }

  takeDamage(amount) {
    const reduced = this.upgrades.armor ? amount * 0.7 : amount;
    this.hp -= reduced;
    return this.hp <= 0;
  }

  honk() {
    this.honkTimer = 0.5;
    AudioEngine.honk();
  }

  randomPhrase() {
    this.currentPhrase = CONFIG.PUG_PHRASES[Math.floor(Math.random() * CONFIG.PUG_PHRASES.length)];
    this.phraseTimer = 2.5;
  }
}

class Obstacle {
  constructor(type, lane, y) {
    this.type = type;
    this.lane = lane;
    this.y = y;
    this.config = CONFIG.OBSTACLES[type];
    this.width = 72;
    this.height = 72;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
  }
}

/** Улучшенные частицы */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, opts = {}) {
    const count = opts.count || 8;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (opts.spread || 100),
        vy: (Math.random() - 0.5) * (opts.spread || 100) - (opts.up || 0),
        life: opts.life || 0.5 + Math.random() * 0.5,
        maxLife: opts.life || 1,
        size: opts.size || 4 + Math.random() * 6,
        color: opts.color || 'rgba(200,180,140,0.8)',
        type: opts.type || 'dust',
      });
    }
  }

  emitExhaust(x, y, speed) {
    if (speed < 20) return;
    this.particles.push({
      x: x - 5 + Math.random() * 10,
      y: y + 10,
      vx: -30 - Math.random() * 40,
      vy: -10 - Math.random() * 20,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      size: 6 + Math.random() * 10,
      color: `rgba(120,120,120,${0.2 + Math.random() * 0.2})`,
      type: 'smoke',
    });
  }

  update(dt) {
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.type === 'dust') p.vy += 20 * dt;
      if (p.type === 'smoke') {
        p.vy -= 25 * dt;
        p.size += 15 * dt;
      }
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      if (p.type === 'smoke') {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(100,100,100,0)');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = p.color;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}

/** Отрисовка фуры: кадры, колёса, моргание мопса */
function drawTruck(ctx, x, y, w, h, skin, opts = {}) {
  const { sleeping, doshirak, honk, damage, smoke, speed = 0 } = opts;
  const key = SpriteAtlas.getTruckKey(skin);
  const time = Animations.time;
  const motion = Animations.getTruckMotion(speed, sleeping);

  let drawX = x;
  let drawY = y + motion.bounceY;

  // Тень (реагирует на покачивание)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(drawX + w / 2, drawY + h + 4, w * 0.42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(drawX + w / 2, drawY + h / 2);
  ctx.rotate(motion.tilt);
  ctx.scale(1, motion.squash);
  ctx.translate(-w / 2, -h / 2);

  if (SpriteAtlas.ready && SpriteAtlas.draw(ctx, key, 0, 0, w, h)) {
    // Анимированное лицо мопса в окне
    const faceState = sleeping ? 'sleep' : doshirak ? 'eat' : 'normal';
    const faceCx = w * 0.77;
    const faceCy = h * 0.39;
    drawPugFaceAnimation(ctx, faceCx, faceCy, w / 140, faceState, time);

    if (sleeping) drawSleepZzz(ctx, faceCx, faceCy - h * 0.22, time);

    // Вращающиеся колёса
    const wheelAng = Animations.wheelAngle(speed);
    drawAnimatedWheels(ctx, 0, 0, w, h, speed, wheelAng);

    drawHonkPulse(ctx, 0, 0, w, h, honk, time);

    if (smoke || damage) {
      const t = time * 5;
      for (let i = 0; i < 3; i++) {
        const sx = 8 + Math.sin(t + i) * 5;
        const sy = 25 - i * 12 - Math.sin(t * 1.5 + i) * 4;
        const r = 8 + i * 4 + Math.sin(t) * 2;
        ctx.fillStyle = `rgba(90,90,90,${0.25 - i * 0.06})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (damage && opts.hp < 50) {
      ctx.strokeStyle = 'rgba(239,68,68,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(4, 20, w - 8, h - 35);
      ctx.setLineDash([]);
    }
  } else {
    _drawTruckFallback(ctx, 0, 0, w, h, '#e63946', opts);
  }

  ctx.restore();
}

function _drawTruckFallback(ctx, x, y, w, h, color, opts) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y + 25, w - 10, h - 45);
}

/** Препятствие — кадровая анимация */
function drawObstacle(ctx, obs, laneX, laneW, time) {
  let x = laneX + laneW / 2;
  let bob = Math.sin(time * 3 + obs.bobPhase) * 4;
  let y = obs.y + bob;

  if (obs.type === 'cow') {
    const co = getCowOffset(time, obs.bobPhase);
    x += co.x;
    y += co.y;
  }

  const scale = getPickupScale(obs.type, time);
  const baseSize = obs.type === 'fuel' || obs.type === 'money' ? 76 : 80;
  const size = baseSize * scale;
  const drawX = x - size / 2;
  const drawY = y - size / 2;

  if (obs.type === 'fuel' || obs.type === 'money') {
    const pulse = 0.25 + Math.sin(time * 6) * 0.15;
    const glow = ctx.createRadialGradient(x, y, 5, x, y, size);
    glow.addColorStop(0, obs.type === 'fuel' ? `rgba(34,197,94,${pulse + 0.2})` : `rgba(255,209,102,${pulse + 0.2})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  const key = getObstacleSpriteKey(obs.type, time);
  if (!SpriteAtlas.ready || !SpriteAtlas.draw(ctx, key, drawX, drawY, size, size)) {
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obs.config.emoji, x, y);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + size / 2 - 5, size * 0.35, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Речевой пузырь */
function drawSpeechBubble(ctx, x, y, text) {
  const padding = 10;
  ctx.font = 'bold 14px Nunito, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + padding * 2;
  const bh = 28;
  const bx = x - bw / 2;
  const by = y - bh - 8;

  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2.5;
  roundRect(ctx, bx, by, bw, bh, 10);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8, by + bh);
  ctx.lineTo(x, by + bh + 10);
  ctx.lineTo(x + 8, by + bh);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + bh / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Меню — анимация со спрайтами */
function drawMenuTruck(canvas) {
  const ctx = canvas.getContext('2d');
  Animations.tick(0.016);
  const t = Animations.time;
  const w = canvas.width;
  const h = canvas.height;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#4facfe');
  sky.addColorStop(1, '#00f2fe');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#2d5016';
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.strokeStyle = '#ffd166';
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.lineTo(w, h * 0.75);
  ctx.stroke();
  ctx.setLineDash([]);

  const bounce = Math.sin(t * 3) * 5;
  const menuSpeed = 80 + Math.sin(t) * 20;
  drawTruck(ctx, 90, 35 + bounce, 130, 110, 'default', {
    honk: Math.sin(t * 2) > 0.85,
    speed: menuSpeed,
  });

  requestAnimationFrame(() => drawMenuTruck(canvas));
}
