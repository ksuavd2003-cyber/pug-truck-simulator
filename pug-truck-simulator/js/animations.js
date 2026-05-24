/**
 * Анимации: кадры, колёса, моргание, препятствия
 */
const Animations = {
  time: 0,

  tick(dt) {
    this.time += dt;
  },

  /** Покачивание кузова от скорости */
  getTruckMotion(speed, sleeping) {
    const t = this.time;
    const active = speed > 5 && !sleeping;
    const bounceY = active ? Math.sin(t * 12) * (2 + speed / 80) : Math.sin(t * 2) * 1;
    const squash = active ? 1 + Math.sin(t * 24) * 0.015 : 1;
    const tilt = active ? Math.sin(t * 8) * 0.012 * (speed / 100) : 0;
    return { bounceY, squash, tilt };
  },

  /** Индекс кадра для циклической анимации */
  frame(fps, count) {
    return Math.floor(this.time * fps) % count;
  },

  /** Вращение колёс (рад) */
  wheelAngle(speed) {
    return this.time * (speed * 0.15 + 2);
  },
};

/** Кадры спрайтов (ключ → массив ключей в атласе) */
const SPRITE_SEQUENCES = {
  police: ['police_0', 'police_1'],
  fuel: ['fuel_0', 'fuel_1', 'fuel_2'],
  money: ['money_0', 'money_1'],
  accident: ['accident_0', 'accident_1'],
  cow: ['cow_0', 'cow_1'],
};

/** Отрисовка вращающихся колёс поверх спрайта */
function drawAnimatedWheels(ctx, x, y, w, h, speed, angle) {
  const wheels = [
    { rx: 0.2, ry: 0.8, r: 0.105 },
    { rx: 0.82, ry: 0.8, r: 0.105 },
  ];

  wheels.forEach((wp) => {
    const cx = x + w * wp.rx;
    const cy = y + h * wp.ry;
    const r = w * wp.r;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Шина
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Диск
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Спицы
    ctx.strokeStyle = '#888';
    ctx.lineWidth = Math.max(2, r * 0.12);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.55, 0);
      ctx.stroke();
      ctx.rotate((Math.PI * 2) / 5);
    }

    // Блик
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

/** Лицо мопса — кадры: открыт / моргание / сон / еда */
function drawPugFaceAnimation(ctx, cx, cy, scale, state, time) {
  const s = scale;
  // Моргание каждые ~3.5 сек на 0.12 сек
  const bt = time % 3.5;
  const blinkCycle = bt > 3.35 && state !== 'sleep' && state !== 'eat';
  const isSleep = state === 'sleep';
  const isEat = state === 'eat';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  // Уши
  ctx.fillStyle = '#b8956c';
  ctx.beginPath();
  ctx.ellipse(-14, -2, 6, 10, -0.4, 0, Math.PI * 2);
  ctx.ellipse(14, -2, 6, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Голова
  const headGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 22);
  headGrad.addColorStop(0, '#e8c9a0');
  headGrad.addColorStop(1, '#c4a574');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a08050';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Морда
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Нос
  ctx.fillStyle = '#2d1f0f';
  ctx.beginPath();
  ctx.ellipse(0, 4, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-1, 2, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Глаза
  ctx.fillStyle = '#1a1a1a';
  if (isSleep || blinkCycle) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    [-8, 8].forEach((ox) => {
      ctx.beginPath();
      ctx.moveTo(ox - 4, -4);
      ctx.lineTo(ox + 4, -4);
      ctx.stroke();
    });
  } else {
    [-8, 8].forEach((ox) => {
      ctx.beginPath();
      ctx.ellipse(ox, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ox - 1, -5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
    });
  }

  // Рот
  if (isEat) {
    const chew = Math.sin(time * 15) * 2;
    ctx.fillStyle = '#5c3d2e';
    ctx.beginPath();
    ctx.ellipse(0, 12 + chew, 8, 6 + Math.abs(chew) * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '14px sans-serif';
    ctx.fillText('🍜', -18, 8);
  } else if (!isSleep) {
    ctx.strokeStyle = '#5c3d2e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 10, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // Кепка
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(-18, -20, 36, 8);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(-12, -24, 24, 6);
  const antWobble = Math.sin(time * 6) * 3;
  ctx.fillRect(-2 + antWobble, -28, 4, 5);

  ctx.restore();
}

/** Мигающие фары при сигнале */
function drawHonkPulse(ctx, x, y, w, h, honk, time) {
  if (!honk) return;
  const pulse = 0.5 + Math.sin(time * 25) * 0.5;
  const fx = x + w * 0.94;
  const fy = y + h * 0.55;
  const g = ctx.createRadialGradient(fx, fy, 2, fx + 40, fy, 50 + pulse * 20);
  g.addColorStop(0, `rgba(255,255,200,${0.6 * pulse})`);
  g.addColorStop(1, 'rgba(255,255,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(fx, fy - 15);
  ctx.lineTo(fx + 70 + pulse * 15, fy - 25);
  ctx.lineTo(fx + 70 + pulse * 15, fy + 25);
  ctx.closePath();
  ctx.fill();
}

/** Zzz при сне */
function drawSleepZzz(ctx, cx, cy, time) {
  const frame = Animations.frame(2, 3);
  const offsets = [
    { x: 0, y: 0, s: 12 },
    { x: 12, y: -14, s: 10 },
    { x: 22, y: -26, s: 8 },
  ];
  ctx.font = 'bold sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  for (let i = 0; i <= frame; i++) {
    const o = offsets[i];
    const bob = Math.sin(time * 4 + i) * 3;
    ctx.font = `bold ${o.s}px Nunito,sans-serif`;
    ctx.fillText('Z', cx + o.x, cy + o.y + bob);
  }
}

/** Анимация препятствия по кадрам */
function getObstacleSpriteKey(type, time) {
  const seq = SPRITE_SEQUENCES[type];
  if (!seq || !SpriteAtlas.ready) return SpriteAtlas.getObstacleKey(type);
  const fps = type === 'police' ? 4 : type === 'fuel' ? 3 : 2;
  const idx = Animations.frame(fps, seq.length);
  const key = seq[idx];
  return SpriteAtlas.images[key] ? key : SpriteAtlas.getObstacleKey(type);
}

/** Пульсация пикапов */
function getPickupScale(type, time) {
  if (type === 'fuel') return 1 + Math.sin(time * 5) * 0.06;
  if (type === 'money') return 1 + Math.sin(time * 4) * 0.05;
  return 1;
}

/** Покачивание коровы */
function getCowOffset(time, bobPhase) {
  return {
    x: Math.sin(time * 4 + bobPhase) * 3,
    y: Math.sin(time * 6 + bobPhase) * 2,
  };
}
