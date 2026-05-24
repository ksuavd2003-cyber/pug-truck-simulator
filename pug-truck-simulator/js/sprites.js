/**
 * Спрайт-атлас: SVG → Canvas (Pixar / cartoon style)
 */
const SpriteAtlas = {
  images: {},
  ready: false,
  loadPromise: null,

  /** SVG-исходники (векторная графика, чёткая на любом масштабе) */
  svg: {
    truck_red: null,
    truck_blue: null,
    truck_gold: null,
    pothole: null,
    police: null,
    traffic: null,
    cow: null,
    accident: null,
    roadwork: null,
    fuel: null,
    money: null,
    tree: null,
    hill: null,
  },

  init() {
    if (this.loadPromise) return this.loadPromise;
    this._buildSvgData();
    this.loadPromise = this._loadAll();
    return this.loadPromise;
  },

  _buildSvgData() {
    this.svg.truck_red = TRUCK_SVG('#e63946', '#b91c1c', '#ffd166');
    this.svg.truck_blue = TRUCK_SVG('#3b82f6', '#1d4ed8', '#93c5fd');
    this.svg.truck_gold = TRUCK_SVG('#fbbf24', '#d97706', '#fef3c7');
    this.svg.pothole = POTHOLE_SVG;
    this.svg.police = POLICE_SVG;
    this.svg.police_0 = POLICE_FRAME(0);
    this.svg.police_1 = POLICE_FRAME(1);
    this.svg.traffic = TRAFFIC_SVG;
    this.svg.cow = COW_SVG;
    this.svg.cow_0 = COW_FRAME(0);
    this.svg.cow_1 = COW_FRAME(1);
    this.svg.accident = ACCIDENT_SVG;
    this.svg.accident_0 = ACCIDENT_FRAME(0);
    this.svg.accident_1 = ACCIDENT_FRAME(1);
    this.svg.roadwork = ROADWORK_SVG;
    this.svg.fuel = FUEL_SVG;
    this.svg.fuel_0 = FUEL_FRAME(0);
    this.svg.fuel_1 = FUEL_FRAME(1);
    this.svg.fuel_2 = FUEL_FRAME(2);
    this.svg.money = MONEY_SVG;
    this.svg.money_0 = MONEY_FRAME(0);
    this.svg.money_1 = MONEY_FRAME(1);
    this.svg.tree = TREE_SVG;
    this.svg.hill = HILL_SVG;
  },

  async _loadAll() {
    const entries = Object.entries(this.svg);
    await Promise.all(
      entries.map(async ([key, svg]) => {
        this.images[key] = await this._svgToImage(svg);
      })
    );
    this.ready = true;
  },

  _svgToImage(svgString) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  },

  draw(ctx, key, x, y, w, h, opts = {}) {
    const img = this.images[key];
    if (!img) return false;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
    return true;
  },

  getTruckKey(skin) {
    if (skin === 'truck_blue') return 'truck_blue';
    if (skin === 'truck_gold') return 'truck_gold';
    return 'truck_red';
  },

  getObstacleKey(type) {
    const map = {
      pothole: 'pothole',
      police: 'police',
      traffic: 'traffic',
      cow: 'cow',
      accident: 'accident',
      roadwork: 'roadwork',
      fuel: 'fuel',
      money: 'money',
    };
    return map[type] || 'traffic';
  },
};

