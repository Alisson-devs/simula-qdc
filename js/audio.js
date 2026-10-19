/**
 * QDC Lab Pro - Web Audio Synthesizer
 * Gera efeitos sonoros realistas para manobras elétricas, arcos e multímetro sem arquivos externos
 */
export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.humNode = null;
    this.humGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API não suportada no navegador:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Clique de interruptor / botão
  playClick() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Desarme violento mecânico de disjuntor / DR (CLAC!)
  playTrip() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Ruído percussivo de mola e gatilho
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1400, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);

    // Oscilador metálico "clac"
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Arco elétrico / curto-circuito (explosão / faísca elétrica)
  playShortCircuit() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Ruído de faísca/estouro
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.04);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2500, t);
    bandpass.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);

    // Zumbido forte de rede 60Hz distorcido
    const buzz = this.ctx.createOscillator();
    const buzzGain = this.ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(120, t);
    buzzGain.gain.setValueAtTime(0.4, t);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    buzz.connect(buzzGain);
    buzzGain.connect(this.ctx.destination);
    buzz.start(t);
    buzz.stop(t + 0.26);
  }

  // Bip de continuidade do multímetro (apito claro 2.4kHz)
  beep(enabled = true) {
    this.init();
    if (!this.ctx) return;
    this.resume();

    if (enabled) {
      if (this.beepOsc) return;
      const t = this.ctx.currentTime;
      this.beepOsc = this.ctx.createOscillator();
      this.beepGain = this.ctx.createGain();

      this.beepOsc.type = 'sine';
      this.beepOsc.frequency.setValueAtTime(2400, t);
      this.beepGain.gain.setValueAtTime(0.12, t);

      this.beepOsc.connect(this.beepGain);
      this.beepGain.connect(this.ctx.destination);
      this.beepOsc.start();
    } else {
      if (this.beepOsc) {
        try {
          this.beepOsc.stop();
          this.beepOsc.disconnect();
        } catch (e) {}
        this.beepOsc = null;
        this.beepGain = null;
      }
    }
  }

  // Campainha elétrica
  playBuzzer() {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }
}

export const sound = new SoundEffects();
