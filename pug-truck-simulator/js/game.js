/**
 * Pug Truck Simulator — главный игровой цикл
 */
const Game = {
  state: 'menu', // menu | playing | paused
  canvas: null,
  ctx: null,
  minimapCtx: null,
  player: null,
  obstacles: [],
  particles: null,
  keys: {},
  touch: { left: false, right: false, up: false, down: false },

  // Сессия
  km: 0,
  money: 0,
  scrollSpeed: 0,
  spawnTimer: 0,
  eventTimer: 0,
  activeEvent: null,
  weather: 'clear', // clear | rain | fog | night | desert
  roadOffset: 0,
  shake: 0,
  difficulty: 1,
  lastTime: 0,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    const mm = document.getElementById('minimap');
    this.minimapCtx = mm?.getContext('2d');
    this.player = new Player();
    this.particles = new ParticleSystem();

    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      if (this.state === 'menu') BackgroundRenderer.reset(window.innerWidth);
    });
    this.bindInput();

    SpriteAtlas.init().then(() => {
      BackgroundRenderer.reset(window.innerWidth);
    });

    UI.init();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CONFIG.LANE_WIDTH = window.innerWidth / CONFIG.LANES;
  },

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'playing') this.player.honk();
      }
      if (e.code === 'Escape' && this.state === 'playing') this.pause();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    document.querySelectorAll('.touch-btn').forEach((btn) => {
      const dir = btn.dataset.dir;
      const action = btn.dataset.action;
      const start = (e) => {
        e.preventDefault();
        AudioEngine.resume();
        if (action === 'honk') this.player?.honk();
        else if (dir) this.touch[dir] = true;
      };
      const end = (e) => {
        e.preventDefault();
        if (dir) this.touch[dir] = false;
      };
      btn.addEventListener('touchstart', start);
      btn.addEventListener('touchend', end);
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });
  },

  start() {
    AudioEngine.resume();
    AudioEngine.startMusic();

    this.state = 'playing';
    this.km = 0;
    this.money = UI.save.money;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.eventTimer = 5;
    this.activeEvent = null;
    this.difficulty = 1;
    this.shake = 0;

    const upgrades = {
      tank: UI.save.upgrades.tank,
      engine: UI.save.upgrades.engine,
      armor: UI.save.upgrades.armor,
    };
    let skin = 'default';
    if (UI.save.owned.includes('truck_gold')) skin = 'truck_gold';
    else if (UI.save.owned.includes('truck_blue')) skin = 'truck_blue';

    if (UI.save.owned.includes('road_night')) this.weather = 'night';
    else if (UI.save.owned.includes('road_desert')) this.weather = 'desert';
    else this.weather = 'clear';

    this.player.reset(window.innerWidth, window.innerHeight, upgrades, skin);
    this.player.randomPhrase();
    BackgroundRenderer.reset(window.innerWidth);

    UI.hideGameOver();
    UI.show('playing');
    document.getElementById('screen-pause')?.classList.add('hidden');
  },

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.getElementById('screen-pause')?.classList.remove('hidden');
    AudioEngine.stopEngine();
  },

  resume() {
    this.state = 'playing';
    document.getElementById('screen-pause')?.classList.add('hidden');
  },

  quit() {
    this.state = 'menu';
    AudioEngine.stopMusic();
    AudioEngine.stopEngine();
    UI.show('menu');
    UI.hideGameOver();
    document.getElementById('screen-pause')?.classList.add('hidden');
    UI.save.money = this.money;
    UI.persistSave();
  },

  gameOver(reason) {
    this.state = 'gameover';
    AudioEngine.stopEngine();
    AudioEngine.hit();
    UI.addToLeaderboard(this.km, this.money);
    UI.save.money = this.money;
    UI.save.totalMoney += Math.floor(this.money);
    UI.persistSave();
    UI.showGameOver(reason, {
      km: this.km,
      money: this.money,
      rating: UI.getRatingName(this.km),
    });
  },

  spawnObstacle() {
    const lane = Math.floor(Math.random() * CONFIG.LANES);
    const roll = Math.random();
    let type;
    if (roll < 0.12) type = 'fuel';
    else if (roll < 0.18) type = 'money';
    else {
      const bad = ['pothole', 'police', 'traffic', 'cow', 'accident', 'roadwork'];
      type = bad[Math.floor(Math.random() * bad.length)];
    }
    this.obstacles.push(new Obstacle(type, lane, -60));
  },

  triggerRandomEvent() {
    const ev = CONFIG.EVENTS[Math.floor(Math.random() * CONFIG.EVENTS.length)];
    this.activeEvent = { ...ev, timer: ev.duration };
    UI.showToast(ev.text, ev.duration * 1000);

    switch (ev.effect) {
      case 'sleep':
        this.player.sleeping = true;
        setTimeout(() => { this.player.sleeping = false; }, ev.duration * 1000);
        break;
      case 'chanson':
        AudioEngine.startChanson();
        setTimeout(() => AudioEngine.stopChanson(), ev.duration * 1000);
        break;
      case 'breakdown':
        this.player._breakdown = true;
        setTimeout(() => { this.player._breakdown = false; }, ev.duration * 1000);
        break;
      case 'rain':
        this.weather = 'rain';
        setTimeout(() => { if (this.weather === 'rain') this.weather = UI.save.owned.includes('road_night') ? 'night' : 'clear'; }, ev.duration * 1000);
        break;
      case 'fog':
        this.weather = 'fog';
        setTimeout(() => { if (this.weather === 'fog') this.weather = 'clear'; }, ev.duration * 1000);
        break;
      case 'doshirak':
        this.player.doshirak = true;
        setTimeout(() => { this.player.doshirak = false; }, ev.duration * 1000);
        break;
    }
    this.player.randomPhrase();
    if (document.getElementById('opt-vibrate')?.checked && navigator.vibrate) {
      navigator.vibrate(100);
    }
  },

  update(dt) {
    Animations.tick(dt);
    if (this.state !== 'playing') return;

    const p = this.player;
    const speedMult = (1 + this.km * CONFIG.DIFFICULTY.speedMultPerKm) *
      (p._breakdown ? 0.7 : 1) *
      (p.doshirak ? 0.85 : 1) *
      (this.weather === 'rain' ? 0.9 : 1);

    // Управление WASD / стрелки / touch
    let steer = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touch.left) steer = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.touch.right) steer = 1;
    p.steer(steer, dt, window.innerWidth);

    if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.touch.up) p.accelerate(dt, speedMult);
    else if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.touch.down) p.brake(dt);
    else p.coast(dt);

    if (p.honkTimer > 0) p.honkTimer -= dt;
    if (p.phraseTimer > 0) p.phraseTimer -= dt;
    else if (Math.random() < 0.002) p.randomPhrase();

    const scroll = (p.speed / 60) * CONFIG.ROAD_SCROLL_BASE * 60 * dt * speedMult;
    this.roadOffset += scroll;
    BackgroundRenderer.update(scroll, window.innerWidth, window.innerHeight);
    this.km += (p.speed / 3600) * dt * 20;
    this.difficulty = 1 + Math.floor(this.km / CONFIG.DIFFICULTY.kmPerLevel) * 0.15;

    if (p.burnFuel(dt)) {
      this.gameOver('⛽ Бензин кончился! Борис стоит посреди трассы…');
      return;
    }

    // Спавн
    this.spawnTimer -= dt;
    const rate = Math.max(
      CONFIG.DIFFICULTY.spawnRateMin,
      CONFIG.DIFFICULTY.spawnRateBase - this.km * 0.05
    );
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = rate / this.difficulty;
    }

    // События
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.triggerRandomEvent();
      this.eventTimer = 8 + Math.random() * 12;
    }

    // Препятствия
    const laneW = window.innerWidth / CONFIG.LANES;
    this.obstacles.forEach((obs) => {
      obs.y += scroll;
    });
    this.obstacles = this.obstacles.filter((obs) => obs.y < window.innerHeight + 80);

    // Коллизии
    this.obstacles.forEach((obs) => {
      if (obs.collected) return;
      if (obs.lane !== p.lane) return;
      const dist = Math.abs(obs.y - (p.y + p.height / 2));
      if (dist > 50) return;

      obs.collected = true;
      const cfg = obs.config;

      if (obs.type === 'fuel') {
        p.addFuel(cfg.fuel);
        this.particles.emit(p.x + p.width / 2, p.y, { color: '#22c55e', count: 12 });
        AudioEngine.collect();
        UI.showToast('⛽ Заправился!');
      } else if (obs.type === 'money') {
        this.money += cfg.money;
        AudioEngine.money();
        UI.showToast(`💰 +${cfg.money}₽`);
      } else {
        p.speed = Math.max(0, p.speed - cfg.speedLoss);
        this.money = Math.max(0, this.money + cfg.money);
        this.shake = 0.4;
        UI.flashDamage();
        AudioEngine.hit();
        if (p.takeDamage(cfg.damage)) {
          this.gameOver(`💥 ${cfg.label} Борис выбыл!`);
        } else {
          UI.showToast(cfg.label);
        }
        this.particles.emit(p.x + p.width / 2, p.y + p.height, { color: '#ef4444', count: 15, spread: 150 });
      }
    });

    // Пассивный доход за км
    this.money += scroll * 0.02 * this.difficulty;

    if (p.speed > 25) {
      this.particles.emitExhaust(p.x + 12, p.y + p.height * 0.5, p.speed);
    }
    if (p.speed > 50 && Math.random() < 0.3) {
      this.particles.emit(p.x + p.width / 2, p.y + p.height, {
        count: 1,
        color: 'rgba(180,160,120,0.4)',
        spread: 20,
        up: 15,
        size: 2,
      });
    }
    this.particles.update(dt);

    if (this.shake > 0) this.shake -= dt;

    AudioEngine.setEngine(p.speed / CONFIG.PLAYER.maxSpeed);
    UI.setSpeedBlur(p.speed > 150);
    UI.updateHUD({
      speed: p.speed,
      km: this.km,
      money: this.money,
      fuel: p.fuel,
      upgrades: p.upgrades,
      ratingName: UI.getRatingName(this.km),
    });
  },

  draw() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const roadY = h * 0.18;
    const laneW = w / CONFIG.LANES;
    const time = Animations.time;

    BackgroundRenderer.drawSky(ctx, w, h, this.weather);
    BackgroundRenderer.drawHills(ctx, w, h, roadY, this.weather);

    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 20, (Math.random() - 0.5) * this.shake * 20);
    }

    BackgroundRenderer.drawRoadside(ctx, w, h, roadY, this.roadOffset, this.weather);
    BackgroundRenderer.drawRoad(ctx, w, h, roadY, this.roadOffset, this.weather);

    if (this.weather === 'rain') BackgroundRenderer.drawRain(ctx, w, h, this.roadOffset);
    if (this.weather === 'fog') BackgroundRenderer.drawFog(ctx, w, h, roadY);

    // Препятствия (под фурой по глубине — рисуем до игрока для «дальних»)
    const sorted = [...this.obstacles].sort((a, b) => a.y - b.y);
    sorted.forEach((obs) => drawObstacle(ctx, obs, obs.lane * laneW, laneW, time));

    if (this.state === 'playing' || this.state === 'paused') {
      const p = this.player;

      if (this.weather === 'night') {
        BackgroundRenderer.drawHeadlights(ctx, p.x, p.y, p.width, p.height);
      }

      drawTruck(ctx, p.x, p.y, p.width, p.height, p.skin, {
        sleeping: p.sleeping,
        doshirak: p.doshirak,
        honk: p.honkTimer > 0,
        damage: p.hp < 50,
        smoke: p._breakdown,
        hp: p.hp,
        speed: p.speed,
      });

      if (p.phraseTimer > 0 && p.currentPhrase) {
        drawSpeechBubble(ctx, p.x + p.width / 2, p.y - 5, p.currentPhrase);
      }
    }

    this.particles.draw(ctx);
    ctx.restore();

    // Виньетка на скорости
    if (this.state === 'playing' && this.player.speed > 120) {
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, `rgba(0,0,0,${0.15 + this.player.speed / 2000})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    }

    this.drawMinimap();
  },

  drawMinimap() {
    const ctx = this.minimapCtx;
    if (!ctx) return;
    const w = 100;
    const h = 70;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#444';
    ctx.fillRect(10, 10, w - 20, h - 20);
    // Игрок
    ctx.fillStyle = '#e63946';
    ctx.fillRect(w / 2 - 4, h - 18, 8, 10);
    // Препятствия
    this.obstacles.forEach((obs) => {
      const mx = 10 + (obs.lane + 0.5) * ((w - 20) / CONFIG.LANES);
      const my = 10 + (obs.y / window.innerHeight) * (h - 20);
      if (my > 10 && my < h - 10) {
        ctx.fillStyle = obs.type === 'fuel' ? '#22c55e' : obs.type === 'money' ? '#ffd166' : '#ef4444';
        ctx.fillRect(mx - 2, my, 4, 4);
      }
    });
    ctx.strokeStyle = '#ffd166';
    ctx.strokeRect(0, 0, w, h);
  },

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0.016);
    this.lastTime = timestamp;

    if (this.state === 'playing') this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  },
};

// Старт
window.addEventListener('DOMContentLoaded', () => Game.init());
