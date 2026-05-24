/**
 * UI: экраны, HUD, сохранения, магазин
 */
const UI = {
  screens: {},
  hud: {},
  save: { money: 0, upgrades: {}, owned: [], bestKm: 0, totalMoney: 0 },

  init() {
    this.screens = {
      menu: document.getElementById('screen-menu'),
      settings: document.getElementById('screen-settings'),
      leaderboard: document.getElementById('screen-leaderboard'),
      shop: document.getElementById('screen-shop'),
      hud: document.getElementById('screen-hud'),
      pause: document.getElementById('screen-pause'),
      gameover: document.getElementById('screen-gameover'),
    };
    this.hud = {
      speed: document.getElementById('hud-speed'),
      km: document.getElementById('hud-km'),
      money: document.getElementById('hud-money'),
      fuel: document.getElementById('hud-fuel-fill'),
      rating: document.getElementById('hud-rating'),
      toast: document.getElementById('event-toast'),
    };
    this.loadSave();
    this.bindButtons();
    this.renderShop();
    drawMenuTruck(document.getElementById('menu-truck-canvas'));
  },

  show(name) {
    const mobile = document.getElementById('mobile-controls');

    Object.values(this.screens).forEach((s) => {
      if (!s) return;
      s.classList.remove('active');
    });

    if (name === 'playing') {
      Object.values(this.screens).forEach((s) => s?.classList.add('hidden'));
      this.screens.hud?.classList.remove('hidden');
      mobile?.classList.remove('hidden');
      return;
    }

    this.screens.hud?.classList.add('hidden');
    mobile?.classList.add('hidden');

    Object.values(this.screens).forEach((s) => {
      if (s && s !== this.screens.hud) s.classList.add('hidden');
    });

    const screen = this.screens[name];
    if (screen) {
      screen.classList.remove('hidden');
      screen.classList.add('active');
    }
  },

  bindButtons() {
    const map = [
      ['btn-play', () => Game.start()],
      ['btn-settings', () => this.show('settings')],
      ['btn-settings-back', () => this.show('menu')],
      ['btn-leaderboard', () => { this.renderLeaderboard(); this.show('leaderboard'); }],
      ['btn-leaderboard-back', () => this.show('menu')],
      ['btn-shop-menu', () => { this.renderShop(); this.show('shop'); }],
      ['btn-shop-back', () => this.show('menu')],
      ['btn-pause', () => Game.pause()],
      ['btn-resume', () => Game.resume()],
      ['btn-quit', () => Game.quit()],
      ['btn-restart', () => Game.start()],
      ['btn-gameover-menu', () => Game.quit()],
    ];
    map.forEach(([id, fn]) => document.getElementById(id)?.addEventListener('click', () => {
      AudioEngine.resume();
      fn();
    }));

    document.getElementById('vol-music')?.addEventListener('input', (e) => {
      AudioEngine.settings.music = e.target.value / 100;
      AudioEngine.updateVolumes();
    });
    document.getElementById('vol-sfx')?.addEventListener('input', (e) => {
      AudioEngine.settings.sfx = e.target.value / 100;
      AudioEngine.updateVolumes();
    });
  },

  updateHUD(state) {
    if (!this.hud.speed) return;
    this.hud.speed.textContent = Math.round(state.speed);
    this.hud.km.textContent = state.km.toFixed(1);
    this.hud.money.textContent = Math.floor(state.money);
    const maxFuel = CONFIG.PLAYER.fuelMax * (state.upgrades.tank ? 1.5 : 1);
    const pct = (state.fuel / maxFuel) * 100;
    this.hud.fuel.style.width = `${pct}%`;
    this.hud.fuel.classList.toggle('low', pct < 25);
    this.hud.rating.textContent = state.ratingName;
  },

  showToast(text, duration = 2500) {
    const el = this.hud.toast;
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  },

  showGameOver(reason, stats) {
    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('go-km').textContent = stats.km.toFixed(1);
    document.getElementById('go-money').textContent = Math.floor(stats.money);
    document.getElementById('go-rating').textContent = stats.rating;
    this.screens.gameover?.classList.remove('hidden');
    this.screens.gameover?.classList.add('active');
  },

  hideGameOver() {
    this.screens.gameover?.classList.add('hidden');
    this.screens.gameover?.classList.remove('active');
  },

  flashDamage() {
    if (!document.getElementById('opt-effects')?.checked) return;
    const app = document.getElementById('app');
    app.classList.add('damage-flash');
    setTimeout(() => app.classList.remove('damage-flash'), 300);
  },

  setSpeedBlur(on) {
    document.getElementById('app')?.classList.toggle('speed-blur', on);
  },

  loadSave() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (raw) this.save = { ...this.save, ...JSON.parse(raw) };
    } catch {}
    document.getElementById('shop-money').textContent = this.save.money;
  },

  persistSave() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.save));
    } catch {}
  },

  addToLeaderboard(km, money) {
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
    } catch {}
    board.push({ km, money, date: new Date().toLocaleDateString('ru') });
    board.sort((a, b) => b.km - a.km);
    board = board.slice(0, 10);
    localStorage.setItem(CONFIG.LEADERBOARD_KEY, JSON.stringify(board));
    if (km > this.save.bestKm) this.save.bestKm = km;
    this.persistSave();
  },

  renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
    } catch {}
    if (!board.length) {
      list.innerHTML = '<li style="justify-content:center;color:#94a3b8">Пока нет рекордов. Сыграй!</li>';
      return;
    }
    list.innerHTML = board.map((e, i) =>
      `<li><span>#${i + 1} ${e.date}</span><span>${e.km.toFixed(1)} км · ${e.money}₽</span></li>`
    ).join('');
  },

  renderShop() {
    const grid = document.getElementById('shop-items');
    document.getElementById('shop-money').textContent = this.save.money;
    if (!grid) return;
    grid.innerHTML = CONFIG.SHOP.map((item) => {
      const owned = this.save.owned.includes(item.id);
      return `<div class="shop-item ${owned ? 'owned' : ''}" data-id="${item.id}">
        <div class="shop-icon">${item.icon}</div>
        <div>${item.name}</div>
        <div class="shop-price">${owned ? '✓ Куплено' : item.price + '₽'}</div>
      </div>`;
    }).join('');
    grid.querySelectorAll('.shop-item').forEach((el) => {
      el.addEventListener('click', () => this.buyItem(el.dataset.id));
    });
  },

  buyItem(id) {
    const item = CONFIG.SHOP.find((i) => i.id === id);
    if (!item || this.save.owned.includes(id)) return;
    if (this.save.money < item.price) {
      alert('Не хватает денег! Покатайся ещё.');
      return;
    }
    this.save.money -= item.price;
    this.save.owned.push(id);
    if (id === 'tank' || id === 'engine' || id === 'armor') this.save.upgrades[id] = true;
    this.persistSave();
    this.renderShop();
    AudioEngine.money();
  },

  getRatingName(km) {
    let name = CONFIG.RATINGS[0].name;
    for (const r of CONFIG.RATINGS) {
      if (km >= r.km) name = r.name;
    }
    return name;
  },
};