/** Фура + мопс-дальнобойщик */
function TRUCK_SVG(body, bodyDark, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160" width="140" height="160">
  <defs>
    <linearGradient id="bodyG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${body};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${bodyDark};stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="cabG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${body};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${bodyDark};stop-opacity:1"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- Тень -->
  <ellipse cx="70" cy="152" rx="55" ry="8" fill="rgba(0,0,0,0.25)"/>
  <g filter="url(#sh)">
    <!-- Прицеп -->
    <rect x="8" y="55" width="75" height="70" rx="8" fill="url(#bodyG)" stroke="${bodyDark}" stroke-width="2"/>
    <rect x="12" y="60" width="67" height="8" rx="2" fill="${accent}" opacity="0.9"/>
    <line x1="45" y1="68" x2="45" y2="118" stroke="${bodyDark}" stroke-width="1" opacity="0.4"/>
    <!-- Кабина -->
    <path d="M83 35 L130 35 L135 55 L135 95 L83 95 Z" fill="url(#cabG)" stroke="${bodyDark}" stroke-width="2"/>
    <!-- Окно (мопс рисуется анимацией поверх) -->
    <path d="M88 42 L128 42 L132 58 L132 78 L88 78 Z" fill="#5ba3c9" stroke="#0ea5e9" stroke-width="1.5"/>
    <path d="M88 42 L128 42 L132 58 L132 65 L88 65 Z" fill="rgba(255,255,255,0.25)"/>
    <!-- Выхлоп -->
    <rect x="5" y="70" width="8" height="25" rx="2" fill="#444"/>
    <!-- Арки колёс (статич.) -->
    <path d="M14 118 Q14 128 28 128 Q42 128 42 118" fill="none" stroke="${bodyDark}" stroke-width="2"/>
    <path d="M98 118 Q98 128 115 128 Q132 128 132 118" fill="none" stroke="${bodyDark}" stroke-width="2"/>
  </g>
  <!-- Фары -->
  <circle cx="132" cy="88" r="5" fill="#fef9c3"/>
  <circle cx="132" cy="88" r="3" fill="#fff"/>
  <!-- Бампер -->
  <rect x="128" y="95" width="10" height="8" rx="2" fill="#888"/>
</svg>`;
}

const POTHOLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">
  <ellipse cx="40" cy="35" rx="36" ry="18" fill="#2a2a2a" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="40" cy="32" rx="28" ry="12" fill="#0a0a0a"/>
  <ellipse cx="35" cy="30" rx="8" ry="4" fill="#1a1a1a" opacity="0.6"/>
  <text x="40" y="52" text-anchor="middle" font-size="14" font-weight="bold" fill="#666">ЯМА</text>
</svg>`;

const POLICE_SVG = POLICE_FRAME(0);

function POLICE_FRAME(f) {
  const blueOn = f === 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90">
  <rect x="15" y="35" width="50" height="35" rx="6" fill="#1e40af" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="20" y="25" width="40" height="18" rx="4" fill="#1e40af"/>
  <rect x="22" y="28" width="36" height="12" rx="2" fill="#7dd3fc"/>
  <circle cx="25" cy="72" r="8" fill="#222"/><circle cx="55" cy="72" r="8" fill="#222"/>
  <rect x="30" y="15" width="20" height="8" rx="2" fill="#dc2626"/>
  <circle cx="35" cy="19" r="4" fill="${blueOn ? '#60a5fa' : '#1e3a8a'}"/>
  <circle cx="45" cy="19" r="4" fill="${blueOn ? '#1e3a8a' : '#f87171'}"/>
</svg>`;
}

const TRAFFIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 70">
  <rect x="10" y="25" width="60" height="30" rx="8" fill="#64748b" stroke="#475569" stroke-width="2"/>
  <rect x="14" y="28" width="52" height="14" rx="3" fill="#94a3b8"/>
  <circle cx="22" cy="58" r="7" fill="#222"/><circle cx="58" cy="58" r="7" fill="#222"/>
  <rect x="5" y="32" width="8" height="16" rx="2" fill="#ef4444" opacity="0.8"/>
</svg>`;

const COW_SVG = COW_FRAME(0);

function COW_FRAME(f) {
  const leg = f === 0 ? 0 : 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <ellipse cx="45" cy="50" rx="35" ry="22" fill="#f5f5f4" stroke="#a8a29e" stroke-width="2"/>
  <ellipse cx="45" cy="45" rx="8" ry="6" fill="#f5f5f4" stroke="#a8a29e"/>
  <circle cx="30" cy="42" r="5" fill="#1a1a1a"/><circle cx="60" cy="42" r="5" fill="#1a1a1a"/>
  <ellipse cx="28" cy="55" rx="12" ry="8" fill="#444" opacity="0.5"/>
  <ellipse cx="62" cy="52" rx="10" ry="7" fill="#444" opacity="0.5"/>
  <path d="M20 35 Q15 25 25 30" stroke="#a8a29e" stroke-width="3" fill="none"/>
  <path d="M70 35 Q75 25 65 30" stroke="#a8a29e" stroke-width="3" fill="none"/>
  <rect x="32" y="68" width="6" height="${12 + leg}" fill="#a8a29e"/>
  <rect x="52" y="68" width="6" height="${12 - leg}" fill="#a8a29e"/>
  <text x="45" y="72" text-anchor="middle" font-size="11" fill="#78716c" font-weight="bold">МУ-У!</text>
</svg>`;
}

const ACCIDENT_SVG = ACCIDENT_FRAME(0);

function ACCIDENT_FRAME(f) {
  const rot = f === 0 ? -15 : -20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 80">
  <polygon points="45,10 55,35 80,35 60,52 68,78 45,62 22,78 30,52 10,35 35,35" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
  <text x="45" y="48" text-anchor="middle" font-size="22" font-weight="bold" fill="#dc2626">!</text>
  <rect x="5" y="55" width="25" height="15" rx="3" fill="#64748b" transform="rotate(${rot} 17 62)"/>
  <rect x="60" y="58" width="22" height="12" rx="2" fill="#ef4444" transform="rotate(${20 + f * 5} 71 64)"/>
</svg>`;
}

const ROADWORK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 85">
  <polygon points="40,5 75,75 5,75" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
  <rect x="35" y="30" width="10" height="35" fill="#1a1a1a"/>
  <text x="40" y="58" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a1a1a">!</text>
  <rect x="10" y="70" width="60" height="8" rx="2" fill="#f97316" opacity="0.6"/>
</svg>`;

const FUEL_SVG = FUEL_FRAME(0);

function FUEL_FRAME(f) {
  const glow = 0.4 + f * 0.2;
  const scale = 1 + f * 0.03;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 90">
  <defs><linearGradient id="fg${f}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs>
  <ellipse cx="35" cy="45" rx="${28 * scale}" ry="${38 * scale}" fill="rgba(34,197,94,${glow * 0.3})"/>
  <rect x="20" y="25" width="30" height="55" rx="4" fill="url(#fg${f})" stroke="#166534" stroke-width="2"/>
  <rect x="25" y="15" width="20" height="15" rx="3" fill="#22c55e" stroke="#166534"/>
  <rect x="28" y="35" width="14" height="20" rx="2" fill="#86efac" opacity="${0.5 + glow * 0.3}"/>
  <text x="35" y="58" text-anchor="middle" font-size="14" font-weight="bold" fill="white">АИ</text>
</svg>`;
}

const MONEY_SVG = MONEY_FRAME(0);

function MONEY_FRAME(f) {
  const spark = f === 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="32" fill="#22c55e" stroke="#15803d" stroke-width="3"/>
  <circle cx="40" cy="40" r="26" fill="#4ade80" opacity="0.5"/>
  <text x="40" y="48" text-anchor="middle" font-size="28" font-weight="bold" fill="#14532d">₽</text>
  ${spark ? '<text x="58" y="28" font-size="16">✨</text><text x="22" y="55" font-size="12">✨</text>' : ''}
  <ellipse cx="40" cy="72" rx="25" ry="5" fill="rgba(34,197,94,0.25)"/>
</svg>`;
}

const TREE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100">
  <rect x="26" y="70" width="8" height="25" fill="#5c4033"/>
  <circle cx="30" cy="45" r="28" fill="#166534"/>
  <circle cx="22" cy="38" r="18" fill="#15803d"/>
  <circle cx="38" cy="35" r="20" fill="#14532d"/>
</svg>`;

const HILL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" preserveAspectRatio="none">
  <path d="M0 80 L0 45 Q50 20 100 40 T200 35 L200 80 Z" fill="#2d5016"/>
  <path d="M0 80 L0 55 Q80 30 200 50 L200 80 Z" fill="#3d6b2a" opacity="0.7"/>
</svg>`;
