/**
 * Аудио: Web Audio API (без внешних файлов)
 */
const AudioEngine = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  engineOsc: null,
  musicInterval: null,
  settings: { music: 0.6, sfx: 0.8 },

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.updateVolumes();
  },

  resume() {
    this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  },

  updateVolumes() {
    if (!this.ctx) return;
    this.musicGain.gain.value = this.settings.music;
    this.sfxGain.gain.value = this.settings.sfx;
  },

  /** Звук двигателя (частота от скорости) */
  setEngine(speedRatio) {
    if (!this.ctx || speedRatio <= 0) {
      this.stopEngine();
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      g.gain.value = 0.04;
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.connect(g);
      g.connect(this.sfxGain);
      this.engineOsc.start();
    }
    this.engineOsc.frequency.setTargetAtTime(60 + speedRatio * 120, this.ctx.currentTime, 0.1);
  },

  stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch {}
      this.engineOsc = null;
    }
  },

  /** Короткий звук */
  beep(freq = 440, dur = 0.1, type = 'square', vol = 0.15) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol * this.settings.sfx, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  honk() {
    this.beep(280, 0.15, 'square', 0.25);
    setTimeout(() => this.beep(220, 0.2, 'square', 0.2), 100);
  },

  collect() { this.beep(880, 0.08, 'sine', 0.2); },
  hit() { this.beep(120, 0.25, 'sawtooth', 0.3); },
  money() { this.beep(1200, 0.1, 'sine', 0.15); setTimeout(() => this.beep(1500, 0.1, 'sine', 0.12), 80); },

  /** Простая «шансон» мелодия */
  startChanson() {
    if (!this.ctx || this.musicInterval) return;
    const notes = [262, 294, 330, 294, 262, 220, 196, 220];
    let i = 0;
    this.musicInterval = setInterval(() => {
      this.beep(notes[i % notes.length], 0.2, 'triangle', 0.08);
      i++;
    }, 400);
  },

  stopChanson() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  },

  /** Фоновая музыка — простой луп */
  startMusic() {
    if (!this.ctx) return;
    this.stopMusic();
    const playNote = () => {
      if (!this.ctx) return;
      const notes = [130.81, 164.81, 196, 164.81];
      const n = notes[Math.floor(Math.random() * notes.length)];
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = n;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06 * this.settings.music, this.ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      o.connect(g);
      g.connect(this.musicGain);
      o.start();
      o.stop(this.ctx.currentTime + 0.9);
    };
    this._musicTimer = setInterval(playNote, 900);
    playNote();
  },

  stopMusic() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    this._musicTimer = null;
    this.stopChanson();
  },
};
