/**
 * 8-Bit NES Chiptune Synthesizer using Web Audio API
 * Generates square waves, triangle bass, and noise percussion without external assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.6;
  
  // Music state
  private currentTrack: string | null = null;
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Web Audio will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Create white noise buffer for percussion and noise SFX
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch {
      // AudioContext not available or blocked
    }
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicGain && this.ctx && !this.isMuted) {
      this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx && !this.isMuted) {
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  public playJump(isSuper: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    if (!isSuper) {
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.16);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  public playCoin() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // B5 (987.77 Hz) to E6 (1318.51 Hz)
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playBump() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playStomp() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.14);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playKick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playBreak() {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    this.resume();

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.22);
  }

  public playPowerupAppear() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const notes = [330, 392, 659, 523, 587, 784];
    const step = 0.055;
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      gain.gain.setValueAtTime(0.25, now + idx * step);
      gain.gain.linearRampToValueAtTime(0.01, now + (idx + 1) * step);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * step);
      osc.stop(now + (idx + 1) * step);
    });
  }

  public playPowerup() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    // Fast ascending chromatic arpeggios
    const freqs = [330, 392, 659, 523, 587, 784, 659, 784, 1046, 880, 987, 1318];
    const step = 0.04;
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      gain.gain.setValueAtTime(0.3, now + idx * step);
      gain.gain.linearRampToValueAtTime(0.01, now + (idx + 1) * step);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * step);
      osc.stop(now + (idx + 1) * step);
    });
  }

  public playPowerdown() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const freqs = [659, 587, 523, 440, 392, 330, 261];
    const step = 0.06;
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      gain.gain.setValueAtTime(0.25, now + idx * step);
      gain.gain.linearRampToValueAtTime(0.01, now + (idx + 1) * step);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * step);
      osc.stop(now + (idx + 1) * step);
    });
  }

  public playPipe() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const freqs = [261.63, 196.00, 164.81, 130.81];
    const step = 0.08;
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      gain.gain.setValueAtTime(0.35, now + idx * step);
      gain.gain.linearRampToValueAtTime(0.01, now + (idx + 1) * step);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * step);
      osc.stop(now + (idx + 1) * step);
    });
  }

  public playFireball() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playFlagpole() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playDie() {
    this.stopMusic();
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const notes = [
      { f: 523, d: 0.15 },
      { f: 493, d: 0.15 },
      { f: 466, d: 0.15 },
      { f: 440, d: 0.15 },
      { f: 392, d: 0.3 },
      { f: 330, d: 0.3 },
      { f: 261, d: 0.5 },
    ];
    let offset = 0;
    const now = this.ctx.currentTime;

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + offset);
      gain.gain.setValueAtTime(0.35, now + offset);
      gain.gain.linearRampToValueAtTime(0.01, now + offset + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + n.d);
      offset += n.d;
    });
  }

  public playStageClear() {
    this.stopMusic();
    if (!this.ctx || this.isMuted) return;
    this.resume();

    // Fanfare: G4 C5 E5 G5 C6 E6 G6 E6 G#4 C5 D#5 G#5 ...
    const fanfare = [
      { f: 392, d: 0.12 }, { f: 523, d: 0.12 }, { f: 659, d: 0.12 },
      { f: 784, d: 0.12 }, { f: 1046, d: 0.12 }, { f: 1318, d: 0.12 },
      { f: 1568, d: 0.3 }, { f: 1318, d: 0.3 },
      { f: 415, d: 0.12 }, { f: 523, d: 0.12 }, { f: 622, d: 0.12 },
      { f: 830, d: 0.12 }, { f: 1046, d: 0.12 }, { f: 1244, d: 0.12 },
      { f: 1661, d: 0.3 }, { f: 1244, d: 0.3 },
      { f: 466, d: 0.12 }, { f: 587, d: 0.12 }, { f: 698, d: 0.12 },
      { f: 932, d: 0.12 }, { f: 1174, d: 0.12 }, { f: 1396, d: 0.12 },
      { f: 1864, d: 0.3 }, { f: 1864, d: 0.12 }, { f: 1864, d: 0.12 }, { f: 1864, d: 0.4 },
    ];

    let offset = 0;
    const now = this.ctx.currentTime;
    fanfare.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, now + offset);
      gain.gain.setValueAtTime(0.3, now + offset);
      gain.gain.linearRampToValueAtTime(0.01, now + offset + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + n.d);
      offset += n.d;
    });
  }

  // --- Procedural 8-Bit Chiptune Music Tracker ---

  public playMusic(track: 'overworld' | 'underground' | 'castle' | 'starman') {
    if (this.currentTrack === track && this.musicInterval !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    this.musicStep = 0;
    this.resume();

    if (track === 'overworld') {
      this.startOverworldMusic();
    } else if (track === 'underground') {
      this.startUndergroundMusic();
    } else if (track === 'castle') {
      this.startCastleMusic();
    }
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'square', vol: number = 0.22) {
    if (!this.ctx || this.isMuted || freq <= 0) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(now);
    osc.stop(now + dur);
  }

  private playDrum(isSnare: boolean) {
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isSnare ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(isSnare ? 1200 : 7000, now);

    const gain = this.ctx.createGain();
    const dur = isSnare ? 0.08 : 0.04;
    gain.gain.setValueAtTime(isSnare ? 0.15 : 0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);
    noise.start(now);
    noise.stop(now + dur);
  }

  private startOverworldMusic() {
    // Note frequencies
    const E4 = 329.63, C4 = 261.63, G4 = 392.00, G3 = 196.00;
    const C5 = 523.25, G4_ = 392.00, E4_ = 329.63, A4 = 440.00, B4 = 493.88, Bb4 = 466.16;
    const D5 = 587.33, F5 = 698.46;
    const B3 = 246.94, D4 = 293.66, G5 = 783.99;
    const _ = 0; // rest

    // Bass notes
    const D3 = 146.83, G2 = 98.00, C3 = 130.81, E3 = 164.81, F3 = 174.61, A2 = 110.00;

    // Iconic Intro + Loop pattern (16th note steps at ~125 BPM -> ~120ms per 16th step)
    const introMelody = [
      E4, E4, _, E4, _, C4, E4, _, G4, _, _, _, G3, _, _, _
    ];

    const mainMelody = [
      // Bar 1
      C5, _, _, G4, _, _, E4, _, _, A4, _, B4, _, Bb4, A4, _,
      // Bar 2
      G4, E4, _, G4, A4, _, F5, G5, _, E4, _, C4, D4, B3, _, _,
      // Bar 3
      C5, _, _, G4, _, _, E4, _, _, A4, _, B4, _, Bb4, A4, _,
      // Bar 4
      G4, E4, _, G4, A4, _, F5, G5, _, E4, _, C4, D4, B3, _, _,
    ];

    const mainBass = [
      // Bar 1
      G2, _, C3, _, E3, _, G2, _, C3, _, F3, _, A2, _, F3, _,
      // Bar 2
      C3, _, E3, _, F3, _, D3, _, G2, _, C3, _, G2, _, C3, _,
      // Bar 3
      G2, _, C3, _, E3, _, G2, _, C3, _, F3, _, A2, _, F3, _,
      // Bar 4
      C3, _, E3, _, F3, _, D3, _, G2, _, C3, _, G2, _, C3, _,
    ];

    const stepMs = 125;
    let inMain = false;
    let localStep = 0;

    this.musicInterval = window.setInterval(() => {
      if (!inMain) {
        const note = introMelody[localStep];
        if (note > 0) this.playTone(note, 0.1, 'square', 0.2);
        if (localStep % 2 === 0) this.playDrum(localStep % 4 === 2);
        localStep++;
        if (localStep >= introMelody.length) {
          inMain = true;
          localStep = 0;
        }
      } else {
        const note = mainMelody[localStep % mainMelody.length];
        const bass = mainBass[localStep % mainBass.length];
        if (note > 0) this.playTone(note, 0.11, 'square', 0.18);
        if (bass > 0) this.playTone(bass, 0.13, 'triangle', 0.25);
        this.playDrum(localStep % 4 === 2);
        localStep++;
      }
    }, stepMs);
  }

  private startUndergroundMusic() {
    // Iconic mysterious Underground bassline:
    // C4 C5 A3 A4 Bb3 Bb4 ...
    const C3 = 130.81, C4 = 261.63, A2 = 110.00, A3 = 220.00, Bb2 = 116.54, Bb3 = 233.08;
    const F2 = 87.31, F3 = 174.61, Eb2 = 77.78, Eb3 = 155.56;
    const D2 = 73.42, D3 = 146.83;
    const _ = 0;

    const bass = [
      C3, C4, A2, A3, Bb2, Bb3, _, _,
      F2, F3, D2, D3, Eb2, Eb3, _, _,
      C3, C4, A2, A3, Bb2, Bb3, _, _,
      F2, F3, D2, D3, Eb2, Eb3, _, _,
    ];

    const stepMs = 130;
    let localStep = 0;

    this.musicInterval = window.setInterval(() => {
      const note = bass[localStep % bass.length];
      if (note > 0) {
        this.playTone(note, 0.1, 'triangle', 0.35);
      }
      if (localStep % 4 === 0) {
        this.playDrum(false);
      }
      localStep++;
    }, stepMs);
  }

  private startCastleMusic() {
    // Tense 16th-note castle arpeggios
    const notes = [
      196, 207, 220, 233, 246, 261, 277, 293,
      277, 261, 246, 233, 220, 207, 196, 185
    ];
    const stepMs = 100;
    let localStep = 0;

    this.musicInterval = window.setInterval(() => {
      const note = notes[localStep % notes.length];
      this.playTone(note, 0.08, 'square', 0.2);
      this.playTone(note / 2, 0.08, 'triangle', 0.25);
      if (localStep % 4 === 2) this.playDrum(true);
      localStep++;
    }, stepMs);
  }
}

export const soundEngine = new SoundEngine();
