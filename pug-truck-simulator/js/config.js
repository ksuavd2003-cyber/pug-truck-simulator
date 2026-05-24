/**
 * Конфигурация игры Pug Truck Simulator
 */
const CONFIG = {
  // Canvas / мир
  LANES: 4,
  LANE_WIDTH: 0, // вычисляется в runtime
  ROAD_SCROLL_BASE: 4,

  // Игрок
  PLAYER: {
    width: 88,
    height: 100,
    maxSpeed: 220,
    accel: 120,
    brake: 180,
    friction: 80,
    steerSpeed: 320,
    fuelMax: 100,
    fuelBurn: 2.2,
  },

  // Сложность (прогрессия)
  DIFFICULTY: {
    kmPerLevel: 2,
    spawnRateBase: 1.8,
    spawnRateMin: 0.5,
    speedMultPerKm: 0.02,
  },

  // Рейтинги дальнобойщика
  RATINGS: [
    { km: 0, name: 'Новичок' },
    { km: 3, name: 'Стажёр' },
    { km: 8, name: 'Бородач' },
    { km: 15, name: 'Король трассы' },
    { km: 30, name: 'Легенда М-11' },
    { km: 50, name: 'Бог асфальта' },
  ],

  // Типы препятствий
  OBSTACLES: {
    pothole: { emoji: '🕳️', damage: 15, speedLoss: 40, money: -20, label: 'Яма!' },
    police: { emoji: '🚔', damage: 0, speedLoss: 80, money: -100, label: 'ДПС!' },
    traffic: { emoji: '🚗', damage: 25, speedLoss: 60, money: -30, label: 'Пробка!' },
    cow: { emoji: '🐄', damage: 35, speedLoss: 50, money: -50, label: 'Корова!' },
    accident: { emoji: '💥', damage: 50, speedLoss: 100, money: -80, label: 'Авария!' },
    roadwork: { emoji: '🚧', damage: 20, speedLoss: 70, money: -40, label: 'Ремонт!' },
    fuel: { emoji: '⛽', damage: 0, speedLoss: 0, money: 0, fuel: 35, label: '+Бензин' },
    money: { emoji: '💵', damage: 0, speedLoss: 0, money: 80, label: '+Деньги' },
  },

  // Случайные события
  EVENTS: [
    { id: 'sleep', text: '😴 Борис задремал! Жми газ!', duration: 3, effect: 'sleep' },
    { id: 'gps', text: '📢 GPS: «Поверните в никуда!»', duration: 2 },
    { id: 'chanson', text: '🎵 Включился шансон на полную!', duration: 4, effect: 'chanson' },
    { id: 'breakdown', text: '🔧 Фура чихнула… -30% скорости', duration: 5, effect: 'breakdown' },
    { id: 'rain', text: '🌧️ Ливень! Скользко!', duration: 8, effect: 'rain' },
    { id: 'fog', text: '🌫️ Туман! Ничего не видно!', duration: 6, effect: 'fog' },
    { id: 'doshirak', text: '🍜 Борис жуёт доширак. -скорость', duration: 3, effect: 'doshirak' },
    { id: 'meme', text: '🐶 «Я не сплю, я медитирую!»', duration: 2 },
  ],

  // Фразы мопса
  PUG_PHRASES: [
    'Эх, трасса…',
    'Где мой доширак?!',
    'GPS, ты нормальный?!',
    'Ща посплю 5 минут…',
    'Дальнобой — это стиль жизни',
    'Кофе? У меня только шансон',
    'Фура красная — душа поёт',
    'ДПС? Я просто турист!',
    'Мопс на связи, приём!',
  ],

  // Магазин
  SHOP: [
    { id: 'tank', name: 'Бак ×1.5', icon: '⛽', price: 500, desc: 'Больше топлива' },
    { id: 'engine', name: 'Турбо мопс', icon: '🚀', price: 800, desc: '+20% скорость' },
    { id: 'armor', name: 'Бампер', icon: '🛡️', price: 600, desc: '-30% урон' },
    { id: 'truck_blue', name: 'Синяя фура', icon: '🚛', price: 1200, desc: 'Новый скин' },
    { id: 'truck_gold', name: 'Золотая фура', icon: '✨', price: 2500, desc: 'Премиум скин' },
    { id: 'road_night', name: 'Ночная трасса', icon: '🌙', price: 900, desc: 'Ночной режим' },
    { id: 'road_desert', name: 'Пустыня', icon: '🏜️', price: 1100, desc: 'Жаркая дорога' },
  ],

  STORAGE_KEY: 'pugTruckSave',
  LEADERBOARD_KEY: 'pugTruckLeaderboard',
};
