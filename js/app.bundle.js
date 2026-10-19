/**
 * QDC Lab Pro - Bundle Standalone
 * Permite execução direta via protocolo file:/// sem erro de CORS
 */
(() => {
  'use strict';

  // ==========================================================
  // 1. ÁUDIO & EFEITOS SONOROS (WEB AUDIO API)
  // ==========================================================
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.initialized = false;
      this.beepOsc = null;
      this.beepGain = null;
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
        console.warn('Web Audio API indisponível:', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

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

    playTrip() {
      this.init();
      if (!this.ctx) return;
      this.resume();

      const t = this.ctx.currentTime;
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

    playShortCircuit() {
      this.init();
      if (!this.ctx) return;
      this.resume();

      const t = this.ctx.currentTime;
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

  const sound = new SoundEffects();

  // ==========================================================
  // 2. CATÁLOGO DE COMPONENTES E ESPECIFICAÇÕES NBR 5410
  // ==========================================================
  const WIRE_COLORS = {
    f1: { name: 'Fase 1 (Preto)', hex: '#1e242b', standard: 'NBR 5410' },
    f2: { name: 'Fase 2 (Vermelho)', hex: '#ef4444', standard: 'NBR 5410' },
    f3: { name: 'Fase 3 (Branco)', hex: '#e2e8f0', standard: 'NBR 5410' },
    n:  { name: 'Neutro (Azul Claro)', hex: '#0284c7', standard: 'Obrigatório Azul' },
    pe: { name: 'Terra PE (Verde)', hex: '#10b981', standard: 'Obrigatório Verde/Verde-Amarelo' },
    ret:{ name: 'Retorno (Amarelo)', hex: '#eab308', standard: 'Comando Iluminação' },
    ret2:{ name: 'Retorno 2 (Laranja)', hex: '#f97316', standard: 'Comando Paralelo' },
    par:{ name: 'Paralelo / Three-Way (Cinza)', hex: '#64748b', standard: 'Comunicação' }
  };

  const COMPONENT_DEFINITIONS = {
    source_mono: {
      name: 'Padrão Monofásico (127V ou 220V)',
      shortName: 'REDE MONO',
      category: 'source',
      categoryLabel: 'Alimentação',
      w: 120, h: 90,
      terms: [
        { id: 'f1', label: 'Fase (F)', type: 'f1', x: 0, y: 24 },
        { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 48 },
        { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 72 }
      ],
      defaultProps: { voltage: 127 }
    },
    source_bi: {
      name: 'Padrão Bifásico (127V/220V)',
      shortName: 'REDE BIFÁSICA',
      category: 'source',
      categoryLabel: 'Alimentação',
      w: 140, h: 115,
      terms: [
        { id: 'f1', label: 'Fase 1 (R)', type: 'f1', x: 0, y: 22 },
        { id: 'f2', label: 'Fase 2 (S)', type: 'f2', x: 0, y: 46 },
        { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 70 },
        { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 94 }
      ],
      defaultProps: { voltage: 220 }
    },
    source_tri: {
      name: 'Padrão Trifásico (220V/380V)',
      shortName: 'REDE TRIFÁSICA',
      category: 'source',
      categoryLabel: 'Alimentação',
      w: 150, h: 140,
      terms: [
        { id: 'f1', label: 'Fase 1 (R)', type: 'f1', x: 0, y: 22 },
        { id: 'f2', label: 'Fase 2 (S)', type: 'f2', x: 0, y: 46 },
        { id: 'f3', label: 'Fase 3 (T)', type: 'f3', x: 0, y: 70 },
        { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 94 },
        { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 118 }
      ],
      defaultProps: { voltage: 380 }
    },
    breaker1: {
      name: 'Disjuntor Termomagnético 1P (Monopolar)',
      shortName: 'DISJUNTOR 1P',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 70, h: 110,
      terms: [
        { id: 'in',  label: 'Entrada Fase', type: 'f1', x: 35, y: 0 },
        { id: 'out', label: 'Saída Circuito', type: 'f1', x: 35, y: 110 }
      ],
      defaultProps: { rating: 16, isOn: true, tripped: false, curve: 'C' }
    },
    breaker2: {
      name: 'Disjuntor Termomagnético 2P (Bipolar)',
      shortName: 'DISJUNTOR 2P',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 95, h: 110,
      terms: [
        { id: 'in1',  label: 'Entrada F1', type: 'f1', x: 28, y: 0 },
        { id: 'in2',  label: 'Entrada F2', type: 'f2', x: 67, y: 0 },
        { id: 'out1', label: 'Saída F1',   type: 'f1', x: 28, y: 110 },
        { id: 'out2', label: 'Saída F2',   type: 'f2', x: 67, y: 110 }
      ],
      defaultProps: { rating: 32, isOn: true, tripped: false, curve: 'C' }
    },
    breaker3: {
      name: 'Disjuntor Termomagnético 3P (Tripolar)',
      shortName: 'DISJUNTOR 3P',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 125, h: 110,
      terms: [
        { id: 'in1',  label: 'Entrada F1', type: 'f1', x: 25, y: 0 },
        { id: 'in2',  label: 'Entrada F2', type: 'f2', x: 62, y: 0 },
        { id: 'in3',  label: 'Entrada F3', type: 'f3', x: 100, y: 0 },
        { id: 'out1', label: 'Saída F1',   type: 'f1', x: 25, y: 110 },
        { id: 'out2', label: 'Saída F2',   type: 'f2', x: 62, y: 110 },
        { id: 'out3', label: 'Saída F3',   type: 'f3', x: 100, y: 110 }
      ],
      defaultProps: { rating: 50, isOn: true, tripped: false, curve: 'C' }
    },
    rcd2: {
      name: 'Interruptor Diferencial Residual (DR 2P)',
      shortName: 'DR 2 POLOS (30mA)',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 95, h: 120,
      terms: [
        { id: 'in_f',  label: 'Entrada Fase',   type: 'f1', x: 28, y: 0 },
        { id: 'in_n',  label: 'Entrada Neutro', type: 'n',  x: 67, y: 0 },
        { id: 'out_f', label: 'Saída Fase',     type: 'f1', x: 28, y: 120 },
        { id: 'out_n', label: 'Saída Neutro',   type: 'n',  x: 67, y: 120 }
      ],
      defaultProps: { rating: 40, sensitivity: 30, isOn: true, tripped: false }
    },
    rcd4: {
      name: 'Interruptor Diferencial Residual (DR 4P)',
      shortName: 'DR TETRAPOLAR (30mA)',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 155, h: 120,
      terms: [
        { id: 'in1',  label: 'Entrada F1',     type: 'f1', x: 24, y: 0 },
        { id: 'in2',  label: 'Entrada F2',     type: 'f2', x: 58, y: 0 },
        { id: 'in3',  label: 'Entrada F3',     type: 'f3', x: 92, y: 0 },
        { id: 'in_n', label: 'Entrada Neutro', type: 'n',  x: 128, y: 0 },
        { id: 'out1', label: 'Saída F1',       type: 'f1', x: 24, y: 120 },
        { id: 'out2', label: 'Saída F2',       type: 'f2', x: 58, y: 120 },
        { id: 'out3', label: 'Saída F3',       type: 'f3', x: 92, y: 120 },
        { id: 'out_n',label: 'Saída Neutro',   type: 'n',  x: 128, y: 120 }
      ],
      defaultProps: { rating: 63, sensitivity: 30, isOn: true, tripped: false }
    },
    spd: {
      name: 'Dispositivo Protetor de Surtos (DPS Classe II)',
      shortName: 'DPS CLASSE II',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 70, h: 100,
      terms: [
        { id: 'in',  label: 'Entrada Fase/N', type: 'f1', x: 35, y: 0 },
        { id: 'pe',  label: 'Aterramento PE', type: 'pe', x: 35, y: 100 }
      ],
      defaultProps: { maxVoltage: 275, maxCurrentKa: 45, ok: true, poles: 1 }
    },
    spd3: {
      name: 'DPS Trifásico Classe II (3 Pólos Vermelhos)',
      shortName: 'DPS 3P (45kA)',
      category: 'qdc',
      categoryLabel: 'Proteção QDC',
      w: 125, h: 100,
      terms: [
        { id: 'in1', label: 'Entrada L1', type: 'f1', x: 21, y: 0 },
        { id: 'in2', label: 'Entrada L2', type: 'f2', x: 62, y: 0 },
        { id: 'in3', label: 'Entrada L3', type: 'f3', x: 104, y: 0 },
        { id: 'pe1', label: 'Terra PE1',  type: 'pe', x: 21, y: 100 },
        { id: 'pe2', label: 'Terra PE2',  type: 'pe', x: 62, y: 100 },
        { id: 'pe3', label: 'Terra PE3',  type: 'pe', x: 104, y: 100 }
      ],
      defaultProps: { maxVoltage: 275, maxCurrentKa: 45, ok: true, poles: 3 }
    },
    neutral_bus: {
      name: 'Barramento de Neutro Isolado',
      shortName: 'BARRAMENTO NEUTRO',
      category: 'bus',
      categoryLabel: 'Barramentos',
      w: 160, h: 46,
      terms: [
        { id: 'n0', label: 'N0', type: 'n', x: 0, y: 23 },
        { id: 'n1', label: 'N1', type: 'n', x: 35, y: 46 },
        { id: 'n2', label: 'N2', type: 'n', x: 65, y: 46 },
        { id: 'n3', label: 'N3', type: 'n', x: 95, y: 46 },
        { id: 'n4', label: 'N4', type: 'n', x: 125, y: 46 },
        { id: 'n5', label: 'N5', type: 'n', x: 160, y: 23 }
      ],
      defaultProps: {}
    },
    earth_bus: {
      name: 'Barramento de Proteção / Terra (PE)',
      shortName: 'BARRAMENTO TERRA (PE)',
      category: 'bus',
      categoryLabel: 'Barramentos',
      w: 160, h: 46,
      terms: [
        { id: 'pe0', label: 'PE0', type: 'pe', x: 0, y: 23 },
        { id: 'pe1', label: 'PE1', type: 'pe', x: 35, y: 46 },
        { id: 'pe2', label: 'PE2', type: 'pe', x: 65, y: 46 },
        { id: 'pe3', label: 'PE3', type: 'pe', x: 95, y: 46 },
        { id: 'pe4', label: 'PE4', type: 'pe', x: 125, y: 46 },
        { id: 'pe5', label: 'PE5', type: 'pe', x: 160, y: 23 }
      ],
      defaultProps: {}
    },
    comb_1p: {
      name: 'Barramento Tipo Pente Monofásico 1P',
      shortName: 'PENTE 1P (63A)',
      category: 'bus',
      categoryLabel: 'Barramentos Pente',
      w: 240, h: 42,
      terms: [
        { id: 'p0', label: 'Pino 1 (Fase)', type: 'f1', x: 20,  y: 42 },
        { id: 'p1', label: 'Pino 2 (Fase)', type: 'f1', x: 60,  y: 42 },
        { id: 'p2', label: 'Pino 3 (Fase)', type: 'f1', x: 100, y: 42 },
        { id: 'p3', label: 'Pino 4 (Fase)', type: 'f1', x: 140, y: 42 },
        { id: 'p4', label: 'Pino 5 (Fase)', type: 'f1', x: 180, y: 42 },
        { id: 'p5', label: 'Pino 6 (Fase)', type: 'f1', x: 220, y: 42 }
      ],
      defaultProps: { rating: 63 }
    },
    comb_2p: {
      name: 'Barramento Tipo Pente Bifásico 2P',
      shortName: 'PENTE 2P (63A)',
      category: 'bus',
      categoryLabel: 'Barramentos Pente',
      w: 240, h: 42,
      terms: [
        { id: 'p0', label: 'Pino 1 (L1)', type: 'f1', x: 20,  y: 42 },
        { id: 'p1', label: 'Pino 2 (L2)', type: 'f2', x: 60,  y: 42 },
        { id: 'p2', label: 'Pino 3 (L1)', type: 'f1', x: 100, y: 42 },
        { id: 'p3', label: 'Pino 4 (L2)', type: 'f2', x: 140, y: 42 },
        { id: 'p4', label: 'Pino 5 (L1)', type: 'f1', x: 180, y: 42 },
        { id: 'p5', label: 'Pino 6 (L2)', type: 'f2', x: 220, y: 42 }
      ],
      defaultProps: { rating: 63 }
    },
    comb_3p: {
      name: 'Barramento Tipo Pente Trifásico 3P',
      shortName: 'PENTE 3P (63A)',
      category: 'bus',
      categoryLabel: 'Barramentos Pente',
      w: 240, h: 42,
      terms: [
        { id: 'p0', label: 'Pino 1 (L1)', type: 'f1', x: 20,  y: 42 },
        { id: 'p1', label: 'Pino 2 (L2)', type: 'f2', x: 60,  y: 42 },
        { id: 'p2', label: 'Pino 3 (L3)', type: 'f3', x: 100, y: 42 },
        { id: 'p3', label: 'Pino 4 (L1)', type: 'f1', x: 140, y: 42 },
        { id: 'p4', label: 'Pino 5 (L2)', type: 'f2', x: 180, y: 42 },
        { id: 'p5', label: 'Pino 6 (L3)', type: 'f3', x: 220, y: 42 }
      ],
      defaultProps: { rating: 63 }
    },
    wire_junction: {
      name: 'Conector de Emenda / Derivação (WAGO)',
      shortName: 'EMENDA / NÓ',
      category: 'bus',
      categoryLabel: 'Emendas & Derivações',
      w: 32, h: 32,
      terms: [
        { id: 't0', label: 'Borne Norte', type: 'ret', x: 16, y: 0 },
        { id: 't1', label: 'Borne Sul',   type: 'ret', x: 16, y: 32 },
        { id: 't2', label: 'Borne Oeste', type: 'ret', x: 0,  y: 16 },
        { id: 't3', label: 'Borne Leste', type: 'ret', x: 32, y: 16 },
        { id: 't4', label: 'Borne Centro',type: 'ret', x: 16, y: 16 }
      ],
      defaultProps: { color: 'f1' }
    },
    switch_simple: {
      name: 'Interruptor Simples (1 Tecla)',
      shortName: 'INTERRUPTOR SIMPLES',
      category: 'command',
      categoryLabel: 'Comandos & Teclas',
      w: 80, h: 80,
      terms: [
        { id: 'in',  label: 'Fase (L)', type: 'f1', x: 0, y: 40 },
        { id: 'out', label: 'Retorno (R)', type: 'ret', x: 80, y: 40 }
      ],
      defaultProps: { isOn: false }
    },
    switch_double: {
      name: 'Interruptor Duplo (2 Teclas Simples 4x2)',
      shortName: 'INTERRUPTOR DUPLO',
      category: 'command',
      categoryLabel: 'Comandos & Teclas',
      w: 80, h: 90,
      terms: [
        { id: 'in1',  label: 'Fase Tecla 1 (A)', type: 'f1', x: 0, y: 25 },
        { id: 'out1', label: 'Retorno 1 (A)',   type: 'ret', x: 80, y: 25 },
        { id: 'in2',  label: 'Fase Tecla 2 (B)', type: 'f1', x: 0, y: 65 },
        { id: 'out2', label: 'Retorno 2 (B)',   type: 'ret2', x: 80, y: 65 }
      ],
      defaultProps: { key1On: false, key2On: false }
    },
    switch_parallel: {
      name: 'Interruptor Paralelo (Three-Way)',
      shortName: 'THREE-WAY (PARALELO)',
      category: 'command',
      categoryLabel: 'Comandos & Teclas',
      w: 90, h: 80,
      terms: [
        { id: 'com', label: 'Comum', type: 'f1', x: 0, y: 40 },
        { id: 'p1',  label: 'Paralelo 1', type: 'ret2', x: 90, y: 25 },
        { id: 'p2',  label: 'Paralelo 2', type: 'ret2', x: 90, y: 55 }
      ],
      defaultProps: { position: 1 }
    },
    switch_intermediate: {
      name: 'Interruptor Intermediário (Four-Way)',
      shortName: 'FOUR-WAY (INTERMEDIÁRIO)',
      category: 'command',
      categoryLabel: 'Comandos & Teclas',
      w: 90, h: 80,
      terms: [
        { id: 'in1',  label: 'Entrada 1', type: 'ret2', x: 0, y: 25 },
        { id: 'in2',  label: 'Entrada 2', type: 'ret2', x: 0, y: 55 },
        { id: 'out1', label: 'Saída 1',   type: 'ret2', x: 90, y: 25 },
        { id: 'out2', label: 'Saída 2',   type: 'ret2', x: 90, y: 55 }
      ],
      defaultProps: { crossed: false }
    },
    lamp_led: {
      name: 'Lâmpada LED (Iluminação Teto)',
      shortName: 'LÂMPADA LED',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 90, h: 90,
      terms: [
        { id: 'ret', label: 'Retorno / Fase', type: 'ret', x: 0, y: 45 },
        { id: 'n',   label: 'Neutro',         type: 'n',   x: 90, y: 45 }
      ],
      defaultProps: { watts: 15, isLit: false }
    },
    socket_tug: {
      name: 'Tomada de Uso Geral TUG 10A (2P+T)',
      shortName: 'TOMADA 10A TUG',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 90, h: 90,
      terms: [
        { id: 'f',  label: 'Fase (Direita)', type: 'f1', x: 0, y: 25 },
        { id: 'pe', label: 'Terra (Centro)', type: 'pe', x: 0, y: 45 },
        { id: 'n',  label: 'Neutro (Esquerda)', type: 'n', x: 0, y: 65 }
      ],
      defaultProps: { loadConnected: true, watts: 100 }
    },
    socket_tue: {
      name: 'Tomada Especial TUE 20A (2P+T 220V)',
      shortName: 'TOMADA 20A TUE',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 90, h: 90,
      terms: [
        { id: 'f1', label: 'Fase 1', type: 'f1', x: 0, y: 25 },
        { id: 'pe', label: 'Terra',  type: 'pe', x: 0, y: 45 },
        { id: 'f2', label: 'Fase 2 / Neutro', type: 'f2', x: 0, y: 65 }
      ],
      defaultProps: { loadConnected: true, watts: 1500 }
    },
    shower: {
      name: 'Chuveiro Elétrico Potente',
      shortName: 'CHUVEIRO ELÉTRICO',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 120, h: 105,
      terms: [
        { id: 'f1', label: 'Fase 1', type: 'f1', x: 0, y: 28 },
        { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 52 },
        { id: 'f2', label: 'Fase 2 / Neutro', type: 'f2', x: 0, y: 76 }
      ],
      defaultProps: { mode: 'inverno', watts: 6800, isRunning: false }
    },
    fan: {
      name: 'Ventilador de Teto com Iluminação',
      shortName: 'VENTILADOR C/ LUZ',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 105, h: 105,
      terms: [
        { id: 'ret_mot', label: 'Retorno Motor', type: 'ret', x: 0, y: 30 },
        { id: 'ret_luz', label: 'Retorno Luz',   type: 'ret', x: 0, y: 55 },
        { id: 'n',       label: 'Neutro Comum',  type: 'n',   x: 105, y: 42 }
      ],
      defaultProps: { watts: 130, fanOn: false, lightOn: false }
    },
    motor: {
      name: 'Motor Elétrico / Bomba D\'água',
      shortName: 'MOTOR / BOMBA D’ÁGUA',
      category: 'load',
      categoryLabel: 'Cargas & Aparelhos',
      w: 110, h: 95,
      terms: [
        { id: 'f',  label: 'Fase',  type: 'f1', x: 0, y: 28 },
        { id: 'pe', label: 'Terra', type: 'pe', x: 0, y: 48 },
        { id: 'n',  label: 'Neutro',type: 'n',  x: 0, y: 68 }
      ],
      defaultProps: { hp: '1/2 CV', watts: 550, isRunning: false }
    }
  };

  // ==========================================================
  // TABELA DE CAPACIDADE DE CONDUÇÃO E BITOLAS NBR 5410 (MÉTODO B1)
  // ==========================================================
  const NBR5410_GAUGES = [
    { gauge: 1.5, maxAmps: 15.5, breaker: 10, label: '1,5 mm² (Iluminação - máx 15.5A)' },
    { gauge: 2.5, maxAmps: 21.0, breaker: 16, label: '2,5 mm² (Tomadas TUG - máx 21A)' },
    { gauge: 4.0, maxAmps: 28.0, breaker: 25, label: '4,0 mm² (Cargas Médias - máx 28A)' },
    { gauge: 6.0, maxAmps: 36.0, breaker: 32, label: '6,0 mm² (Chuveiro/TUE - máx 36A)' },
    { gauge: 10.0, maxAmps: 50.0, breaker: 50, label: '10,0 mm² (Alimentação Geral - máx 50A)' },
    { gauge: 16.0, maxAmps: 68.0, breaker: 63, label: '16,0 mm² (Alta Potência - máx 68A)' }
  ];

  function getCableDimensioning(current, isLighting = false) {
    const minG = isLighting ? 1.5 : 2.5; // NBR 5410 item 6.2.7.2.1: circuitos de iluminação mín 1.5mm², tomadas e força mín 2.5mm²
    for (let entry of NBR5410_GAUGES) {
      if (entry.gauge >= minG && current <= entry.maxAmps) {
        return entry;
      }
    }
    return NBR5410_GAUGES[NBR5410_GAUGES.length - 1];
  }

  // ==========================================================
  // 3. MOTOR DE SIMULAÇÃO ELÉTRICA (KIRCHHOFF & NBR 5410)
  // ==========================================================
  class CircuitSimulator {
    constructor() {
      this.systemVoltage = 220;
    }

    setSystemVoltage(v) {
      this.systemVoltage = Number(v) || 220;
    }

    analyze(parts, wires, isSimulationActive) {
      const report = {
        active: isSimulationActive,
        hasShort: false,
        shorts: [],
        shortedWires: new Set(),
        overloadedWires: new Set(),
        trippedBreakers: [],
        loads: [],
        totalPower: 0,
        totalCurrent: 0,
        phaseLoads: { f1: 0, f2: 0, f3: 0 },
        liveWires: new Map(),
        terminalPotentials: new Map(),
        warnings: [],
        compliance: []
      };

      if (!isSimulationActive) return report;

      const nets = { f1: new Set(), f2: new Set(), f3: new Set(), n: new Set(), pe: new Set() };

      parts.filter(p => p.kind && p.kind.startsWith('source')).forEach(source => {
        source.terms.forEach(t => {
          const key = `${source.id}:${t.idx}`;
          if (t.type === 'f1') nets.f1.add(key);
          else if (t.type === 'f2') nets.f2.add(key);
          else if (t.type === 'f3') nets.f3.add(key);
          else if (t.type === 'n')  nets.n.add(key);
          else if (t.type === 'pe') nets.pe.add(key);
        });
      });

      let changed = true;
      let iterations = 0;
      while (changed && iterations < 200) {
        changed = false;
        iterations++;

        wires.forEach(w => {
          const kA = `${w.a.pid}:${w.a.idx}`;
          const kB = `${w.b.pid}:${w.b.idx}`;
          Object.keys(nets).forEach(netName => {
            const net = nets[netName];
            if (net.has(kA) && !net.has(kB)) { net.add(kB); changed = true; }
            if (net.has(kB) && !net.has(kA)) { net.add(kA); changed = true; }
          });
        });

        parts.forEach(p => {
          const pairs = this.getInternalConductionPairs(p);
          pairs.forEach(([idxA, idxB]) => {
            const kA = `${p.id}:${idxA}`;
            const kB = `${p.id}:${idxB}`;
            Object.keys(nets).forEach(netName => {
              const net = nets[netName];
              if (net.has(kA) && !net.has(kB)) { net.add(kB); changed = true; }
              if (net.has(kB) && !net.has(kA)) { net.add(kA); changed = true; }
            });
          });
        });
      }

      parts.forEach(p => {
        p.terms.forEach(t => {
          const k = `${p.id}:${t.idx}`;
          const activeNets = new Set();
          if (nets.f1.has(k)) activeNets.add('f1');
          if (nets.f2.has(k)) activeNets.add('f2');
          if (nets.f3.has(k)) activeNets.add('f3');
          if (nets.n.has(k))  activeNets.add('n');
          if (nets.pe.has(k)) activeNets.add('pe');
          report.terminalPotentials.set(k, activeNets);
        });
      });

      const shortTests = [
        { a: 'f1', b: 'f2', nameA: 'Fase 1', nameB: 'Fase 2', severity: 'Fase-Fase 220V' },
        { a: 'f1', b: 'f3', nameA: 'Fase 1', nameB: 'Fase 3', severity: 'Fase-Fase 220V' },
        { a: 'f2', b: 'f3', nameA: 'Fase 2', nameB: 'Fase 3', severity: 'Fase-Fase 220V' },
        { a: 'f1', b: 'n',  nameA: 'Fase 1', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
        { a: 'f2', b: 'n',  nameA: 'Fase 2', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
        { a: 'f3', b: 'n',  nameA: 'Fase 3', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
        { a: 'f1', b: 'pe', nameA: 'Fase 1', nameB: 'Terra (PE)', severity: 'Fase-Terra' },
        { a: 'f2', b: 'pe', nameA: 'Fase 2', nameB: 'Terra (PE)', severity: 'Fase-Terra' },
        { a: 'f3', b: 'pe', nameA: 'Fase 3', nameB: 'Terra (PE)', severity: 'Fase-Terra' }
      ];

      shortTests.forEach(test => {
        for (let node of nets[test.a]) {
          if (nets[test.b].has(node)) {
            report.hasShort = true;
            report.shorts.push(`🔥 Curto-Circuito: ${test.nameA} encostou no(a) ${test.nameB}!`);
            wires.forEach(w => {
              const kA = `${w.a.pid}:${w.a.idx}`;
              const kB = `${w.b.pid}:${w.b.idx}`;
              if (kA === node || kB === node || (nets[test.a].has(kA) && nets[test.b].has(kB))) {
                report.shortedWires.add(w.id);
              }
            });
          }
        }
      });

      if (report.hasShort) {
        sound.playShortCircuit();
        parts.forEach(p => {
          if (['breaker1', 'breaker2', 'breaker3', 'rcd2', 'rcd4'].includes(p.kind) && p.props?.isOn && !p.props?.tripped) {
            p.props.isOn = false;
            p.props.tripped = true;
            report.trippedBreakers.push(p.id);
            sound.playTrip();
          }
        });
        return report;
      }

      parts.forEach(p => this.evaluateLoad(p, nets, report, wires));

      wires.forEach(w => {
        const kA = `${w.a.pid}:${w.a.idx}`;
        const kB = `${w.b.pid}:${w.b.idx}`;
        const hasF1 = nets.f1.has(kA) || nets.f1.has(kB);
        const hasF2 = nets.f2.has(kA) || nets.f2.has(kB);
        const hasF3 = nets.f3.has(kA) || nets.f3.has(kB);
        const hasN  = nets.n.has(kA)  || nets.n.has(kB);
        const hasPE = nets.pe.has(kA) || nets.pe.has(kB);
        const isLive = hasF1 || hasF2 || hasF3;

        report.liveWires.set(w.id, { isLive, hasF1, hasF2, hasF3, hasN, hasPE });

        if (hasN && w.color !== 'n') {
          report.compliance.push(`Norma NBR 5410: Condutor de Neutro deve ter isolação exclusivamente Azul Claro (utilizado: ${w.color}).`);
        }
        if (hasPE && w.color !== 'pe') {
          report.compliance.push(`Norma NBR 5410: Condutor de Proteção (PE) deve ter isolação Verde/Verde-Amarelo (utilizado: ${w.color}).`);
        }
        if ((hasF1 || hasF2 || hasF3) && (w.color === 'pe' || w.color === 'n')) {
          report.compliance.push(`Norma NBR 5410: Proibido utilizar condutores Azul ou Verde para condução de FASE!`);
        }
      });

      return report;
    }

    getInternalConductionPairs(p) {
      const pairs = [];
      const props = p.props || {};
      if (props.tripped) return pairs;

      switch (p.kind) {
        case 'breaker1':
          if (props.isOn) pairs.push([0, 1]);
          break;
        case 'breaker2':
          if (props.isOn) { pairs.push([0, 2]); pairs.push([1, 3]); }
          break;
        case 'breaker3':
          if (props.isOn) { pairs.push([0, 3]); pairs.push([1, 4]); pairs.push([2, 5]); }
          break;
        case 'rcd2':
          if (props.isOn) { pairs.push([0, 2]); pairs.push([1, 3]); }
          break;
        case 'rcd4':
          if (props.isOn) { pairs.push([0, 4]); pairs.push([1, 5]); pairs.push([2, 6]); pairs.push([3, 7]); }
          break;
        case 'neutral_bus':
        case 'earth_bus':
        case 'comb_1p':
        case 'wire_junction':
          if (p.terms && p.terms.length > 1) {
            for (let i = 0; i < p.terms.length - 1; i++) pairs.push([i, i + 1]);
          }
          break;
        case 'comb_2p':
          // Pinos 0, 2, 4 conduzem entre si (L1); Pinos 1, 3, 5 conduzem entre si (L2)
          pairs.push([0, 2]); pairs.push([2, 4]);
          pairs.push([1, 3]); pairs.push([3, 5]);
          break;
        case 'comb_3p':
          // Pinos 0, 3 conduzem entre si (L1); Pinos 1, 4 (L2); Pinos 2, 5 (L3)
          pairs.push([0, 3]);
          pairs.push([1, 4]);
          pairs.push([2, 5]);
          break;
        case 'switch_simple':
          if (props.isOn) pairs.push([0, 1]);
          break;
        case 'switch_double':
          if (props.key1On) pairs.push([0, 1]);
          if (props.key2On) pairs.push([2, 3]);
          break;
        case 'switch_parallel':
          if (props.position === 1) pairs.push([0, 1]);
          else pairs.push([0, 2]);
          break;
        case 'switch_intermediate':
          if (!props.crossed) { pairs.push([0, 2]); pairs.push([1, 3]); }
          else { pairs.push([0, 3]); pairs.push([1, 2]); }
          break;
        default:
          break;
      }
      return pairs;
    }

    evaluateLoad(p, nets, report, wires = []) {
      const props = p.props || {};
      const hasTerm = (termId, netName) => {
        const t = p.terms.find(item => item.id === termId);
        if (!t) return false;
        return nets[netName].has(`${p.id}:${t.idx}`);
      };

      const checkWireDimensioning = (partId, current, isLighting = false) => {
        const dim = getCableDimensioning(current, isLighting);
        wires.forEach(w => {
          if (w.a.pid === partId || w.b.pid === partId) {
            const wireGauge = parseFloat(w.gauge) || 2.5;
            if (wireGauge < dim.gauge) {
              report.overloadedWires.add(w.id);
              const maxA = NBR5410_GAUGES.find(g => g.gauge === wireGauge)?.maxAmps || 15.5;
              report.warnings.push(`🚨 RISCO DE SOBREAQUECIMENTO: Carga "${p.shortName || p.name}" consome ${current.toFixed(1)}A, mas o cabo #${w.id} (${w.gauge} mm²) suporta no máximo ${maxA}A! Bitola mínima NBR 5410: ${dim.gauge} mm² (Disjuntor C${dim.breaker}A).`);
            }
          }
        });
        return dim;
      };

      if (p.kind === 'lamp_led') {
        const retLive = hasTerm('ret', 'f1') || hasTerm('ret', 'f2') || hasTerm('ret', 'f3');
        const hasN = hasTerm('n', 'n');
        const isPowered = retLive && hasN;
        props.isLit = isPowered;
        if (isPowered) {
          const power = props.watts || 15;
          const current = power / (this.systemVoltage === 127 ? 127 : 220);
          report.totalPower += power;
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, true);
          report.loads.push({ name: `Lâmpada LED (${p.id})`, power, current, voltage: this.systemVoltage === 127 ? 127 : 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      } else if (p.kind === 'socket_tug') {
        const hasF = hasTerm('f', 'f1') || hasTerm('f', 'f2') || hasTerm('f', 'f3');
        const hasN = hasTerm('n', 'n');
        const hasPE = hasTerm('pe', 'pe');
        const isPowered = hasF && hasN;
        props.isPowered = isPowered;
        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Tomada TUG (${p.id}) ligada sem condutor de proteção (Terra PE).`);
        }
        if (isPowered) {
          const power = props.watts || 100;
          const current = power / (this.systemVoltage === 127 ? 127 : 220);
          report.totalPower += power;
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, false);
          report.loads.push({ name: `Tomada TUG 10A (${p.id})`, power, current, voltage: this.systemVoltage === 127 ? 127 : 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      } else if (p.kind === 'socket_tue') {
        const hasF1 = hasTerm('f1', 'f1') || hasTerm('f1', 'f2') || hasTerm('f1', 'f3');
        const hasF2 = hasTerm('f2', 'f1') || hasTerm('f2', 'f2') || hasTerm('f2', 'f3') || hasTerm('f2', 'n');
        const hasPE = hasTerm('pe', 'pe');
        const isPowered = hasF1 && hasF2;
        props.isPowered = isPowered;
        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Tomada TUE 20A (${p.id}) ligada sem condutor de proteção (Terra PE).`);
        }
        if (isPowered) {
          const power = props.watts || 1500;
          const current = power / 220;
          report.totalPower += power;
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, false);
          report.loads.push({ name: `Tomada TUE 20A (${p.id})`, power, current, voltage: 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      } else if (p.kind === 'shower') {
        const hasF1 = hasTerm('f1', 'f1') || hasTerm('f1', 'f2') || hasTerm('f1', 'f3');
        const hasF2 = hasTerm('f2', 'f1') || hasTerm('f2', 'f2') || hasTerm('f2', 'f3') || hasTerm('f2', 'n');
        const hasPE = hasTerm('pe', 'pe');
        const isPowered = hasF1 && hasF2;
        props.isRunning = isPowered && props.mode !== 'desligado';
        if (isPowered && !hasPE) {
          report.warnings.push(`🚨 CRÍTICO: Chuveiro ligado SEM condutor de aterramento (PE)!`);
        }
        if (props.isRunning) {
          const power = props.mode === 'inverno' ? (props.watts || 6800) : Math.round((props.watts || 6800) * 0.47);
          const current = power / 220;
          report.totalPower += power;
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, false);
          report.loads.push({ name: `Chuveiro Elétrico (${props.mode})`, power, current, voltage: 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      } else if (p.kind === 'fan') {
        const motLive = hasTerm('ret_mot', 'f1') || hasTerm('ret_mot', 'f2') || hasTerm('ret_mot', 'f3');
        const luzLive = hasTerm('ret_luz', 'f1') || hasTerm('ret_luz', 'f2') || hasTerm('ret_luz', 'f3');
        const hasN = hasTerm('n', 'n');
        props.fanOn = motLive && hasN;
        props.lightOn = luzLive && hasN;
        let power = 0;
        if (props.fanOn) power += 80;
        if (props.lightOn) power += 50;
        if (power > 0) {
          report.totalPower += power;
          const current = power / (this.systemVoltage === 127 ? 127 : 220);
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, true);
          report.loads.push({ name: 'Ventilador de Teto', power, current, voltage: this.systemVoltage === 127 ? 127 : 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      } else if (p.kind === 'motor') {
        const hasF = hasTerm('f', 'f1') || hasTerm('f', 'f2') || hasTerm('f', 'f3');
        const hasN = hasTerm('n', 'n');
        const hasPE = hasTerm('pe', 'pe');
        const isPowered = hasF && hasN;
        props.isRunning = isPowered;
        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Motor elétrico (${p.id}) ligado sem aterramento de proteção (PE).`);
        }
        if (isPowered) {
          const power = props.watts || 550;
          const current = power / (this.systemVoltage === 127 ? 127 : 220);
          report.totalPower += power;
          report.totalCurrent += current;
          const dim = checkWireDimensioning(p.id, current, false);
          report.loads.push({ name: `Motor / Bomba D'água (${props.hp || '1/2 CV'})`, power, current, voltage: this.systemVoltage === 127 ? 127 : 220, minGauge: dim.gauge, breaker: dim.breaker });
        }
      }
    }

    measure(probeBlack, probeRed, report) {
      if (!report || !report.active || !probeBlack || !probeRed) {
        return { mode: 'floating', text: '0.0 V~' };
      }
      const netsBlack = report.terminalPotentials.get(`${probeBlack.pid}:${probeBlack.tidx}`) || new Set();
      const netsRed   = report.terminalPotentials.get(`${probeRed.pid}:${probeRed.tidx}`) || new Set();

      const bPhase = netsBlack.has('f1') || netsBlack.has('f2') || netsBlack.has('f3');
      const rPhase = netsRed.has('f1')   || netsRed.has('f2')   || netsRed.has('f3');

      if (bPhase && rPhase) {
        if ((netsBlack.has('f1') && netsRed.has('f2')) || (netsBlack.has('f2') && netsRed.has('f1'))) {
          return { mode: 'voltage', text: '220.0 V~', type: 'Fase - Fase (220V)' };
        }
        return { mode: 'voltage', text: '0.0 V~', type: 'Mesma Fase' };
      }
      if ((bPhase && netsRed.has('n')) || (rPhase && netsBlack.has('n'))) {
        const v = this.systemVoltage === 127 ? 127 : 220;
        return { mode: 'voltage', text: `${v}.0 V~`, type: 'Fase - Neutro' };
      }
      if ((bPhase && netsRed.has('pe')) || (rPhase && netsBlack.has('pe'))) {
        const v = this.systemVoltage === 127 ? 127 : 220;
        return { mode: 'voltage', text: `${v}.0 V~`, type: 'Fase - Terra' };
      }
      let connected = false;
      for (let n of netsBlack) {
        if (netsRed.has(n)) { connected = true; break; }
      }
      if (connected && netsBlack.size > 0) {
        return { mode: 'continuity', text: '0.1 Ω', type: 'Continuidade OK' };
      }
      return { mode: 'voltage', text: '0.0 V~', type: 'Sem Tensão' };
    }
  }

  // ==========================================================
  // 4. MOTOR CAD VETORIAL & INTERAÇÃO (SVG)
  // ==========================================================
  const NS = 'http://www.w3.org/2000/svg';

  class CadEngine {
    constructor(svgElement, options = {}) {
      this.svg = svgElement;
      this.options = options;
      this.parts = [];
      this.wires = [];
      this.nextPartId = 1;
      this.nextWireId = 1;

      this.viewBox = { x: 0, y: 0, w: 1400, h: 900 };
      this.isPanning = false;
      this.panStart = { x: 0, y: 0 };
      this.gridSize = 20;

      this.selected = null;
      this.draggingPart = null;
      this.drawingWire = null;
      this.activeWireColor = 'f1';
      this.activeWireGauge = '2.5';

      this.undoStack = [];
      this.redoStack = [];

      this.multimeterActive = false;
      this.probeBlack = null;
      this.probeRed = null;
      this.draggingProbe = null;
      this.lastSimulationReport = null;
      this.showEnclosure = true;

      this.onSelectionChange = options.onSelectionChange || (() => {});
      this.onTopologyChange = options.onTopologyChange || (() => {});
      this.onCursorMove = options.onCursorMove || (() => {});

      this.initDOM();
      this.initEvents();
    }

    initDOM() {
      this.svg.innerHTML = `
        <defs>
          <!-- Grades Técnicas -->
          <pattern id="cad-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.2" fill="#94a3b8" opacity="0.35"/>
          </pattern>
          <pattern id="cad-grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#cad-grid-small)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#64748b" stroke-width="0.8" opacity="0.25"/>
          </pattern>

          <!-- Gradiente do Corpo dos Disjuntores DIN (Cinza Industrial Biselado) -->
          <linearGradient id="breaker-casing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="10%" stop-color="#f8fafc"/>
            <stop offset="85%" stop-color="#f1f5f9"/>
            <stop offset="100%" stop-color="#cbd5e1"/>
          </linearGradient>

          <linearGradient id="breaker-front-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>

          <!-- Trilho DIN de Aço Zincado com Perfurações -->
          <linearGradient id="din-rail-steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="12%" stop-color="#f8fafc"/>
            <stop offset="50%" stop-color="#cbd5e1"/>
            <stop offset="85%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>

          <linearGradient id="din-rail-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="25%" stop-color="#e2e8f0"/>
            <stop offset="50%" stop-color="#f8fafc"/>
            <stop offset="75%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>

          <!-- Manopla Basculante Ergonômica dos Disjuntores -->
          <linearGradient id="lever-black" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="35%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#090d14"/>
          </linearGradient>

          <!-- Manopla e Botão Vermelho Vivo do DR (Padrão Foto) -->
          <linearGradient id="lever-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="35%" stop-color="#ef4444"/>
            <stop offset="75%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>

          <!-- Corpo Vermelho do DPS (Padrão Clamper / Steck) -->
          <linearGradient id="dps-red-casing" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="25%" stop-color="#dc2626"/>
            <stop offset="75%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>

          <!-- Cartucho Vermelho Frontal do DPS -->
          <linearGradient id="dps-red-cartridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="20%" stop-color="#ef4444"/>
            <stop offset="65%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>

          <!-- Parafuso Metálico em Aço e Latão -->
          <radialGradient id="screw-steel" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="45%" stop-color="#cbd5e1"/>
            <stop offset="80%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#334155"/>
          </radialGradient>

          <radialGradient id="screw-brass" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="45%" stop-color="#eab308"/>
            <stop offset="80%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#713f12"/>
          </radialGradient>

          <!-- Barramento de Cobre / Latão Maciço -->
          <linearGradient id="bus-copper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="20%" stop-color="#facc15"/>
            <stop offset="60%" stop-color="#ca8a04"/>
            <stop offset="90%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>

          <!-- Placa de Espelho Residencial 4x2 (Branco Acetinado com Relevo) -->
          <linearGradient id="wall-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="8%" stop-color="#f8fafc"/>
            <stop offset="92%" stop-color="#f1f5f9"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>

          <!-- Tubo Cromado e Acabamentos Metálicos -->
          <linearGradient id="chrome-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="30%" stop-color="#cbd5e1"/>
            <stop offset="50%" stop-color="#f8fafc"/>
            <stop offset="80%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>

          <!-- Corpo do Chuveiro e Motores -->
          <linearGradient id="shower-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="25%" stop-color="#ffffff"/>
            <stop offset="70%" stop-color="#f8fafc"/>
            <stop offset="100%" stop-color="#cbd5e1"/>
          </linearGradient>

          <linearGradient id="motor-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6"/>
            <stop offset="40%" stop-color="#1d4ed8"/>
            <stop offset="80%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>

          <!-- Lâmpada Acesa / Halos de Luz -->
          <radialGradient id="lamp-lit-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="35%" stop-color="#fef9c3"/>
            <stop offset="70%" stop-color="#fde047"/>
            <stop offset="90%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </radialGradient>

          <filter id="cad-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#020617" flood-opacity="0.35"/>
          </filter>

          <filter id="lamp-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect id="cad-bg" width="100%" height="100%" fill="#0b1017"/>
        <rect id="cad-grid-bg" width="100%" height="100%" fill="url(#cad-grid-large)"/>
        <g id="viewport-group">
          <g id="enclosure-layer"></g>
          <g id="wires-layer"></g>
          <path id="cad-temp-wire" d="" fill="none" stroke="#facc15" stroke-width="5" stroke-dasharray="6 6" stroke-linecap="round" style="display: none; pointer-events: none; filter: drop-shadow(0 0 6px #eab308);"/>
          <g id="parts-layer"></g>
          <g id="overlay-layer"></g>
          <g id="probes-layer"></g>
        </g>
      `;

      this.enclosureLayer = this.svg.querySelector('#enclosure-layer');
      this.wiresLayer = this.svg.querySelector('#wires-layer');
      this.partsLayer = this.svg.querySelector('#parts-layer');
      this.overlayLayer = this.svg.querySelector('#overlay-layer');
      this.probesLayer = this.svg.querySelector('#probes-layer');
      this.updateViewBox();
    }

    updateViewBox() {
      this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
    }

    el(tag, attrs = {}, text = '') {
      const elem = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => elem.setAttribute(k, v));
      if (text) elem.textContent = text;
      return elem;
    }

    snap(val) {
      return Math.round(val / this.gridSize) * this.gridSize;
    }

    clientToSvg(e) {
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    }

    saveHistory() {
      const snap = {
        parts: JSON.parse(JSON.stringify(this.parts)),
        wires: JSON.parse(JSON.stringify(this.wires)),
        nextPartId: this.nextPartId,
        nextWireId: this.nextWireId
      };
      this.undoStack.push(snap);
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = [];
    }

    undo() {
      if (this.undoStack.length === 0) return;
      this.redoStack.push({
        parts: JSON.parse(JSON.stringify(this.parts)),
        wires: JSON.parse(JSON.stringify(this.wires)),
        nextPartId: this.nextPartId,
        nextWireId: this.nextWireId
      });
      const prev = this.undoStack.pop();
      this.parts = prev.parts;
      this.wires = prev.wires;
      this.nextPartId = prev.nextPartId;
      this.nextWireId = prev.nextWireId;
      this.selected = null;
      this.render();
      this.onTopologyChange();
    }

    redo() {
      if (this.redoStack.length === 0) return;
      this.undoStack.push({
        parts: JSON.parse(JSON.stringify(this.parts)),
        wires: JSON.parse(JSON.stringify(this.wires)),
        nextPartId: this.nextPartId,
        nextWireId: this.nextWireId
      });
      const next = this.redoStack.pop();
      this.parts = next.parts;
      this.wires = next.wires;
      this.nextPartId = next.nextPartId;
      this.nextWireId = next.nextWireId;
      this.selected = null;
      this.render();
      this.onTopologyChange();
    }

    addPart(kind, customProps = {}) {
      const def = COMPONENT_DEFINITIONS[kind];
      if (!def) return;

      this.saveHistory();
      const cx = this.viewBox.x + this.viewBox.w * 0.45;
      const cy = this.viewBox.y + this.viewBox.h * 0.45;
      const x = this.snap(cx + (this.parts.length % 5) * 20);
      const y = this.snap(cy + (this.parts.length % 4) * 20);

      const newPart = {
        id: this.nextPartId++,
        kind,
        name: def.name,
        shortName: def.shortName,
        x, y,
        orientation: 'vertical',
        props: { ...def.defaultProps, ...customProps },
        terms: []
      };

      this.updatePartGeometry(newPart);
      this.parts.push(newPart);
      this.selected = { type: 'part', id: newPart.id };

      sound.playClick();
      this.render();
      this.onTopologyChange();
      this.onSelectionChange(newPart);
    }

    updatePartGeometry(p) {
      const def = COMPONENT_DEFINITIONS[p.kind];
      if (!def) return;

      let baseTerms = def.terms;
      if (p.kind === 'switch_parallel' && p.props?.inverted) {
        baseTerms = [
          { id: 'com', label: 'Comum (Retorno/Lâmpada)', type: 'ret', x: 90, y: 40 },
          { id: 'p1',  label: 'Paralelo 1', type: 'ret2', x: 0, y: 25 },
          { id: 'p2',  label: 'Paralelo 2', type: 'ret2', x: 0, y: 55 }
        ];
      }

      if (p.orientation === 'horizontal') {
        p.terms = baseTerms.map((t, idx) => ({
          id: t.id, label: t.label, type: t.type, idx, x: t.y, y: t.x
        }));
        p.w = def.h;
        p.h = def.w;
      } else {
        p.terms = baseTerms.map((t, idx) => ({
          id: t.id, label: t.label, type: t.type, idx, x: t.x, y: t.y
        }));
        p.w = def.w;
        p.h = def.h;
      }
    }

    rotateSelected() {
      if (!this.selected || this.selected.type !== 'part') return;
      const p = this.parts.find(item => item.id === this.selected.id);
      if (!p) return;

      this.saveHistory();
      p.orientation = p.orientation === 'vertical' ? 'horizontal' : 'vertical';
      this.updatePartGeometry(p);
      sound.playClick();
      this.render();
      this.onTopologyChange();
    }

    deleteSelected() {
      if (!this.selected) return;
      this.saveHistory();
      if (this.selected.type === 'part') {
        const pid = this.selected.id;
        this.parts = this.parts.filter(p => p.id !== pid);
        this.wires = this.wires.filter(w => w.a.pid !== pid && w.b.pid !== pid);
      } else if (this.selected.type === 'wire') {
        this.wires = this.wires.filter(w => w.id !== this.selected.id);
      }
      this.selected = null;
      sound.playClick();
      this.render();
      this.onTopologyChange();
      this.onSelectionChange(null);
    }

    duplicateSelected() {
      if (!this.selected || this.selected.type !== 'part') return;
      const p = this.parts.find(item => item.id === this.selected.id);
      if (!p) return;

      this.saveHistory();
      const cloned = {
        ...JSON.parse(JSON.stringify(p)),
        id: this.nextPartId++,
        x: p.x + 40,
        y: p.y + 40
      };
      this.parts.push(cloned);
      this.selected = { type: 'part', id: cloned.id };
      sound.playClick();
      this.render();
      this.onTopologyChange();
      this.onSelectionChange(cloned);
    }

    clearAll() {
      this.saveHistory();
      this.parts = [];
      this.wires = [];
      this.selected = null;
      this.render();
      this.onTopologyChange();
      this.onSelectionChange(null);
    }

    calcWirePath(pA, tA, pB, tB, points = []) {
      const ax = pA.x + tA.x, ay = pA.y + tA.y;
      const bx = pB.x + tB.x, by = pB.y + tB.y;
      let d = `M ${ax} ${ay} `;
      if (points && points.length > 0) {
        points.forEach(pt => { d += `L ${pt.x} ${pt.y} `; });
      }
      d += `L ${bx} ${by}`;
      return d;
    }

    spliceWireAt(targetWire, pt) {
      this.saveHistory();

      // 1. Cria o nó de emenda/derivação na coordenada clicada
      const junction = {
        id: this.nextPartId++,
        kind: 'wire_junction',
        name: 'Conector de Emenda / Derivação',
        shortName: 'EMENDA',
        x: pt.x - 16,
        y: pt.y - 16,
        orientation: 'vertical',
        props: { color: targetWire.color || (this.drawingWire ? this.drawingWire.color : 'f1') },
        terms: []
      };
      this.updatePartGeometry(junction);
      this.parts.push(junction);

      // 2. O fio original continua de targetWire.a até o nó de emenda (borne 4 - centro)
      const origB = { ...targetWire.b };
      targetWire.b = { pid: junction.id, idx: 4 };

      // 3. Cria a continuação do fio original: da emenda até o destino original B
      const continuationWire = {
        id: this.nextWireId++,
        a: { pid: junction.id, idx: 4 },
        b: origB,
        points: [],
        color: targetWire.color,
        gauge: targetWire.gauge
      };
      this.wires.push(continuationWire);

      // 4. Se havia um fio sendo puxado, conecta ele ao nó de emenda
      if (this.drawingWire) {
        const newBranchWire = {
          id: this.nextWireId++,
          a: { ...this.drawingWire.from },
          b: { pid: junction.id, idx: 4 },
          points: [...this.drawingWire.points],
          color: this.drawingWire.color || targetWire.color,
          gauge: this.drawingWire.gauge || targetWire.gauge
        };
        this.wires.push(newBranchWire);
        this.drawingWire = null;
        this.updateTempWirePreview();
      }

      this.selected = { type: 'part', id: junction.id };
      sound.playClick();
      this.render();
      this.onTopologyChange();
      this.onSelectionChange(junction);
    }

    updateTempWirePreview() {
      const tempWire = this.svg?.querySelector('#cad-temp-wire');
      if (!tempWire) return;
      if (!this.drawingWire) {
        tempWire.style.display = 'none';
        return;
      }
      const pA = this.parts.find(p => p.id === this.drawingWire.from.pid);
      if (!pA) {
        tempWire.style.display = 'none';
        return;
      }
      const tA = pA.terms[this.drawingWire.from.idx];
      if (!tA) {
        tempWire.style.display = 'none';
        return;
      }

      const colorMeta = WIRE_COLORS[this.drawingWire.color] || WIRE_COLORS.ret;
      const baseWidth = { '1.5': 4, '2.5': 5, '4.0': 6, '6.0': 7, '10.0': 9 }[this.drawingWire.gauge] || 5;

      const ax = pA.x + tA.x, ay = pA.y + tA.y;
      let d = `M ${ax} ${ay} `;
      if (this.drawingWire.points && this.drawingWire.points.length > 0) {
        this.drawingWire.points.forEach(pt => { d += `L ${pt.x} ${pt.y} `; });
      }
      const targetPos = this.currentMousePos || { x: ax, y: ay };
      d += `L ${targetPos.x} ${targetPos.y}`;

      tempWire.setAttribute('d', d);
      tempWire.setAttribute('stroke', colorMeta.hex);
      tempWire.setAttribute('stroke-width', baseWidth);
      tempWire.style.display = 'block';
    }

    renderEnclosure() {
      if (!this.enclosureLayer) return;
      const g = this.el('g', { id: 'cad-qdc-enclosure', class: 'enclosure-group' });

      // 1. Chapa Traseira do Quadro Metálico QDC (Cinza Industrial Acetinado com cantos arredondados)
      const qx = 60, qy = 40, qw = 860, qh = 820, rx = 36;

      // Sombra e Rebaixo Exterior
      g.appendChild(this.el('rect', {
        x: qx - 8, y: qy - 8, width: qw + 16, height: qh + 16, rx: rx + 4,
        fill: '#1e293b', stroke: '#0f172a', 'stroke-width': 2, opacity: '0.9', filter: 'url(#cad-shadow)'
      }));

      // Base do Quadro (Chapa de Fundo com tom da foto #c5c9d0)
      g.appendChild(this.el('rect', {
        x: qx, y: qy, width: qw, height: qh, rx: rx,
        fill: '#c6cad0', stroke: '#475569', 'stroke-width': 10
      }));

      // Friso interno com acabamento usinado
      g.appendChild(this.el('rect', {
        x: qx + 8, y: qy + 8, width: qw - 16, height: qh - 16, rx: rx - 6,
        fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: '0.45'
      }));

      // 4 Parafusos Estruturais Robustos dos Cantos com Arruela Rebaixada (Padrão da Foto)
      const cornerScrews = [
        { cx: qx + 42, cy: qy + 42 },
        { cx: qx + qw - 42, cy: qy + 42 },
        { cx: qx + 42, cy: qy + qh - 42 },
        { cx: qx + qw - 42, cy: qy + qh - 42 }
      ];

      cornerScrews.forEach(sc => {
        // Cavidade rebaixada (counterbore)
        g.appendChild(this.el('circle', {
          cx: sc.cx, cy: sc.cy, r: 16,
          fill: '#475569', stroke: '#1e293b', 'stroke-width': 2
        }));
        // Anel de arruela
        g.appendChild(this.el('circle', {
          cx: sc.cx, cy: sc.cy, r: 12,
          fill: '#64748b', stroke: '#334155', 'stroke-width': 1
        }));
        // Cabeça do parafuso em aço escovado
        g.appendChild(this.el('circle', {
          cx: sc.cx, cy: sc.cy, r: 8.5,
          fill: 'url(#screw-steel)', stroke: '#1e293b', 'stroke-width': 1
        }));
        // Fenda Phillips profunda
        g.appendChild(this.el('line', {
          x1: sc.cx - 5.5, y1: sc.cy, x2: sc.cx + 5.5, y2: sc.cy,
          stroke: '#0f172a', 'stroke-width': 2.2
        }));
        g.appendChild(this.el('line', {
          x1: sc.cx, y1: sc.cy - 5.5, x2: sc.cx, y2: sc.cy + 5.5,
          stroke: '#0f172a', 'stroke-width': 2.2
        }));
      });

      // 2. Três Trilhos DIN 35mm Perfurados em Aço Zincado (Idênticos aos da foto)
      const dinRails = [
        { y: 155, label: 'Trilho Superior (Entrada / DPS / DR Geral)' },
        { y: 365, label: 'Trilho Intermediário (Circuitos Terminais)' },
        { y: 575, label: 'Trilho Inferior (Cargas Especiais / DRs)' }
      ];

      const railX = qx + 35;
      const railW = qw - 70;
      const railH = 38;

      dinRails.forEach((rail) => {
        const ry = rail.y;

        // Base do Trilho DIN Perfurado
        g.appendChild(this.el('rect', {
          x: railX, y: ry, width: railW, height: railH, rx: 2,
          fill: 'url(#din-rail-steel)', stroke: '#475569', 'stroke-width': 1.5,
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))'
        }));

        // Borda superior em relevo (reflexo cromado)
        g.appendChild(this.el('line', {
          x1: railX + 2, y1: ry + 3, x2: railX + railW - 2, y2: ry + 3,
          stroke: '#ffffff', 'stroke-width': 1.2, opacity: '0.8'
        }));

        // Canal central rebaixado
        g.appendChild(this.el('rect', {
          x: railX + 4, y: ry + 12, width: railW - 8, height: 14, rx: 1,
          fill: '#94a3b8', stroke: '#475569', 'stroke-width': 0.8
        }));

        // Borda inferior com sombra
        g.appendChild(this.el('line', {
          x1: railX + 2, y1: ry + railH - 2, x2: railX + railW - 2, y2: ry + railH - 2,
          stroke: '#334155', 'stroke-width': 1.5, opacity: '0.9'
        }));

        // Furos / Oblongos ovais perfurados de fixação a cada 38px
        for (let hx = railX + 26; hx < railX + railW - 26; hx += 38) {
          g.appendChild(this.el('rect', {
            x: hx - 8, y: ry + 15, width: 16, height: 8, rx: 4,
            fill: '#334155', stroke: '#0f172a', 'stroke-width': 0.8
          }));
        }

        // Presilhas / Batentes finais pretos (Postes de ancoragem DIN) nas pontas esquerda e direita
        // Esquerda
        g.appendChild(this.el('path', {
          d: `M ${railX - 10} ${ry - 12} L ${railX + 16} ${ry - 12} L ${railX + 16} ${ry + railH + 12} L ${railX - 10} ${ry + railH + 12} Z`,
          fill: '#1e293b', stroke: '#0f172a', 'stroke-width': 1.5, rx: 2
        }));
        g.appendChild(this.el('rect', {
          x: railX - 4, y: ry + 10, width: 12, height: 18, rx: 2,
          fill: '#475569', stroke: '#0f172a', 'stroke-width': 1
        }));

        // Direita
        g.appendChild(this.el('path', {
          d: `M ${railX + railW - 16} ${ry - 12} L ${railX + railW + 10} ${ry - 12} L ${railX + railW + 10} ${ry + railH + 12} L ${railX + railW - 16} ${ry + railH + 12} Z`,
          fill: '#1e293b', stroke: '#0f172a', 'stroke-width': 1.5, rx: 2
        }));
        g.appendChild(this.el('rect', {
          x: railX + railW - 8, y: ry + 10, width: 12, height: 18, rx: 2,
          fill: '#475569', stroke: '#0f172a', 'stroke-width': 1
        }));
      });

      this.enclosureLayer.appendChild(g);
    }

    render(simulationReport = null) {
      if (simulationReport !== null) {
        this.lastSimulationReport = simulationReport;
      } else {
        simulationReport = this.lastSimulationReport;
      }

      if (this.enclosureLayer) {
        this.enclosureLayer.innerHTML = '';
        if (this.showEnclosure) {
          this.renderEnclosure();
        }
      }

      this.wiresLayer.innerHTML = '';
      this.partsLayer.innerHTML = '';
      this.overlayLayer.innerHTML = '';

      // 1. Fios
      this.wires.forEach(w => {
        const pA = this.parts.find(p => p.id === w.a.pid);
        const pB = this.parts.find(p => p.id === w.b.pid);
        if (!pA || !pB) return;
        const tA = pA.terms[w.a.idx];
        const tB = pB.terms[w.b.idx];
        if (!tA || !tB) return;

        const pathData = this.calcWirePath(pA, tA, pB, tB, w.points);
        const isSelected = this.selected?.type === 'wire' && this.selected.id === w.id;
        const isShorted = simulationReport?.shortedWires?.has(w.id);
        const isOverloaded = simulationReport?.overloadedWires?.has(w.id);

        const colorMeta = WIRE_COLORS[w.color] || WIRE_COLORS.ret;
        const baseWidth = { '1.5': 4, '2.5': 5, '4.0': 6, '6.0': 7, '10.0': 9 }[w.gauge] || 5;

        const wireElem = this.el('path', {
          d: pathData,
          class: `cad-wire ${isSelected ? 'selected' : ''} ${isShorted ? 'short-circuit' : ''} ${isOverloaded ? 'overload' : ''}`,
          stroke: isOverloaded ? '#f97316' : colorMeta.hex,
          'stroke-width': baseWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          fill: 'none'
        });

        if (this.drawingWire) {
          wireElem.style.cursor = 'crosshair';
          wireElem.setAttribute('title', '⚡ Clique para fazer Interseção / Emenda neste cabo');
        }

        wireElem.addEventListener('pointerdown', e => {
          if (e.button !== 0) return;
          e.stopPropagation();

          if (this.drawingWire) {
            const cur = this.clientToSvg(e);
            this.spliceWireAt(w, { x: this.snap(cur.x), y: this.snap(cur.y) });
            return;
          }

          this.selected = { type: 'wire', id: w.id };
          this.render();
          this.onSelectionChange(w);
        });

        this.wiresLayer.appendChild(wireElem);

        if (simulationReport?.active && !simulationReport.hasShort) {
          const wireStatus = simulationReport.liveWires?.get(w.id);
          if (wireStatus?.isLive) {
            const energy = this.el('path', {
              d: pathData,
              class: 'cad-energy-overlay active',
              fill: 'none',
              stroke: '#fef08a',
              'stroke-width': 2.5,
              'stroke-linecap': 'round',
              'stroke-dasharray': '8 16'
            });
            this.wiresLayer.appendChild(energy);
          }
        }
      });

      // 2. Componentes 2D Realistas
      this.parts.forEach(p => {
        const isSelected = this.selected?.type === 'part' && this.selected.id === p.id;
        const g = this.el('g', {
          class: `cad-part ${isSelected ? 'selected' : ''}`,
          transform: `translate(${p.x}, ${p.y})`
        });

        // Renderiza o corpo realista de acordo com a categoria do componente
        this.renderRealisticComponent(p, g, p.w, p.h, isSelected, simulationReport);

        // Terminais de Conexão com Parafusos Realistas
        p.terms.forEach(t => {
          const termGrp = this.el('g', { class: 'cad-terminal' });

          // Berço metálico do borne
          termGrp.appendChild(this.el('rect', {
            x: t.x - 7, y: t.y - 7, width: 14, height: 14, rx: 3,
            fill: '#1e293b', stroke: '#475569', 'stroke-width': 1
          }));

          // Parafuso metálico realista (Aço ou Latão com fenda cruzada)
          const isBrass = t.type === 'f1' || t.type === 'f2' || t.type === 'f3';
          const screw = this.el('circle', {
            cx: t.x, cy: t.y, r: 5,
            fill: isBrass ? 'url(#screw-brass)' : 'url(#screw-steel)',
            stroke: '#0f172a', 'stroke-width': 0.8
          });
          termGrp.appendChild(screw);

          // Fenda cruzada do parafuso (Phillips)
          termGrp.appendChild(this.el('line', {
            x1: t.x - 3, y1: t.y, x2: t.x + 3, y2: t.y,
            stroke: '#0f172a', 'stroke-width': 1.2, 'pointer-events': 'none'
          }));
          termGrp.appendChild(this.el('line', {
            x1: t.x, y1: t.y - 3, x2: t.x, y2: t.y + 3,
            stroke: '#0f172a', 'stroke-width': 1.2, 'pointer-events': 'none'
          }));

          // Anel colorido indicando a norma do borne
          const normRing = this.el('circle', {
            cx: t.x, cy: t.y, r: 7.5,
            fill: 'none',
            stroke: WIRE_COLORS[t.type]?.hex || '#94a3b8',
            'stroke-width': 1.8,
            'stroke-dasharray': '3 2',
            'pointer-events': 'none'
          });
          termGrp.appendChild(normRing);

          // Hitbox transparente ampliada para facilitar a fiação e snap
          const hitbox = this.el('circle', {
            cx: t.x, cy: t.y, r: 18,
            fill: 'rgba(56, 189, 248, 0.001)',
            'pointer-events': 'all',
            class: 'cad-term-hitbox',
            style: 'cursor: crosshair;'
          });
          hitbox.appendChild(this.el('title', {}, `${t.label} (${t.type.toUpperCase()})`));

          hitbox.addEventListener('pointerenter', () => {
            if (this.drawingWire) {
              if (this.drawingWire.from.pid === p.id && this.drawingWire.from.idx === t.idx) {
                screw.setAttribute('stroke', '#ef4444');
                screw.setAttribute('stroke-width', '2.5');
              } else {
                screw.setAttribute('stroke', '#10b981');
                screw.setAttribute('stroke-width', '3');
                normRing.setAttribute('stroke', '#10b981');
                normRing.setAttribute('stroke-width', '3.5');
              }
            } else {
              screw.setAttribute('stroke', '#fbbf24');
              screw.setAttribute('stroke-width', '2.5');
              normRing.setAttribute('stroke-width', '3');
            }
          });

          hitbox.addEventListener('pointerleave', () => {
            screw.setAttribute('stroke', '#0f172a');
            screw.setAttribute('stroke-width', '0.8');
            normRing.setAttribute('stroke', WIRE_COLORS[t.type]?.hex || '#94a3b8');
            normRing.setAttribute('stroke-width', '1.8');
          });

          hitbox.addEventListener('pointerdown', ev => {
            if (ev.button !== 0) return;
            ev.preventDefault();
            ev.stopPropagation();

            if (this.multimeterActive && this.draggingProbe) {
              if (this.draggingProbe === 'black') {
                this.probeBlack = { pid: p.id, tidx: t.idx, x: p.x + t.x, y: p.y + t.y };
              } else {
                this.probeRed = { pid: p.id, tidx: t.idx, x: p.x + t.x, y: p.y + t.y };
              }
              this.draggingProbe = null;
              sound.playClick();
              this.render();
              this.onTopologyChange();
              return;
            }

            if (!this.drawingWire) {
              // Copia automaticamente a cor do borne clicado para o condutor ativo
              let adoptedColor = this.activeWireColor;
              if (t.type && WIRE_COLORS[t.type]) {
                adoptedColor = t.type;
                this.activeWireColor = adoptedColor;
                const colorSelect = document.getElementById('wire-color-select');
                if (colorSelect) colorSelect.value = adoptedColor;
              }

              this.drawingWire = {
                from: { pid: p.id, idx: t.idx },
                points: [],
                color: adoptedColor,
                gauge: this.activeWireGauge
              };
              sound.playClick();
              this.updateTempWirePreview();
            } else {
              if (this.drawingWire.from.pid === p.id && this.drawingWire.from.idx === t.idx) {
                this.drawingWire = null;
                this.updateTempWirePreview();
                this.render();
              } else {
                this.saveHistory();
                this.wires.push({
                  id: this.nextWireId++,
                  a: this.drawingWire.from,
                  b: { pid: p.id, idx: t.idx },
                  points: [...this.drawingWire.points],
                  color: this.drawingWire.color,
                  gauge: this.drawingWire.gauge
                });
                this.drawingWire = null;
                this.updateTempWirePreview();
                sound.playClick();
                this.render();
                this.onTopologyChange();
              }
            }
          });

          termGrp.appendChild(hitbox);
          g.appendChild(termGrp);
        });

        g.addEventListener('pointerdown', ev => {
          if (ev.target.classList.contains('cad-term-hitbox') || ev.target.classList.contains('cad-actionable')) return;
          if (ev.button !== 0) return;
          ev.stopPropagation();

          this.selected = { type: 'part', id: p.id };
          const cur = this.clientToSvg(ev);
          this.draggingPart = { id: p.id, dx: cur.x - p.x, dy: cur.y - p.y };
          this.render(simulationReport);
          this.onSelectionChange(p);
        });

        this.partsLayer.appendChild(g);
      });
    }

    // ==========================================================
    // RENDERIZADOR ESPECÍFICO DE COMPONENTES ULTRA-REALISTAS 2D
    // ==========================================================
    renderRealisticComponent(p, g, w, h, isSelected, simulationReport) {
      const props = p.props || {};

      // 1. DISJUNTORES TERMOMAGNÉTICOS (1P, 2P, 3P)
      if (['breaker1', 'breaker2', 'breaker3'].includes(p.kind)) {
        this.renderBreaker(p, g, w, h, isSelected, props);
      }
      // 2. DISPOSITIVOS DR (IDR 2P e 4P)
      else if (['rcd2', 'rcd4'].includes(p.kind)) {
        this.renderRCD(p, g, w, h, isSelected, props);
      }
      // 3. DPS CLASSE II (1P ou 3P)
      else if (p.kind === 'spd' || p.kind === 'spd3') {
        this.renderSPD(p, g, w, h, isSelected, props);
      }
      // 4. BARRAMENTOS DE NEUTRO E TERRA
      else if (p.kind === 'neutral_bus' || p.kind === 'earth_bus') {
        this.renderBusbar(p, g, w, h, isSelected);
      }
      // 4.5 BARRAMENTOS PENTE (1P, 2P, 3P)
      else if (['comb_1p', 'comb_2p', 'comb_3p'].includes(p.kind)) {
        this.renderCombBusbar(p, g, w, h, isSelected, props);
      }
      // 4.6 CONECTOR DE EMENDA / DERIVAÇÃO DE CABOS
      else if (p.kind === 'wire_junction') {
        this.renderWireJunction(p, g, w, h, isSelected, props);
      }
      // 5. PADRÕES DE ENTRADA (REDE MONO, BI, TRI)
      else if (p.kind.startsWith('source')) {
        this.renderSourceBox(p, g, w, h, isSelected);
      }
      // 6. INTERRUPTORES RESIDENCIAIS 4x2
      else if (p.kind === 'switch_simple' || p.kind === 'switch_parallel' || p.kind === 'switch_intermediate') {
        this.renderWallSwitch(p, g, w, h, isSelected, props);
      }
      else if (p.kind === 'switch_double') {
        this.renderDoubleSwitch(p, g, w, h, isSelected, props);
      }
      // 7. TOMADAS RESIDENCIAIS NBR 14136
      else if (p.kind === 'socket_tug' || p.kind === 'socket_tue') {
        this.renderWallSocket(p, g, w, h, isSelected, props, simulationReport);
      }
      // 8. LÂMPADA LED PLAFON
      else if (p.kind === 'lamp_led') {
        this.renderCeilingLamp(p, g, w, h, isSelected, props, simulationReport);
      }
      // 9. CHUVEIRO ELÉTRICO BRASILEIRO
      else if (p.kind === 'shower') {
        this.renderElectricShower(p, g, w, h, isSelected, props, simulationReport);
      }
      // 10. VENTILADOR DE TETO
      else if (p.kind === 'fan') {
        this.renderCeilingFan(p, g, w, h, isSelected, props, simulationReport);
      }
      // 11. MOTOR ELÉTRICO / BOMBA
      else if (p.kind === 'motor') {
        this.renderIndustrialMotor(p, g, w, h, isSelected, props, simulationReport);
      }
    }

    // --- DISJUNTOR DIN MODULAR REALISTA (PADRÃO STECK / SCHNEIDER / SIEMENS) ---
    renderBreaker(p, g, w, h, isSelected, props) {
      const numPoles = p.kind === 'breaker3' ? 3 : (p.kind === 'breaker2' ? 2 : 1);
      const poleW = w / numPoles;

      // Trilho DIN visível no fundo
      g.appendChild(this.el('rect', {
        x: -4, y: 16, width: w + 8, height: h - 32, rx: 3,
        fill: 'url(#din-rail-metal)', stroke: '#64748b', 'stroke-width': 1
      }));

      // Cada polo modular de 18mm
      for (let i = 0; i < numPoles; i++) {
        const px = i * poleW;

        // Corpo do módulo DIN
        g.appendChild(this.el('rect', {
          x: px, y: 0, width: poleW, height: h, rx: 5,
          fill: 'url(#breaker-casing)',
          stroke: isSelected ? '#38bdf8' : '#94a3b8',
          'stroke-width': isSelected ? 2 : 1.2,
          filter: 'url(#cad-shadow)'
        }));

        // Friso frontal rebaixado
        g.appendChild(this.el('rect', {
          x: px + 3, y: 18, width: poleW - 6, height: h - 36, rx: 3,
          fill: 'url(#breaker-front-plate)', stroke: '#cbd5e1', 'stroke-width': 0.8
        }));

        // Faixa azul superior característica da marca (Padrão Steck / Schneider / Siemens)
        g.appendChild(this.el('rect', {
          x: px + 4, y: 20, width: poleW - 8, height: 4.5, rx: 1,
          fill: '#0284c7'
        }));

        // Túnel do borne superior (cavidade do cabo)
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 8, y: 2, width: 16, height: 14, rx: 2,
          fill: '#0f172a', stroke: '#334155', 'stroke-width': 1
        }));

        // Túnel do borne inferior
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 8, y: h - 16, width: 16, height: 14, rx: 2,
          fill: '#0f172a', stroke: '#334155', 'stroke-width': 1
        }));

        // Ranhuras laterais de refrigeração
        for (let s = 24; s <= h - 28; s += 8) {
          g.appendChild(this.el('line', {
            x1: px + 2, y1: s, x2: px + 6, y2: s,
            stroke: '#94a3b8', 'stroke-width': 1
          }));
          g.appendChild(this.el('line', {
            x1: px + poleW - 6, y1: s, x2: px + poleW - 2, y2: s,
            stroke: '#94a3b8', 'stroke-width': 1
          }));
        }

        // Janela de Inspeção Mecânica (Flag Vermelho = I-ON / Verde = 0-OFF)
        const flagColor = props.tripped ? '#f59e0b' : (props.isOn ? '#ef4444' : '#10b981');
        const flagY = h / 2 - 20;
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 7, y: flagY, width: 14, height: 8, rx: 1.5,
          fill: flagColor, stroke: '#0f172a', 'stroke-width': 0.8
        }));
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: flagY + 6.5, 'text-anchor': 'middle',
          fill: '#ffffff', 'font-size': '6.5px', 'font-weight': 'bold'
        }, props.tripped ? '!' : (props.isOn ? 'I' : '0')));

        // Serigrafia Técnica impressa a laser
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 32, 'text-anchor': 'middle',
          fill: '#334155', 'font-size': '7px', 'font-weight': '900', 'font-family': 'monospace'
        }, 'QDC-5SL'));

        // Retângulo com Curva e Amperagem (ex: C16)
        const ratingBoxY = h - 28;
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 14, y: ratingBoxY, width: 28, height: 11, rx: 2,
          fill: '#ffffff', stroke: '#475569', 'stroke-width': 0.8
        }));
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: ratingBoxY + 8.5, 'text-anchor': 'middle',
          fill: '#0f172a', 'font-size': '8px', 'font-weight': 'bold', 'font-family': 'monospace'
        }, `C${props.rating || 16}`));

        // Especificação 4500A e 230/400V
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: h - 33, 'text-anchor': 'middle',
          fill: '#64748b', 'font-size': '6px', 'font-weight': '600'
        }, '4500A 230/400V~'));
      }

      // Manopla Basculante Unificada Preta Ergonômica
      const leverW = w * 0.75;
      const leverH = 22;
      const leverX = (w - leverW) / 2;
      const leverY = props.isOn ? (h / 2 - 10) : (h / 2 + 2);

      const lever = this.el('rect', {
        x: leverX, y: leverY, width: leverW, height: leverH, rx: 4,
        class: 'cad-actionable',
        fill: 'url(#lever-black)', stroke: '#0f172a', 'stroke-width': 1.2,
        style: 'cursor: pointer;'
      });

      // Estrias antiderrapantes da alavanca
      lever.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.tripped) { props.tripped = false; props.isOn = false; }
        else { props.isOn = !props.isOn; }
        sound.playClick();
        this.render();
        this.onTopologyChange();
      });
      g.appendChild(lever);

      for (let rx = leverX + 6; rx <= leverX + leverW - 6; rx += 4) {
        g.appendChild(this.el('line', {
          x1: rx, y1: leverY + 4, x2: rx, y2: leverY + leverH - 4,
          stroke: '#64748b', 'stroke-width': 1, 'pointer-events': 'none'
        }));
      }

      // Rótulo da alavanca
      g.appendChild(this.el('text', {
        x: w / 2, y: leverY + 14, 'text-anchor': 'middle',
        fill: props.tripped ? '#f59e0b' : (props.isOn ? '#86efac' : '#fca5a5'),
        'font-size': '9px', 'font-weight': 'bold', 'pointer-events': 'none'
      }, props.tripped ? 'TRIP' : (props.isOn ? 'LIGADO' : 'DESL.')));
    }

    // --- INTERRUPTOR DIFERENCIAL RESIDUAL (DR) COM MANOPLA VERMELHA E BOTÃO TESTE RETANGULAR ---
    renderRCD(p, g, w, h, isSelected, props) {
      // Corpo DIN do DR
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 5,
        fill: 'url(#breaker-casing)', stroke: isSelected ? '#38bdf8' : '#94a3b8',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      // Placa frontal com chanfro
      g.appendChild(this.el('rect', {
        x: 4, y: 16, width: w - 8, height: h - 32, rx: 3,
        fill: 'url(#breaker-front-plate)', stroke: '#cbd5e1', 'stroke-width': 0.8
      }));

      // Faixa horizontal vermelha superior característica do DR (Padrão da Foto)
      g.appendChild(this.el('rect', {
        x: 6, y: 18, width: w - 12, height: 5, rx: 1.5,
        fill: '#dc2626'
      }));

      // Túneis dos Bornes superiores e inferiores
      p.terms.forEach(t => {
        const ty = t.y < h / 2 ? 2 : h - 16;
        g.appendChild(this.el('rect', {
          x: t.x - 7, y: ty, width: 14, height: 14, rx: 2, fill: '#0f172a'
        }));
      });

      // Alavanca mecânica Vermelha do DR (Identica à Foto)
      const leverW = Math.min(w * 0.45, 50);
      const leverY = props.isOn ? (h / 2 - 10) : (h / 2 + 4);
      const lever = this.el('rect', {
        x: 10, y: leverY, width: leverW, height: 20, rx: 4,
        class: 'cad-actionable', fill: 'url(#lever-red)', stroke: '#991b1b', 'stroke-width': 1.2, style: 'cursor: pointer;'
      });
      lever.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.tripped) { props.tripped = false; props.isOn = false; }
        else { props.isOn = !props.isOn; }
        sound.playClick();
        this.render();
        this.onTopologyChange();
      });
      g.appendChild(lever);

      g.appendChild(this.el('text', {
        x: 10 + leverW / 2, y: leverY + 13.5, 'text-anchor': 'middle',
        fill: '#ffffff', 'font-size': '8.5px', 'font-weight': 'bold', 'pointer-events': 'none'
      }, props.isOn ? 'I-ON' : '0-OFF'));

      // Botão de TESTE (T) Retangular Vermelho em Relevo (Padrão da Foto)
      const testX = 10;
      const testY = 28;
      const testBtn = this.el('rect', {
        x: testX, y: testY, width: 26, height: 14, rx: 3,
        class: 'cad-actionable', fill: 'url(#lever-red)', stroke: '#991b1b', 'stroke-width': 1.2, style: 'cursor: pointer;'
      });
      testBtn.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        if (props.isOn && !props.tripped) {
          props.isOn = false; props.tripped = true;
          sound.playTrip();
          this.render();
          this.onTopologyChange();
        }
      });
      g.appendChild(testBtn);
      g.appendChild(this.el('text', {
        x: testX + 13, y: testY + 10, 'text-anchor': 'middle',
        fill: '#ffffff', 'font-size': '8.5px', 'font-weight': '900', 'pointer-events': 'none'
      }, 'TEST'));

      // Esquema esquemático do transformador toroidal do DR gravado a laser
      const diagX = w - 40;
      const diagY = h / 2 + 5;
      g.appendChild(this.el('circle', {
        cx: diagX, cy: diagY, r: 12,
        fill: 'none', stroke: '#94a3b8', 'stroke-width': 1.2
      }));
      g.appendChild(this.el('line', {
        x1: diagX - 16, y1: diagY, x2: diagX + 16, y2: diagY,
        stroke: '#94a3b8', 'stroke-width': 1, 'stroke-dasharray': '2 2'
      }));
      g.appendChild(this.el('rect', {
        x: diagX - 5, y: diagY + 14, width: 10, height: 6, rx: 1,
        fill: 'none', stroke: '#94a3b8', 'stroke-width': 0.8
      }));

      // Serigrafia Técnica: IDR 30mA
      g.appendChild(this.el('text', {
        x: w / 2, y: 38, 'text-anchor': 'middle',
        fill: '#1e293b', 'font-size': '8.5px', 'font-weight': 'bold'
      }, `IDR ${props.rating || 40}A — IΔn 30mA`));
      g.appendChild(this.el('text', {
        x: w / 2, y: 48, 'text-anchor': 'middle',
        fill: '#64748b', 'font-size': '6.5px', 'font-weight': '600'
      }, `Un ~230/400V [ 6000A ]`));
    }

    // --- DISPOSITIVO DE PROTEÇÃO CONTRA SURTOS (DPS) VERMELHO PADRÃO CLAMPER / STECK ---
    renderSPD(p, g, w, h, isSelected, props) {
      const numPoles = p.kind === 'spd3' ? 3 : (props.poles || 1);
      const poleW = w / numPoles;

      for (let i = 0; i < numPoles; i++) {
        const px = i * poleW;

        // Base modular em vermelho vivo Clamper/Steck
        g.appendChild(this.el('rect', {
          x: px, y: 0, width: poleW, height: h, rx: 4,
          fill: 'url(#dps-red-casing)', stroke: isSelected ? '#38bdf8' : '#7f1d1d',
          'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
        }));

        // Cartucho Vermelho Frontal plugável
        g.appendChild(this.el('rect', {
          x: px + 4, y: 14, width: poleW - 8, height: h - 28, rx: 3,
          fill: 'url(#dps-red-cartridge)', stroke: '#991b1b', 'stroke-width': 1
        }));

        // Alça do cartucho
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 10, y: 16, width: 20, height: 4, rx: 2,
          fill: '#7f1d1d'
        }));

        // Janela de Inspeção Visual (Verde = Operacional / Vermelho = Queimado)
        const isOk = props.ok !== false;
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 12, y: 26, width: 24, height: 12, rx: 2,
          fill: isOk ? '#16a34a' : '#ef4444',
          stroke: '#0f172a', 'stroke-width': 1
        }));

        // Raio ⚡ amarelo em relevo
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 35.5, 'text-anchor': 'middle',
          fill: '#fef08a', 'font-size': '10px', 'font-weight': 'bold', 'pointer-events': 'none'
        }, '⚡'));

        // Identificação Clamper e Modelo
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 52, 'text-anchor': 'middle',
          fill: '#ffffff', 'font-size': '7.5px', 'font-weight': '900', 'font-family': 'sans-serif'
        }, 'CLAMPER'));

        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 62, 'text-anchor': 'middle',
          fill: '#fee2e2', 'font-size': '6.5px', 'font-weight': 'bold'
        }, 'VCL 275V'));

        // Especificações de corrente de surto gravadas a laser
        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 72, 'text-anchor': 'middle',
          fill: '#ffffff', 'font-size': '6px', 'font-weight': 'bold'
        }, 'Imax 45kA'));

        g.appendChild(this.el('text', {
          x: px + poleW / 2, y: 81, 'text-anchor': 'middle',
          fill: '#fecaca', 'font-size': '5.5px'
        }, 'In 20kA | Cl. II'));

        // Túneis dos bornes (superior e inferior)
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 8, y: 2, width: 16, height: 10, rx: 2, fill: '#1e293b'
        }));
        g.appendChild(this.el('rect', {
          x: px + poleW / 2 - 8, y: h - 12, width: 16, height: 10, rx: 2, fill: '#1e293b'
        }));
      }
    }

    // --- BARRAMENTO DE NEUTRO E TERRA (COM SUPORTE DIN) ---
    renderBusbar(p, g, w, h, isSelected) {
      const isNeutral = p.kind === 'neutral_bus';
      const bracketColor = isNeutral ? '#0284c7' : '#16a34a'; // Azul ou Verde
      const busLabel = isNeutral ? 'BARRAMENTO DE NEUTRO (N)' : 'BARRAMENTO DE PROTEÇÃO TERRA (PE) ⏚';

      // Suporte isolante de fixação DIN
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 6,
        fill: bracketColor, stroke: isSelected ? '#38bdf8' : '#0f172a',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      // Garras de montagem laterais
      g.appendChild(this.el('rect', { x: -3, y: 12, width: 4, height: h - 24, fill: '#0f172a' }));
      g.appendChild(this.el('rect', { x: w - 1, y: 12, width: 4, height: h - 24, fill: '#0f172a' }));

      // Barra maciça de latão dourado escovado
      g.appendChild(this.el('rect', {
        x: 8, y: 12, width: w - 16, height: 22, rx: 3,
        fill: 'url(#bus-copper)', stroke: '#854d0e', 'stroke-width': 1
      }));

      // Rótulo serigrafado em alto contraste
      g.appendChild(this.el('text', {
        x: w / 2, y: 26, 'text-anchor': 'middle',
        fill: '#451a03', 'font-size': '8px', 'font-weight': 'bold', 'font-family': 'monospace'
      }, busLabel));
    }

    // --- BARRAMENTO TIPO PENTE UNIPOLAR / BIPOLAR / TRIPOLAR ---
    renderCombBusbar(p, g, w, h, isSelected, props) {
      const is1P = p.kind === 'comb_1p';
      const is2P = p.kind === 'comb_2p';
      const is3P = p.kind === 'comb_3p';
      const rating = props.rating || 63;
      const typeLabel = is1P ? 'PENTE 1P (FASE)' : (is2P ? 'PENTE 2P (BIFÁSICO L1/L2)' : 'PENTE 3P (TRIFÁSICO L1/L2/L3)');

      // 1. Dentes / Pinos condutores de Cobre Eletrolítico Maciço saindo para baixo
      p.terms.forEach((t, i) => {
        // Haste do pino de cobre
        g.appendChild(this.el('rect', {
          x: t.x - 5, y: 14, width: 10, height: 26, rx: 2,
          fill: 'url(#bus-copper)', stroke: '#854d0e', 'stroke-width': 0.8
        }));

        // Chanfro na ponta do pino
        g.appendChild(this.el('polygon', {
          points: `${t.x - 5},${40} ${t.x + 5},${40} ${t.x + 3},${42} ${t.x - 3},${42}`,
          fill: '#b45309'
        }));

        // Marcador da fase no pino
        let phaseMarker = 'F';
        let markerColor = '#1e242b';
        if (is2P) {
          phaseMarker = (i % 2 === 0) ? 'L1' : 'L2';
          markerColor = (i % 2 === 0) ? '#0f172a' : '#b91c1c';
        } else if (is3P) {
          const mod = i % 3;
          phaseMarker = mod === 0 ? 'L1' : (mod === 1 ? 'L2' : 'L3');
          markerColor = mod === 0 ? '#0f172a' : (mod === 1 ? '#b91c1c' : '#475569');
        }

        g.appendChild(this.el('rect', {
          x: t.x - 6, y: 18, width: 12, height: 10, rx: 2,
          fill: markerColor, stroke: '#ffffff', 'stroke-width': 0.5
        }));
        g.appendChild(this.el('text', {
          x: t.x, y: 26, 'text-anchor': 'middle',
          fill: '#ffffff', 'font-size': '6.5px', 'font-weight': '900', 'font-family': 'monospace'
        }, phaseMarker));
      });

      // 2. Perfil Isolante Termoplástico Antichama (Corpo Horizontal)
      g.appendChild(this.el('rect', {
        x: 4, y: 0, width: w - 8, height: 20, rx: 4,
        fill: '#e2e8f0', stroke: isSelected ? '#38bdf8' : '#94a3b8',
        'stroke-width': isSelected ? 2 : 1, filter: 'url(#cad-shadow)'
      }));

      // Friso superior de reforço mecânico
      g.appendChild(this.el('rect', {
        x: 6, y: 2, width: w - 12, height: 4, rx: 1.5,
        fill: '#cbd5e1'
      }));

      // 3. Tampas Isolantes de Fechamento Lateral (End Caps)
      g.appendChild(this.el('rect', {
        x: 0, y: -1, width: 6, height: 22, rx: 2,
        fill: '#eab308', stroke: '#ca8a04', 'stroke-width': 0.8
      }));
      g.appendChild(this.el('rect', {
        x: w - 6, y: -1, width: 6, height: 22, rx: 2,
        fill: '#eab308', stroke: '#ca8a04', 'stroke-width': 0.8
      }));

      // 4. Serigrafia Técnica impressa a laser
      g.appendChild(this.el('text', {
        x: w / 2, y: 13, 'text-anchor': 'middle',
        fill: '#1e293b', 'font-size': '7.5px', 'font-weight': 'bold', 'font-family': 'monospace'
      }, `${typeLabel} — ${rating}A 415V~`));
    }

    // --- CONECTOR DE EMENDA / DERIVAÇÃO / NÓ WAGO ---
    renderWireJunction(p, g, w, h, isSelected, props) {
      const cx = w / 2;
      const cy = h / 2;
      const jColor = WIRE_COLORS[props.color]?.hex || '#f59e0b';

      // 1. Corpo translúcido compacto estilo Conector WAGO 221
      g.appendChild(this.el('rect', {
        x: 2, y: 2, width: w - 4, height: h - 4, rx: 6,
        fill: 'rgba(255, 255, 255, 0.95)',
        stroke: isSelected ? '#38bdf8' : '#ea580c',
        'stroke-width': isSelected ? 2 : 1.2,
        filter: 'url(#cad-shadow)'
      }));

      // 2. Barra interna de contato estanhada
      g.appendChild(this.el('rect', {
        x: 6, y: 6, width: w - 12, height: h - 12, rx: 4,
        fill: 'url(#bus-copper)', stroke: '#b45309', 'stroke-width': 0.8
      }));

      // 3. Ponto de nó / solda sólido central com anel da cor da rede
      g.appendChild(this.el('circle', {
        cx, cy, r: 7.5,
        fill: jColor, stroke: '#ffffff', 'stroke-width': 1.5,
        filter: 'url(#cad-shadow)'
      }));

      // 4. Ícone de conexão no centro
      g.appendChild(this.el('circle', {
        cx, cy, r: 3,
        fill: '#ffffff'
      }));

      // 5. Linhas guias dos 4 bornes ortogonais
      const guideLines = [
        { x1: cx, y1: 2, x2: cx, y2: 6 },
        { x1: cx, y1: h - 6, x2: cx, y2: h - 2 },
        { x1: 2, y1: cy, x2: 6, y2: cy },
        { x1: w - 6, y1: cy, x2: w - 2, y2: cy }
      ];
      guideLines.forEach(l => {
        g.appendChild(this.el('line', { ...l, stroke: '#ea580c', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      });
    }

    // --- PADRÃO DE ENTRADA (CAIXA DE MEDIÇÃO) ---
    renderSourceBox(p, g, w, h, isSelected) {
      // Gabinete da caixa de medição cinza
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 7,
        fill: '#334155', stroke: isSelected ? '#38bdf8' : '#1e293b',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      // Visor de policarbonato translúcido fumê
      g.appendChild(this.el('rect', {
        x: 18, y: 10, width: w - 26, height: h - 20, rx: 4,
        fill: '#0f172a', stroke: '#475569', 'stroke-width': 1.5
      }));

      // Display LCD do medidor digital
      g.appendChild(this.el('rect', {
        x: 24, y: 22, width: w - 38, height: 26, rx: 3,
        fill: '#064e3b', stroke: '#047857', 'stroke-width': 1
      }));

      // Dígitos de consumo eletrônico
      g.appendChild(this.el('text', {
        x: w / 2 + 5, y: 39, 'text-anchor': 'middle',
        fill: '#34d399', 'font-size': '11px', 'font-weight': 'bold', 'font-family': 'monospace'
      }, '001428 kWh'));

      // Título do padrão
      g.appendChild(this.el('text', {
        x: w / 2 + 5, y: 64, 'text-anchor': 'middle',
        fill: '#94a3b8', 'font-size': '8px', 'font-weight': 'bold'
      }, p.shortName));

      // Lacre metálico de segurança da concessionária
      g.appendChild(this.el('circle', {
        cx: w - 16, cy: h - 18, r: 5, fill: '#dc2626', stroke: '#991b1b'
      }));
      g.appendChild(this.el('text', {
        x: w - 16, y: h - 16, 'text-anchor': 'middle', fill: '#fff', 'font-size': '6px', 'font-weight': 'bold'
      }, '🔒'));
    }

    // --- INTERRUPTOR RESIDENCIAL ESPELHO 4x2 ---
    renderWallSwitch(p, g, w, h, isSelected, props) {
      // Espelho de parede 4x2 branco acetinado
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 8,
        fill: 'url(#wall-plate)', stroke: isSelected ? '#38bdf8' : '#cbd5e1',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      // Moldura interna chanfrada
      g.appendChild(this.el('rect', {
        x: 5, y: 5, width: w - 10, height: h - 10, rx: 5,
        fill: 'none', stroke: '#e2e8f0', 'stroke-width': 1
      }));

      // Berço do módulo central
      const modW = 38, modH = 54;
      const mx = (w - modW) / 2, my = (h - modH) / 2;
      g.appendChild(this.el('rect', {
        x: mx, y: my, width: modW, height: modH, rx: 4,
        fill: '#e2e8f0', stroke: '#cbd5e1', 'stroke-width': 1
      }));

      // Tecla basculante ergonômica
      const isPressed = p.kind === 'switch_parallel' ? (props.position === 2) : (p.kind === 'switch_intermediate' ? !!props.crossed : !!props.isOn);
      const rockerY = isPressed ? my + 4 : my;

      const rocker = this.el('rect', {
        x: mx + 2, y: rockerY, width: modW - 4, height: modH - 4, rx: 4,
        class: 'cad-actionable',
        fill: isPressed ? '#f1f5f9' : '#ffffff',
        stroke: isPressed ? '#0284c7' : '#94a3b8',
        'stroke-width': isPressed ? 1.5 : 1,
        style: 'cursor: pointer;'
      });

      const toggleSwitch = ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        this.saveHistory();
        if (p.kind === 'switch_parallel') {
          props.position = props.position === 1 ? 2 : 1;
        } else if (p.kind === 'switch_intermediate') {
          props.crossed = !props.crossed;
        } else {
          props.isOn = !props.isOn;
        }
        sound.playClick();
        this.onTopologyChange();
      };

      rocker.addEventListener('pointerdown', toggleSwitch);
      g.appendChild(rocker);

      // Ponto de toque em baixo relevo (LED / Indicador de estado)
      g.appendChild(this.el('circle', {
        cx: w / 2, cy: isPressed ? my + modH - 12 : my + 12, r: 2.8,
        fill: isPressed ? '#0284c7' : '#cbd5e1',
        stroke: isPressed ? '#38bdf8' : 'none',
        'stroke-width': 0.8,
        'pointer-events': 'none'
      }));

      // Rótulo inferior da placa
      g.appendChild(this.el('text', {
        x: w / 2, y: h - 6, 'text-anchor': 'middle',
        fill: '#94a3b8', 'font-size': '6.5px', 'font-weight': 'bold'
      }, p.shortName));
    }

    // --- INTERRUPTOR DUPLO RESIDENCIAL 4x2 (2 TECLAS INDEPENDENTES) ---
    renderDoubleSwitch(p, g, w, h, isSelected, props) {
      // Espelho de parede 4x2
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 8,
        fill: 'url(#wall-plate)', stroke: isSelected ? '#38bdf8' : '#cbd5e1',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      // Moldura interna
      g.appendChild(this.el('rect', {
        x: 5, y: 5, width: w - 10, height: h - 10, rx: 5,
        fill: 'none', stroke: '#e2e8f0', 'stroke-width': 1
      }));

      const modW = 38, modH = 30;
      const mx = (w - modW) / 2;
      const my1 = 12;
      const my2 = 48;

      // 1. TECLA 1 (SUPERIOR)
      const isKey1 = !!props.key1On;
      const rocker1 = this.el('rect', {
        x: mx + 2, y: isKey1 ? my1 + 3 : my1, width: modW - 4, height: modH - 4, rx: 3,
        class: 'cad-actionable',
        fill: isKey1 ? '#f1f5f9' : '#ffffff',
        stroke: isKey1 ? '#0284c7' : '#94a3b8',
        'stroke-width': isKey1 ? 1.5 : 1,
        style: 'cursor: pointer;'
      });
      rocker1.addEventListener('pointerdown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        this.saveHistory();
        props.key1On = !props.key1On;
        sound.playClick();
        this.onTopologyChange();
      });
      g.appendChild(rocker1);

      g.appendChild(this.el('circle', {
        cx: w / 2, cy: isKey1 ? my1 + modH - 9 : my1 + 7, r: 2.2,
        fill: isKey1 ? '#0284c7' : '#cbd5e1',
        stroke: isKey1 ? '#38bdf8' : 'none',
        'pointer-events': 'none'
      }));

      // 2. TECLA 2 (INFERIOR)
      const isKey2 = !!props.key2On;
      const rocker2 = this.el('rect', {
        x: mx + 2, y: isKey2 ? my2 + 3 : my2, width: modW - 4, height: modH - 4, rx: 3,
        class: 'cad-actionable',
        fill: isKey2 ? '#f1f5f9' : '#ffffff',
        stroke: isKey2 ? '#0284c7' : '#94a3b8',
        'stroke-width': isKey2 ? 1.5 : 1,
        style: 'cursor: pointer;'
      });
      rocker2.addEventListener('pointerdown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        this.saveHistory();
        props.key2On = !props.key2On;
        sound.playClick();
        this.onTopologyChange();
      });
      g.appendChild(rocker2);

      g.appendChild(this.el('circle', {
        cx: w / 2, cy: isKey2 ? my2 + modH - 9 : my2 + 7, r: 2.2,
        fill: isKey2 ? '#0284c7' : '#cbd5e1',
        stroke: isKey2 ? '#38bdf8' : 'none',
        'pointer-events': 'none'
      }));

      // Rótulo inferior da placa
      g.appendChild(this.el('text', {
        x: w / 2, y: h - 4, 'text-anchor': 'middle',
        fill: '#94a3b8', 'font-size': '6px', 'font-weight': 'bold'
      }, 'INTERRUPTOR DUPLO'));
    }

    // --- TOMADA RESIDENCIAL NBR 14136 ---
    renderWallSocket(p, g, w, h, isSelected, props, simulationReport) {
      // Espelho de parede 4x2
      g.appendChild(this.el('rect', {
        x: 0, y: 0, width: w, height: h, rx: 8,
        fill: 'url(#wall-plate)', stroke: isSelected ? '#38bdf8' : '#cbd5e1',
        'stroke-width': isSelected ? 2 : 1.2, filter: 'url(#cad-shadow)'
      }));

      const cx = w / 2;
      const cy = h / 2 - 2;

      // Miolo Hexagonal característico NBR 14136
      const hexPoints = `
        ${cx - 18},${cy - 22} ${cx + 18},${cy - 22}
        ${cx + 25},${cy} ${cx + 18},${cy + 22}
        ${cx - 18},${cy + 22} ${cx - 25},${cy}
      `;
      g.appendChild(this.el('polygon', {
        points: hexPoints, fill: '#f1f5f9', stroke: '#94a3b8', 'stroke-width': 1.5
      }));

      // Furo Fase (Direita)
      g.appendChild(this.el('circle', { cx: cx + 11, cy: cy - 7, r: 3.5, fill: '#0f172a' }));
      // Furo Neutro (Esquerda)
      g.appendChild(this.el('circle', { cx: cx - 11, cy: cy - 7, r: 3.5, fill: '#0f172a' }));
      // Furo Terra Central Deslocado
      g.appendChild(this.el('circle', { cx, cy: cy + 7, r: 3.5, fill: '#0f172a' }));

      // LED indicador de tensão presente
      const isPowered = props.isPowered && simulationReport?.active;
      g.appendChild(this.el('circle', {
        cx, cy: h - 16, r: 3,
        fill: isPowered ? '#10b981' : '#64748b',
        filter: isPowered ? 'url(#cad-shadow)' : 'none'
      }));

      // Inscrição 10A ou 20A
      g.appendChild(this.el('text', {
        x: cx, y: h - 7, 'text-anchor': 'middle',
        fill: '#64748b', 'font-size': '7px', 'font-weight': 'bold'
      }, p.kind === 'socket_tue' ? '20A 250V~' : '10A 250V~'));
    }

    // --- LUMINÁRIA PLAFON LED DE TETO ---
    renderCeilingLamp(p, g, w, h, isSelected, props, simulationReport) {
      const isLit = props.isLit && simulationReport?.active;
      const cx = w / 2, cy = h / 2;

      // Halo de luz projetada se estiver acesa
      if (isLit) {
        g.appendChild(this.el('circle', {
          cx, cy, r: 42, fill: '#fde047', opacity: 0.25, filter: 'url(#lamp-halo)'
        }));
      }

      // Moldura externa circular de alumínio branco
      g.appendChild(this.el('circle', {
        cx, cy, r: 34,
        fill: '#ffffff', stroke: isSelected ? '#38bdf8' : '#cbd5e1',
        'stroke-width': isSelected ? 2.5 : 1.5, filter: 'url(#cad-shadow)'
      }));

      // Difusor acrílico leitoso (acende com gradiente incandescente se ligada)
      const bulb = this.el('circle', {
        cx, cy, r: 27,
        fill: isLit ? 'url(#lamp-lit-radial)' : '#f1f5f9',
        stroke: isLit ? '#f59e0b' : '#94a3b8', 'stroke-width': 1.5
      });
      g.appendChild(bulb);

      if (isLit) {
        // Detalhe de filamento / feixe luminoso central
        g.appendChild(this.el('circle', { cx, cy, r: 10, fill: '#ffffff', opacity: 0.9 }));
      }

      g.appendChild(this.el('text', {
        x: cx, y: h - 2, 'text-anchor': 'middle',
        fill: isLit ? '#fef08a' : '#94a3b8', 'font-size': '7.5px', 'font-weight': 'bold'
      }, isLit ? '💡 ACESA (15W)' : 'LÂMPADA LED'));
    }

    // --- CHUVEIRO ELÉTRICO BRASILEIRO REALISTA ---
    renderElectricShower(p, g, w, h, isSelected, props, simulationReport) {
      const isRunning = props.isRunning && simulationReport?.active;
      const cx = w / 2 + 10;
      const cy = h / 2 - 5;

      // Tubo cromado curvado de alimentação saindo da parede
      g.appendChild(this.el('path', {
        d: `M 0,${cy - 12} L ${cx - 15},${cy - 12} Q ${cx},${cy - 12} ${cx},${cy}`,
        fill: 'none', stroke: 'url(#chrome-grad)', 'stroke-width': 8, 'stroke-linecap': 'round'
      }));

      // Canopla de acabamento na parede
      g.appendChild(this.el('rect', {
        x: 0, y: cy - 20, width: 6, height: 16, rx: 1, fill: '#94a3b8'
      }));

      // Corpo cilíndrico do chuveiro com brilho curvo
      g.appendChild(this.el('rect', {
        x: cx - 22, y: cy - 14, width: 44, height: 28, rx: 6,
        fill: 'url(#shower-body)', stroke: isSelected ? '#38bdf8' : '#94a3b8',
        'stroke-width': 1.5, filter: 'url(#cad-shadow)'
      }));

      // Seletor de temperatura giratório no topo
      const selColor = props.mode === 'inverno' ? '#ef4444' : (props.mode === 'verao' ? '#f59e0b' : '#64748b');
      const tempKnob = this.el('rect', {
        x: cx - 18, y: cy - 24, width: 36, height: 10, rx: 3,
        class: 'cad-actionable', fill: selColor, stroke: '#0f172a', 'stroke-width': 1,
        style: 'cursor: pointer;'
      });
      tempKnob.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.mode === 'inverno') props.mode = 'verao';
        else if (props.mode === 'verao') props.mode = 'desligado';
        else props.mode = 'inverno';
        sound.playClick();
        this.render();
        this.onTopologyChange();
      });
      g.appendChild(tempKnob);

      g.appendChild(this.el('text', {
        x: cx, y: cy - 16.5, 'text-anchor': 'middle',
        fill: '#ffffff', 'font-size': '7px', 'font-weight': 'bold', 'pointer-events': 'none'
      }, props.mode.toUpperCase()));

      // Crivo Espalhador cônico perfurado na base
      g.appendChild(this.el('path', {
        d: `M ${cx - 26},${cy + 14} L ${cx + 26},${cy + 14} L ${cx + 18},${cy + 22} L ${cx - 18},${cy + 22} Z`,
        fill: '#e2e8f0', stroke: '#64748b', 'stroke-width': 1
      }));

      // Filetes de água azuis translúcidos se ligado
      if (isRunning) {
        for (let i = -18; i <= 18; i += 4.5) {
          g.appendChild(this.el('line', {
            x1: cx + i, y1: cy + 22, x2: cx + i * 1.1, y2: cy + 42,
            stroke: '#38bdf8', 'stroke-width': 1.5, 'stroke-linecap': 'round',
            'stroke-dasharray': '3 2'
          }));
        }
      }
    }

    // --- VENTILADOR DE TETO REALISTA ---
    renderCeilingFan(p, g, w, h, isSelected, props, simulationReport) {
      const isSpinning = props.fanOn && simulationReport?.active;
      const isLightOn = props.lightOn && simulationReport?.active;
      const cx = w / 2, cy = h / 2 - 4;

      // Canopla e haste de sustentação
      g.appendChild(this.el('rect', {
        x: cx - 4, y: 0, width: 8, height: 16, fill: '#64748b'
      }));

      // Grupo das pás giratórias
      const bladesGrp = this.el('g', {
        class: isSpinning ? 'cad-spin-fast' : '',
        transform: `translate(${cx}, ${cy})`
      });

      // 3 Pás aerodinâmicas perfiladas com parafusos de fixação
      for (let ang of [0, 120, 240]) {
        const blade = this.el('g', { transform: `rotate(${ang})` });
        blade.appendChild(this.el('rect', {
          x: -6, y: -38, width: 12, height: 26, rx: 3,
          fill: '#854d0e', stroke: '#582b08', 'stroke-width': 1
        }));
        blade.appendChild(this.el('circle', { cx: 0, cy: -14, r: 2, fill: '#cbd5e1' }));
        bladesGrp.appendChild(blade);
      }

      // Motor central esférico
      bladesGrp.appendChild(this.el('circle', {
        cx: 0, cy: 0, r: 12, fill: '#1e293b', stroke: '#475569', 'stroke-width': 1.5
      }));
      g.appendChild(bladesGrp);

      // Globo de iluminação leitoso central
      const globe = this.el('circle', {
        cx, cy, r: 8,
        fill: isLightOn ? '#fef08a' : '#f8fafc',
        stroke: isLightOn ? '#facc15' : '#cbd5e1', 'stroke-width': 1.2,
        filter: isLightOn ? 'url(#lamp-halo)' : 'none'
      });
      g.appendChild(globe);
    }

    // --- MOTOR ELÉTRICO / BOMBA D'ÁGUA ---
    renderIndustrialMotor(p, g, w, h, isSelected, props, simulationReport) {
      const isRunning = props.isRunning && simulationReport?.active;
      const cx = w / 2;
      const cy = h / 2;

      // Pés de fixação na base
      g.appendChild(this.el('rect', {
        x: cx - 32, y: h - 14, width: 64, height: 8, rx: 2,
        fill: '#1e293b', stroke: '#0f172a'
      }));

      // Carcaça cilíndrica aletada em azul industrial
      g.appendChild(this.el('circle', {
        cx, cy, r: 28,
        fill: 'url(#motor-blue)', stroke: isSelected ? '#38bdf8' : '#0f172a',
        'stroke-width': 1.5, filter: 'url(#cad-shadow)'
      }));

      // Aletas de ventilação longitudinais
      for (let r = 0; r < 360; r += 45) {
        g.appendChild(this.el('line', {
          x1: cx, y1: cy,
          x2: cx + Math.cos(r * Math.PI / 180) * 26,
          y2: cy + Math.sin(r * Math.PI / 180) * 26,
          stroke: '#60a5fa', 'stroke-width': 1.5, opacity: 0.6
        }));
      }

      // Caixa de ligação superior quadrada com tampa
      g.appendChild(this.el('rect', {
        x: cx - 12, y: cy - 36, width: 24, height: 12, rx: 2,
        fill: '#1e293b', stroke: '#475569'
      }));

      // Eixo e polia frontal giratória
      const shaft = this.el('g', {
        class: isRunning ? 'cad-spin-fast' : '',
        transform: `translate(${cx}, ${cy})`
      });
      shaft.appendChild(this.el('circle', { cx: 0, cy: 0, r: 10, fill: '#cbd5e1', stroke: '#334155' }));
      shaft.appendChild(this.el('rect', { x: -2, y: -8, width: 4, height: 16, fill: '#0f172a' }));
      g.appendChild(shaft);
    }

    renderProbes() {
      this.probesLayer.innerHTML = '';
      if (!this.multimeterActive) return;

      const drawP = (probe, color, label) => {
        if (!probe) return;
        const g = this.el('g', { transform: `translate(${probe.x}, ${probe.y})` });
        g.appendChild(this.el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#f8fafc', 'stroke-width': 2 }));
        g.appendChild(this.el('polygon', { points: '0,0 -5,-25 5,-25', fill: color, stroke: '#0f172a' }));
        g.appendChild(this.el('text', { x: 0, y: -28, 'text-anchor': 'middle', fill: '#ffffff', 'font-size': '8px', 'font-weight': 'bold' }, label));
        this.probesLayer.appendChild(g);
      };

      drawP(this.probeBlack, '#1e293b', 'COM');
      drawP(this.probeRed, '#ef4444', 'V/Ω');
    }

    initEvents() {
      this.svg.addEventListener('wheel', ev => {
        ev.preventDefault();
        const factor = ev.deltaY < 0 ? 0.9 : 1.1;
        const cur = this.clientToSvg(ev);
        const newW = this.viewBox.w * factor;
        const newH = this.viewBox.h * factor;
        if (newW < 400 || newW > 4000) return;

        this.viewBox.x = cur.x - (cur.x - this.viewBox.x) * factor;
        this.viewBox.y = cur.y - (cur.y - this.viewBox.y) * factor;
        this.viewBox.w = newW;
        this.viewBox.h = newH;
        this.updateViewBox();
      }, { passive: false });

      this.activePointers = new Map();
      this.pinchStartDist = null;
      this.pinchStartViewBox = null;

      this.svg.addEventListener('pointerdown', ev => {
        this.activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

        // Pinch Zoom com 2 dedos no celular / tablet
        if (this.activePointers.size === 2) {
          const pts = Array.from(this.activePointers.values());
          this.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          this.pinchStartViewBox = { ...this.viewBox };
          this.isPanning = false;
          return;
        }

        const isBgClick = ev.target === this.svg || ev.target.id === 'cad-bg' || ev.target.id === 'cad-grid-bg';

        if (ev.button === 1 || this.spacePressed || (isBgClick && ev.pointerType === 'touch' && !this.drawingWire)) {
          this.isPanning = true;
          this.panStart = { x: ev.clientX, y: ev.clientY };
          return;
        }
        if (this.drawingWire && ev.button === 0) {
          if (isBgClick) {
            const pt = this.clientToSvg(ev);
            this.drawingWire.points.push({ x: this.snap(pt.x), y: this.snap(pt.y) });
            sound.playClick();
            this.updateTempWirePreview();
            return;
          }
        }
        if (isBgClick) {
          this.selected = null;
          this.render();
          this.onSelectionChange(null);
        }
      });

      window.addEventListener('pointermove', ev => {
        if (this.activePointers.has(ev.pointerId)) {
          this.activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        }

        // Gesto Pinch de Zoom em Celular
        if (this.activePointers.size === 2 && this.pinchStartDist && this.pinchStartViewBox) {
          const pts = Array.from(this.activePointers.values());
          const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (curDist > 10) {
            const factor = this.pinchStartDist / curDist;
            const newW = this.pinchStartViewBox.w * factor;
            const newH = this.pinchStartViewBox.h * factor;
            if (newW >= 300 && newW <= 4000) {
              this.viewBox.w = newW;
              this.viewBox.h = newH;
              this.updateViewBox();
            }
          }
          return;
        }

        const cur = this.clientToSvg(ev);
        this.currentMousePos = { x: this.snap(cur.x), y: this.snap(cur.y) };
        this.onCursorMove(this.currentMousePos);

        if (this.isPanning) {
          const dx = (ev.clientX - this.panStart.x) * (this.viewBox.w / this.svg.clientWidth);
          const dy = (ev.clientY - this.panStart.y) * (this.viewBox.h / this.svg.clientHeight);
          this.viewBox.x -= dx;
          this.viewBox.y -= dy;
          this.panStart = { x: ev.clientX, y: ev.clientY };
          this.updateViewBox();
          return;
        }

        if (this.draggingPart) {
          const p = this.parts.find(item => item.id === this.draggingPart.id);
          if (p) {
            p.x = this.snap(cur.x - this.draggingPart.dx);
            p.y = this.snap(cur.y - this.draggingPart.dy);
            this.render();
          }
          return;
        }

        if (this.drawingWire) {
          this.updateTempWirePreview();
        }
      });

      const handlePointerEnd = ev => {
        this.activePointers.delete(ev.pointerId);
        if (this.activePointers.size < 2) {
          this.pinchStartDist = null;
          this.pinchStartViewBox = null;
        }
        if (this.activePointers.size === 0) {
          if (this.isPanning) this.isPanning = false;
        }
        if (this.draggingPart) {
          this.draggingPart = null;
          this.saveHistory();
          this.onTopologyChange();
        }
      };

      window.addEventListener('pointerup', handlePointerEnd);
      window.addEventListener('pointercancel', handlePointerEnd);

      window.addEventListener('keydown', ev => {
        if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
        if (ev.code === 'Space') this.spacePressed = true;
        if (ev.key === 'Escape' && this.drawingWire) {
          this.drawingWire = null;
          this.updateTempWirePreview();
          this.render();
        }
        if (ev.key === 'Delete' || ev.key === 'Backspace') this.deleteSelected();
        if (ev.key === 'r' || ev.key === 'R') this.rotateSelected();
        if (ev.ctrlKey && (ev.key === 'z' || ev.key === 'Z')) { ev.preventDefault(); this.undo(); }
        if (ev.ctrlKey && (ev.key === 'y' || ev.key === 'Y')) { ev.preventDefault(); this.redo(); }
        if (ev.ctrlKey && (ev.key === 'd' || ev.key === 'D')) { ev.preventDefault(); this.duplicateSelected(); }
      });

      window.addEventListener('keyup', ev => {
        if (ev.code === 'Space') this.spacePressed = false;
      });

      this.svg.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        if (this.drawingWire) {
          this.drawingWire = null;
          this.updateTempWirePreview();
          this.render();
        }
      });
    }

    zoomIn() {
      this.viewBox.x += this.viewBox.w * 0.05;
      this.viewBox.y += this.viewBox.h * 0.05;
      this.viewBox.w *= 0.9; this.viewBox.h *= 0.9;
      this.updateViewBox();
    }

    zoomOut() {
      this.viewBox.x -= this.viewBox.w * 0.05;
      this.viewBox.y -= this.viewBox.h * 0.05;
      this.viewBox.w *= 1.1; this.viewBox.h *= 1.1;
      this.updateViewBox();
    }

    fitAll() {
      if (this.parts.length === 0) {
        this.viewBox = { x: 0, y: 0, w: 1400, h: 900 };
        this.updateViewBox();
        return;
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      this.parts.forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + p.w); maxY = Math.max(maxY, p.y + p.h);
      });
      const pad = 120;
      this.viewBox = {
        x: minX - pad, y: minY - pad,
        w: Math.max(800, maxX - minX + pad * 2),
        h: Math.max(600, maxY - minY + pad * 2)
      };
      this.updateViewBox();
    }
  }

  // ==========================================================
  // 5. EXPORTAÇÃO (PNG, SVG, QDC JSON, BOM CSV)
  // ==========================================================
  class ExportManager {
    constructor(cadEngine, simulator) {
      this.cad = cadEngine;
      this.sim = simulator;
    }

    saveProjectToFile(filename = 'meu_projeto_eletrico.qdc') {
      const projectData = {
        version: '7.5-PRO',
        createdAt: new Date().toISOString(),
        systemVoltage: this.sim.systemVoltage,
        parts: this.cad.parts,
        wires: this.cad.wires,
        viewBox: this.cad.viewBox
      };
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }

    loadProjectFromFile(file, onSuccess = () => {}) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.parts || !data.wires) throw new Error('Arquivo de projeto inválido.');
          this.cad.saveHistory();
          this.cad.parts = data.parts;
          this.cad.wires = data.wires;
          this.cad.nextPartId = Math.max(...data.parts.map(p => p.id), 0) + 1;
          this.cad.nextWireId = Math.max(...data.wires.map(w => w.id), 0) + 1;
          if (data.systemVoltage) this.sim.setSystemVoltage(data.systemVoltage);
          if (data.viewBox) { this.cad.viewBox = data.viewBox; this.cad.updateViewBox(); }
          this.cad.render();
          this.cad.onTopologyChange();
          onSuccess(data);
        } catch (err) {
          alert('Erro ao carregar projeto: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    exportToPng(filename = 'esquema_eletrico_qdc.png') {
      const svgElem = this.cad.svg;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElem);
      const customCss = `.cad-part-body { fill: #f8fafc; stroke: #64748b; } text { font-family: sans-serif; }`;
      source = source.replace('</defs>', `<style>${customCss}</style></defs>`);

      const img = new Image();
      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgElem.clientWidth || 1400;
        canvas.height = svgElem.clientHeight || 900;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0b1017';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const a = document.createElement('a');
        a.download = filename; a.href = canvas.toDataURL('image/png'); a.click();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    exportToSvg(filename = 'esquema_vetorial_qdc.svg') {
      const serializer = new XMLSerializer();
      const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(this.cad.svg);
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename; a.href = url; a.click();
      URL.revokeObjectURL(url);
    }

    generateBOM() {
      const partsCount = {};
      const wireStats = {};
      this.cad.parts.forEach(p => {
        const name = p.shortName || p.name;
        partsCount[name] = (partsCount[name] || 0) + 1;
      });
      this.cad.wires.forEach(w => {
        const key = `${WIRE_COLORS[w.color]?.name || 'Retorno'} - ${w.gauge || '2.5'} mm²`;
        if (!wireStats[key]) wireStats[key] = { segments: 0, lengthMeters: 0 };
        wireStats[key].segments += 1;
        wireStats[key].lengthMeters += 3.5; // Estimativa média por trecho
      });
      return { parts: partsCount, wires: wireStats };
    }

    exportBOMToCsv(filename = 'lista_materiais.csv') {
      const bom = this.generateBOM();
      let csv = 'Categoria;Item / Descrição;Quantidade;Unidade\r\n';
      Object.entries(bom.parts).forEach(([item, qtd]) => {
        csv += `Componente;${item};${qtd};un\r\n`;
      });
      Object.entries(bom.wires).forEach(([cabo, data]) => {
        csv += `Condutores;Cabo ${cabo};${data.lengthMeters.toFixed(1)};metros (${data.segments} trechos)\r\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = filename; a.href = url; a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ==========================================================
  // 5.5 GERENCIADOR DE PROJETOS SALVOS (LOCALSTORAGE & CELULAR)
  // ==========================================================
  class ProjectStorageManager {
    constructor(cadEngine, simulator, onProjectLoaded) {
      this.cad = cadEngine;
      this.sim = simulator;
      this.onProjectLoaded = onProjectLoaded;
      this.storageKey = 'qdc_pro_saved_projects';
      this.autoSaveKey = 'qdc_pro_autosave_latest';
      this.initEvents();
    }

    getSavedProjects() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    saveProject(name) {
      const trimmed = (name || '').trim() || 'Projeto Elétrico ' + new Date().toLocaleDateString('pt-BR');
      const projects = this.getSavedProjects();
      const existingIdx = projects.findIndex(p => p.name.toLowerCase() === trimmed.toLowerCase());

      const projectData = {
        name: trimmed,
        updatedAt: new Date().toISOString(),
        systemVoltage: this.sim.systemVoltage,
        parts: this.cad.parts,
        wires: this.cad.wires,
        viewBox: this.cad.viewBox
      };

      if (existingIdx >= 0) {
        projects[existingIdx] = projectData;
      } else {
        projects.unshift(projectData);
      }

      try {
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
        this.renderProjectsList();
        sound.playClick();
        return true;
      } catch (e) {
        alert('Memória do aparelho cheia ou indisponível.');
        return false;
      }
    }

    loadProject(name) {
      const projects = this.getSavedProjects();
      const target = projects.find(p => p.name === name);
      if (!target) return;

      this.cad.saveHistory();
      this.cad.parts = target.parts || [];
      this.cad.wires = target.wires || [];
      if (target.systemVoltage) this.sim.setSystemVoltage(target.systemVoltage);
      if (target.viewBox) {
        this.cad.viewBox = target.viewBox;
        this.cad.updateViewBox();
      }

      let maxPId = 0, maxWId = 0;
      this.cad.parts.forEach(p => { if (p.id >= maxPId) maxPId = p.id; });
      this.cad.wires.forEach(w => { if (w.id >= maxWId) maxWId = w.id; });
      this.cad.nextPartId = maxPId + 1;
      this.cad.nextWireId = maxWId + 1;
      this.cad.selected = null;

      sound.playClick();
      this.cad.render();
      if (this.onProjectLoaded) this.onProjectLoaded();

      document.getElementById('projects-modal')?.classList.remove('visible');
    }

    deleteProject(name) {
      if (!confirm(`Deseja realmente excluir o projeto "${name}" da memória?`)) return;
      let projects = this.getSavedProjects();
      projects = projects.filter(p => p.name !== name);
      localStorage.setItem(this.storageKey, JSON.stringify(projects));
      this.renderProjectsList();
      sound.playClick();
    }

    renderProjectsList() {
      const container = document.getElementById('saved-projects-list');
      if (!container) return;

      const projects = this.getSavedProjects();
      if (projects.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 24px 10px; font-size: 12px;">
            Nenhum projeto salvo na memória ainda.<br>Digite um nome acima e toque em "Salvar Agora".
          </div>
        `;
        return;
      }

      container.innerHTML = projects.map(p => {
        const dateStr = new Date(p.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const partsCount = (p.parts || []).length;
        const wiresCount = (p.wires || []).length;

        return `
          <div class="project-card">
            <div class="project-info">
              <div class="project-name">⚡ ${p.name}</div>
              <div class="project-meta">
                <span>🕒 ${dateStr}</span>
                <span>📦 ${partsCount} peças</span>
                <span>〰️ ${wiresCount} cabos</span>
              </div>
            </div>
            <div class="project-actions">
              <button class="btn-icon success btn-open-stored" data-proj="${p.name}">Abrir</button>
              <button class="btn-icon danger btn-del-stored" data-proj="${p.name}">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      container.querySelectorAll('.btn-open-stored').forEach(btn => {
        btn.addEventListener('click', () => this.loadProject(btn.dataset.proj));
      });
      container.querySelectorAll('.btn-del-stored').forEach(btn => {
        btn.addEventListener('click', () => this.deleteProject(btn.dataset.proj));
      });
    }

    autoSave() {
      try {
        const snap = {
          updatedAt: new Date().toISOString(),
          systemVoltage: this.sim.systemVoltage,
          parts: this.cad.parts,
          wires: this.cad.wires,
          viewBox: this.cad.viewBox
        };
        localStorage.setItem(this.autoSaveKey, JSON.stringify(snap));
      } catch (e) {}
    }

    tryRestoreAutoSave() {
      try {
        const raw = localStorage.getItem(this.autoSaveKey);
        if (!raw) return false;
        const target = JSON.parse(raw);
        if (!target.parts || target.parts.length === 0) return false;
        this.cad.parts = target.parts || [];
        this.cad.wires = target.wires || [];
        if (target.systemVoltage) this.sim.setSystemVoltage(target.systemVoltage);
        if (target.viewBox) {
          this.cad.viewBox = target.viewBox;
          this.cad.updateViewBox();
        }
        let maxPId = 0, maxWId = 0;
        this.cad.parts.forEach(p => { if (p.id >= maxPId) maxPId = p.id; });
        this.cad.wires.forEach(w => { if (w.id >= maxWId) maxWId = w.id; });
        this.cad.nextPartId = maxPId + 1;
        this.cad.nextWireId = maxWId + 1;
        this.cad.render();
        return true;
      } catch (e) {
        return false;
      }
    }

    initEvents() {
      const modal = document.getElementById('projects-modal');
      const btnOpenModal = document.getElementById('btn-manage-projects');
      const btnCloseModal = document.getElementById('btn-close-projects');
      const btnSaveStorage = document.getElementById('btn-save-to-storage');
      const inputName = document.getElementById('input-project-name');
      const btnNewEmpty = document.getElementById('btn-new-empty-project');

      btnOpenModal?.addEventListener('click', () => {
        this.renderProjectsList();
        modal?.classList.add('visible');
      });

      btnCloseModal?.addEventListener('click', () => {
        modal?.classList.remove('visible');
      });

      btnSaveStorage?.addEventListener('click', () => {
        const name = inputName?.value || 'Meu Circuito ' + new Date().toLocaleDateString('pt-BR');
        if (this.saveProject(name)) {
          if (inputName) inputName.value = '';
          alert('Projeto "' + name + '" salvo com sucesso na memória do aparelho!');
        }
      });

      btnNewEmpty?.addEventListener('click', () => {
        if (confirm('Deseja iniciar um novo projeto em branco? Todo o quadro atual será limpo.')) {
          this.cad.clearAll();
          modal?.classList.remove('visible');
        }
      });
    }
  }

  // ==========================================================
  // 6. MULTÍMETRO DIGITAL TRUE RMS
  // ==========================================================
  class VirtualMultimeter {
    constructor(cadEngine, simulator) {
      this.cad = cadEngine;
      this.sim = simulator;
      this.active = false;
      this.mode = 'vac';

      this.container = document.getElementById('multimeter-widget');
      this.displayVal = document.getElementById('multi-val');
      this.displayMode = document.getElementById('multi-mode');
      this.displayStatus = document.getElementById('multi-status');

      this.initEvents();
    }

    toggle(forceState = null) {
      this.active = forceState !== null ? forceState : !this.active;
      this.cad.multimeterActive = this.active;
      if (this.container) this.container.classList.toggle('visible', this.active);

      if (!this.active) {
        sound.beep(false);
        this.cad.probeBlack = null;
        this.cad.probeRed = null;
      } else {
        const cx = this.cad.viewBox.x + this.cad.viewBox.w * 0.4;
        const cy = this.cad.viewBox.y + this.cad.viewBox.h * 0.4;
        this.cad.probeBlack = { x: cx - 40, y: cy, pid: null, tidx: null };
        this.cad.probeRed = { x: cx + 40, y: cy, pid: null, tidx: null };
      }
      this.cad.render();
    }

    update(report = null) {
      if (!this.active) return;
      if (!report) report = this.sim.analyze(this.cad.parts, this.cad.wires, true);
      const m = this.sim.measure(this.cad.probeBlack, this.cad.probeRed, report);

      if (this.mode === 'vac') {
        if (this.displayMode) this.displayMode.textContent = 'True RMS ~ VAC';
        if (this.displayVal) this.displayVal.textContent = m.text;
        if (this.displayStatus) this.displayStatus.textContent = m.type || 'Aguardando bornes';
        sound.beep(false);
      } else if (this.mode === 'cont') {
        if (this.displayMode) this.displayMode.textContent = 'Continuidade Ω / BIP';
        if (m.mode === 'continuity') {
          if (this.displayVal) this.displayVal.textContent = '0.1 Ω';
          if (this.displayStatus) this.displayStatus.textContent = 'Circuito Fechado (BIP)';
          sound.beep(true);
        } else {
          if (this.displayVal) this.displayVal.textContent = 'O.L';
          if (this.displayStatus) this.displayStatus.textContent = 'Circuito Aberto';
          sound.beep(false);
        }
      } else if (this.mode === 'amps') {
        if (this.displayMode) this.displayMode.textContent = 'Corrente A~';
        if (this.displayVal) this.displayVal.textContent = `${report.totalCurrent.toFixed(2)} A`;
        if (this.displayStatus) this.displayStatus.textContent = `Potência: ${report.totalPower} W`;
        sound.beep(false);
      }
    }

    initEvents() {
      document.getElementById('multi-close')?.addEventListener('click', () => this.toggle(false));
      document.querySelectorAll('[data-multi-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-multi-mode]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.mode = btn.dataset.multiMode;
          sound.playClick();
          this.update();
        });
      });
      document.getElementById('probe-black-btn')?.addEventListener('click', () => {
        this.cad.draggingProbe = 'black';
        alert('Clique no borne para conectar a ponta preta (COM).');
      });
      document.getElementById('probe-red-btn')?.addEventListener('click', () => {
        this.cad.draggingProbe = 'red';
        alert('Clique no borne para conectar a ponta vermelha (V/Ω).');
      });
    }
  }

  // ==========================================================
  // 7. ORQUESTRADOR DA APLICAÇÃO (APP)
  // ==========================================================
  class App {
    constructor() {
      this.boardElem = document.getElementById('board');
      this.simToggle = document.getElementById('sim-mode-toggle');
      this.voltageSelect = document.getElementById('system-voltage');

      this.sim = new CircuitSimulator();
      this.cad = new CadEngine(this.boardElem, {
        onSelectionChange: item => this.onSelectionChange(item),
        onTopologyChange: () => this.runSimulation(),
        onCursorMove: pt => this.updateCoordinates(pt)
      });

      this.exporter = new ExportManager(this.cad, this.sim);
      this.projectStorage = new ProjectStorageManager(this.cad, this.sim, () => this.runSimulation());
      this.multimeter = new VirtualMultimeter(this.cad, this.sim);

      this.initTheme();
      this.initUI();
      this.initPalettes();
      this.initExamples();

      const restored = this.projectStorage.tryRestoreAutoSave();
      if (!restored && this.cad.parts.length === 0) {
        this.loadExampleCircuit('mono-lamp');
      } else {
        this.runSimulation();
      }
    }

    initUI() {
      this.simToggle?.addEventListener('change', () => { sound.playClick(); this.runSimulation(); });
      this.voltageSelect?.addEventListener('change', e => { this.sim.setSystemVoltage(e.target.value); this.runSimulation(); });

      document.getElementById('wire-color-select')?.addEventListener('change', e => { this.cad.activeWireColor = e.target.value; });
      document.getElementById('wire-gauge-select')?.addEventListener('change', e => { this.cad.activeWireGauge = e.target.value; });

      document.getElementById('btn-undo')?.addEventListener('click', () => this.cad.undo());
      document.getElementById('btn-redo')?.addEventListener('click', () => this.cad.redo());
      document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.cad.zoomIn());
      document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.cad.zoomOut());
      document.getElementById('btn-fit-all')?.addEventListener('click', () => this.cad.fitAll());
      document.getElementById('btn-rotate')?.addEventListener('click', () => this.cad.rotateSelected());
      document.getElementById('btn-delete')?.addEventListener('click', () => this.cad.deleteSelected());
      document.getElementById('btn-duplicate')?.addEventListener('click', () => this.cad.duplicateSelected());
      document.getElementById('btn-clear-wires')?.addEventListener('click', () => {
        this.cad.saveHistory();
        this.cad.wires = [];
        this.cad.render();
        this.runSimulation();
      });
      document.getElementById('btn-clear-all')?.addEventListener('click', () => this.cad.clearAll());
      document.getElementById('btn-multimeter')?.addEventListener('click', () => this.multimeter.toggle());
      document.getElementById('btn-toggle-enclosure')?.addEventListener('click', () => {
        this.cad.showEnclosure = !this.cad.showEnclosure;
        const btn = document.getElementById('btn-toggle-enclosure');
        if (btn) btn.classList.toggle('active', this.cad.showEnclosure);
        sound.playClick();
        this.cad.render();
      });

      document.getElementById('btn-save-project')?.addEventListener('click', () => this.exporter.saveProjectToFile());
      const fileInput = document.getElementById('file-project-input');
      document.getElementById('btn-open-project')?.addEventListener('click', () => fileInput?.click());
      fileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          this.exporter.loadProjectFromFile(file, () => this.runSimulation());
          e.target.value = '';
        }
      });

      document.getElementById('btn-export-png')?.addEventListener('click', () => this.exporter.exportToPng());
      document.getElementById('btn-export-svg')?.addEventListener('click', () => this.exporter.exportToSvg());
      document.getElementById('btn-export-bom')?.addEventListener('click', () => this.showBOMModal());

      // Controles Móveis (Gavetas e Barra de Navegação Inferior)
      const sidebarLeft = document.querySelector('.sidebar:not(.right)');
      const sidebarRight = document.querySelector('.sidebar.right');
      const mobilePaletteBtn = document.getElementById('btn-mobile-palette');
      const mobileSimBtn = document.getElementById('btn-mobile-sim');
      const mobileDiagBtn = document.getElementById('btn-mobile-diag');
      const mobileProjectsBtn = document.getElementById('btn-mobile-projects');

      mobilePaletteBtn?.addEventListener('click', () => {
        sidebarLeft?.classList.toggle('open');
        sidebarRight?.classList.remove('open');
        mobilePaletteBtn.classList.toggle('active', sidebarLeft?.classList.contains('open'));
        mobileDiagBtn?.classList.remove('active');
      });

      document.getElementById('btn-close-left-sidebar')?.addEventListener('click', () => {
        sidebarLeft?.classList.remove('open');
        mobilePaletteBtn?.classList.remove('active');
      });

      mobileDiagBtn?.addEventListener('click', () => {
        sidebarRight?.classList.toggle('open');
        sidebarLeft?.classList.remove('open');
        mobileDiagBtn.classList.toggle('active', sidebarRight?.classList.contains('open'));
        mobilePaletteBtn?.classList.remove('active');
      });

      document.getElementById('btn-close-right-sidebar')?.addEventListener('click', () => {
        sidebarRight?.classList.remove('open');
        mobileDiagBtn?.classList.remove('active');
      });

      mobileSimBtn?.addEventListener('click', () => {
        if (this.simToggle) {
          this.simToggle.checked = !this.simToggle.checked;
          sound.playClick();
          this.runSimulation();
          mobileSimBtn.classList.toggle('active', this.simToggle.checked);
        }
      });

      mobileProjectsBtn?.addEventListener('click', () => {
        this.projectStorage.renderProjectsList();
        document.getElementById('projects-modal')?.classList.add('visible');
        sidebarLeft?.classList.remove('open');
        sidebarRight?.classList.remove('open');
      });

      const tabButtons = document.querySelectorAll('[data-palette-tab]');
      const tabPanels = document.querySelectorAll('.palette-tab-content');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          tabPanels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          document.getElementById(btn.dataset.paletteTab)?.classList.add('active');
        });
      });

      const modal = document.getElementById('bom-modal');
      document.getElementById('btn-close-bom')?.addEventListener('click', () => modal?.classList.remove('visible'));
      document.getElementById('btn-download-bom-csv')?.addEventListener('click', () => this.exporter.exportBOMToCsv());
    }

    initTheme() {
      const savedTheme = localStorage.getItem('qdc_pro_theme') || 'dark';
      this.setTheme(savedTheme);

      document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
        const isCurrentlyLight = document.body.classList.contains('light-theme');
        const newTheme = isCurrentlyLight ? 'dark' : 'light';
        this.setTheme(newTheme);
      });
    }

    setTheme(theme) {
      const btnTheme = document.getElementById('btn-theme-toggle');
      if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (btnTheme) btnTheme.innerHTML = '🌙 Escuro';
      } else {
        document.body.classList.remove('light-theme');
        if (btnTheme) btnTheme.innerHTML = '☀️ Claro';
      }
      localStorage.setItem('qdc_pro_theme', theme);
      if (this.cad) this.cad.render();
    }

    initPalettes() {
      const categories = {
        qdc: document.getElementById('tab-qdc-items'),
        command: document.getElementById('tab-command-items'),
        load: document.getElementById('tab-load-items'),
        bus: document.getElementById('tab-bus-items')
      };

      Object.entries(COMPONENT_DEFINITIONS).forEach(([kind, def]) => {
        const container = categories[def.category] || categories.qdc;
        if (!container) return;

        const btn = document.createElement('button');
        btn.className = 'palette-item-btn';
        btn.innerHTML = `
          <div class="item-name">${def.shortName}</div>
          <div class="item-sub">${def.categoryLabel}</div>
        `;
        btn.addEventListener('click', () => this.cad.addPart(kind));
        container.appendChild(btn);
      });
    }

    runSimulation() {
      const isSimActive = this.simToggle ? this.simToggle.checked : false;
      const report = this.sim.analyze(this.cad.parts, this.cad.wires, isSimActive);

      this.cad.render(report);
      this.multimeter.update(report);
      this.updateDiagnostics(report);
      this.updateHeaderStats(report);

      if (this.projectStorage) {
        this.projectStorage.autoSave();
      }
    }

    updateDiagnostics(report) {
      const summaryBox = document.getElementById('diagnostic-summary');
      const warningList = document.getElementById('diagnostic-warnings');
      const loadList = document.getElementById('diagnostic-loads');
      const complianceList = document.getElementById('diagnostic-compliance');

      if (!summaryBox) return;

      if (!report.active) {
        summaryBox.className = 'diag-card warn';
        summaryBox.innerHTML = `<strong>⚠️ Simulação Desligada</strong><p>Ative a chave "Simular Corrente Real" para calcular tensões, curto-circuito e cargas.</p>`;
        if (warningList) warningList.innerHTML = '<li>Simulação em pausa.</li>';
        if (loadList) loadList.innerHTML = '<li>Nenhuma carga ativa.</li>';
        if (complianceList) complianceList.innerHTML = '';
        return;
      }

      if (report.hasShort) {
        summaryBox.className = 'diag-card err';
        summaryBox.innerHTML = `
          <strong>🚨 ALERTA CRÍTICO: CURTO-CIRCUITO DETECTADO!</strong>
          <p>A energia foi cortada para prevenir incêndio e danos aos equipamentos.</p>
          <div class="short-details">${report.shorts.join('<br>')}</div>
          <small>Os condutores em curto estão piscando em vermelho na tela. Disfaça a ligação direta.</small>
        `;
        if (warningList) {
          warningList.innerHTML = report.shorts.map(s => `<li class="err-text">${s}</li>`).join('');
        }
        return;
      }

      if (report.loads.length > 0) {
        summaryBox.className = 'diag-card ok';
        summaryBox.innerHTML = `
          <strong>✅ Circuito em Operação Normal</strong>
          <p>${report.loads.length} carga(s) alimentadas perfeitamente. Nenhuma falha detectada.</p>
        `;
      } else {
        summaryBox.className = 'diag-card warn';
        summaryBox.innerHTML = `
          <strong>ℹ️ Circuito Energizado (Sem Cargas Ativas)</strong>
          <p>A tensão está presente, mas nenhuma carga está com circuito fechado.</p>
        `;
      }

      if (loadList) {
        if (report.loads.length === 0) loadList.innerHTML = '<li>Nenhuma carga consumindo energia no momento.</li>';
        else loadList.innerHTML = report.loads.map(ld => `<li><strong>${ld.name}</strong>: ${ld.power}W | ${ld.current.toFixed(2)}A (${ld.voltage}V)</li>`).join('');
      }

      if (warningList) {
        if (report.warnings.length === 0) warningList.innerHTML = '<li class="ok-text">Nenhum aviso técnico ou sobrecarga detectada.</li>';
        else warningList.innerHTML = report.warnings.map(w => `<li class="warn-text">${w}</li>`).join('');
      }

      if (complianceList) {
        if (report.compliance.length === 0) complianceList.innerHTML = '<li class="ok-text">Cores e condutores em conformidade com a NBR 5410.</li>';
        else complianceList.innerHTML = report.compliance.map(c => `<li class="compliance-text">${c}</li>`).join('');
      }
    }

    updateHeaderStats(report) {
      const statPower = document.getElementById('stat-power');
      const statCurrent = document.getElementById('stat-current');
      const statStatus = document.getElementById('stat-status');

      if (statPower) statPower.textContent = `${report.totalPower} W`;
      if (statCurrent) statCurrent.textContent = `${report.totalCurrent.toFixed(2)} A`;
      if (statStatus) {
        if (!report.active) {
          statStatus.textContent = 'Pausa';
          statStatus.className = 'badge-stat off';
        } else if (report.hasShort) {
          statStatus.textContent = 'CURTO!';
          statStatus.className = 'badge-stat danger';
        } else {
          statStatus.textContent = 'OK / Seguro';
          statStatus.className = 'badge-stat ok';
        }
      }
    }

    updateCoordinates(pt) {
      const coordElem = document.getElementById('coord-display');
      if (coordElem) coordElem.textContent = `X: ${Math.round(pt.x)} | Y: ${Math.round(pt.y)}`;
    }

    onSelectionChange(selectedItem) {
      const propPanel = document.getElementById('properties-panel');
      const propTitle = document.getElementById('prop-title');
      const propContent = document.getElementById('prop-content');

      if (!propPanel) return;
      if (!selectedItem) { propPanel.classList.remove('active'); return; }

      propPanel.classList.add('active');

      if (this.cad.selected.type === 'part') {
        const p = selectedItem;
        if (propTitle) propTitle.textContent = `${p.shortName || p.name} (#${p.id})`;

        let html = `
          <div class="prop-group">
            <label>Identificação / Rótulo</label>
            <input type="text" id="prop-part-name" value="${p.shortName || p.name}">
          </div>
          <div class="prop-group">
            <label>Orientação</label>
            <select id="prop-part-orientation">
              <option value="vertical" ${p.orientation === 'vertical' ? 'selected' : ''}>Vertical</option>
              <option value="horizontal" ${p.orientation === 'horizontal' ? 'selected' : ''}>Horizontal</option>
            </select>
          </div>
        `;

        if (['breaker1', 'breaker2', 'breaker3'].includes(p.kind)) {
          html += `
            <div class="prop-group">
              <label>Corrente Nominal (In)</label>
              <select id="prop-breaker-rating">
                <option value="10" ${p.props.rating === 10 ? 'selected' : ''}>10 A</option>
                <option value="16" ${p.props.rating === 16 ? 'selected' : ''}>16 A</option>
                <option value="20" ${p.props.rating === 20 ? 'selected' : ''}>20 A</option>
                <option value="32" ${p.props.rating === 32 ? 'selected' : ''}>32 A</option>
                <option value="50" ${p.props.rating === 50 ? 'selected' : ''}>50 A</option>
              </select>
            </div>
          `;
        }

        if (p.kind === 'switch_parallel') {
          html += `
            <div class="prop-group">
              <label>Posição dos Bornes</label>
              <select id="prop-switch-inverted">
                <option value="false" ${!p.props?.inverted ? 'selected' : ''}>Padrão (Comum ◄ / Paralelos ►)</option>
                <option value="true" ${p.props?.inverted ? 'selected' : ''}>Invertido (Paralelos ◄ / Comum ►)</option>
              </select>
            </div>
          `;
        }

        const isLoad = ['lamp_led', 'shower', 'fan', 'motor', 'socket_tug', 'socket_tue'].includes(p.kind);
        if (isLoad) {
          const currentWatts = p.props.watts || (p.kind === 'shower' ? 5500 : (p.kind === 'lamp_led' ? 15 : (p.kind === 'motor' ? 750 : (p.kind === 'fan' ? 120 : (p.kind === 'socket_tue' ? 2200 : 200)))));
          p.props.watts = currentWatts;
          const v = this.sim.systemVoltage || 220;
          const calcCurrent = (currentWatts / v).toFixed(2);
          const isLight = p.kind === 'lamp_led';
          const dim = getCableDimensioning(Number(calcCurrent), isLight);

          html += `
            <div class="prop-group">
              <label>Potência Nominal (Watts)</label>
              <input type="number" id="prop-load-watts" value="${currentWatts}" min="1" max="15000" step="5">
            </div>
            <div class="dimensioning-box" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; margin-top: 10px; font-size: 11px;">
              <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                📐 Dimensionamento NBR 5410:
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-muted);">Corrente Calculada:</span>
                <strong style="color: #f8fafc;" id="dim-calc-current">${calcCurrent} A (${v}V)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: var(--text-muted);">Bitola Mínima Cabo:</span>
                <strong style="color: #4ade80;" id="dim-min-gauge">${dim.gauge} mm² (${dim.ampacity}A máx)</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Disjuntor Recomendado:</span>
                <strong style="color: #fde047;" id="dim-rec-breaker">Curva C (${dim.recommendedBreaker}A)</strong>
              </div>
            </div>
          `;
        }

        if (propContent) propContent.innerHTML = html;

        document.getElementById('prop-part-name')?.addEventListener('input', e => {
          p.shortName = e.target.value;
          this.cad.render();
        });
        document.getElementById('prop-part-orientation')?.addEventListener('change', e => {
          p.orientation = e.target.value;
          this.cad.updatePartGeometry(p);
          this.cad.render();
          this.runSimulation();
        });
        document.getElementById('prop-breaker-rating')?.addEventListener('change', e => {
          p.props.rating = Number(e.target.value);
          this.cad.render();
          this.runSimulation();
        });
        document.getElementById('prop-switch-inverted')?.addEventListener('change', e => {
          p.props.inverted = e.target.value === 'true';
          this.cad.updatePartGeometry(p);
          this.cad.render();
          this.runSimulation();
        });
        document.getElementById('prop-load-watts')?.addEventListener('input', e => {
          const val = Number(e.target.value);
          if (val > 0) {
            p.props.watts = val;
            this.cad.render();
            this.runSimulation();
            const v = this.sim.systemVoltage || 220;
            const newI = (val / v).toFixed(2);
            const newDim = getCableDimensioning(Number(newI), p.kind === 'lamp_led');
            const elCurrent = document.getElementById('dim-calc-current');
            const elGauge = document.getElementById('dim-min-gauge');
            const elBreaker = document.getElementById('dim-rec-breaker');
            if (elCurrent) elCurrent.textContent = `${newI} A (${v}V)`;
            if (elGauge) elGauge.textContent = `${newDim.gauge} mm² (${newDim.ampacity}A máx)`;
            if (elBreaker) elBreaker.textContent = `Curva C (${newDim.recommendedBreaker}A)`;
          }
        });
      } else if (this.cad.selected.type === 'wire') {
        const w = selectedItem;
        if (propTitle) propTitle.textContent = `Condutor #${w.id}`;

        let html = `
          <div class="prop-group">
            <label>Função / Cor do Fio</label>
            <select id="prop-wire-color">
              ${Object.entries(WIRE_COLORS).map(([k, c]) => `
                <option value="${k}" ${w.color === k ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="prop-group">
            <label>Bitola da Seção (mm²)</label>
            <select id="prop-wire-gauge">
              <option value="1.5" ${w.gauge === '1.5' ? 'selected' : ''}>1,5 mm²</option>
              <option value="2.5" ${w.gauge === '2.5' ? 'selected' : ''}>2,5 mm²</option>
              <option value="4.0" ${w.gauge === '4.0' ? 'selected' : ''}>4,0 mm²</option>
              <option value="6.0" ${w.gauge === '6.0' ? 'selected' : ''}>6,0 mm²</option>
              <option value="10.0" ${w.gauge === '10.0' ? 'selected' : ''}>10,0 mm²</option>
            </select>
          </div>
          <button id="btn-add-wire-junction" class="btn-icon success" style="width: 100%; margin-top: 10px; font-weight: bold;">⚡ Inserir Nó de Emenda / Derivação</button>
        `;

        if (propContent) propContent.innerHTML = html;

        document.getElementById('prop-wire-color')?.addEventListener('change', e => {
          w.color = e.target.value;
          this.cad.render();
          this.runSimulation();
        });
        document.getElementById('prop-wire-gauge')?.addEventListener('change', e => {
          w.gauge = e.target.value;
          this.cad.render();
          this.runSimulation();
        });
        document.getElementById('btn-add-wire-junction')?.addEventListener('click', () => {
          const pA = this.cad.parts.find(p => p.id === w.a.pid);
          const pB = this.cad.parts.find(p => p.id === w.b.pid);
          if (!pA || !pB) return;
          const tA = pA.terms[w.a.idx];
          const tB = pB.terms[w.b.idx];
          const midX = this.cad.snap((pA.x + tA.x + pB.x + tB.x) / 2);
          const midY = this.cad.snap((pA.y + tA.y + pB.y + tB.y) / 2);
          this.cad.spliceWireAt(w, { x: midX, y: midY });
        });
      }
    }

    showBOMModal() {
      const modal = document.getElementById('bom-modal');
      const tableBody = document.getElementById('bom-table-body');
      if (!modal || !tableBody) return;

      const bom = this.exporter.generateBOM();
      let rowsHtml = '';
      Object.entries(bom.parts).forEach(([name, count]) => {
        rowsHtml += `<tr><td><span class="badge-type comp">Componente</span></td><td>${name}</td><td><strong>${count} un</strong></td></tr>`;
      });
      Object.entries(bom.wires).forEach(([name, data]) => {
        rowsHtml += `<tr><td><span class="badge-type wire">Condutor</span></td><td>Cabo ${name}</td><td><strong>${data.lengthMeters.toFixed(1)} m</strong> (${data.segments} trechos)</td></tr>`;
      });

      tableBody.innerHTML = rowsHtml || '<tr><td colspan="3">Nenhum componente no projeto.</td></tr>';
      modal.classList.add('visible');
    }

    initExamples() {
      document.getElementById('example-mono-lamp')?.addEventListener('click', () => this.loadExampleCircuit('mono-lamp'));
      document.getElementById('example-double-switch')?.addEventListener('click', () => this.loadExampleCircuit('double-switch'));
      document.getElementById('example-parallel')?.addEventListener('click', () => this.loadExampleCircuit('parallel'));
      document.getElementById('example-qdc-complete')?.addEventListener('click', () => this.loadExampleCircuit('qdc-complete'));
    }

    loadExampleCircuit(type) {
      this.cad.clearAll();

      if (type === 'double-switch') {
        this.cad.addPart('source_mono');
        const src = this.cad.parts[0];
        src.x = 60; src.y = 120;

        this.cad.addPart('breaker1');
        const dj = this.cad.parts[1];
        dj.x = 240; dj.y = 120;
        dj.props.rating = 10;

        this.cad.addPart('switch_double');
        const sw = this.cad.parts[2];
        sw.x = 420; sw.y = 120;
        sw.props.key1On = true;
        sw.props.key2On = false;

        this.cad.addPart('lamp_led');
        const lamp1 = this.cad.parts[3];
        lamp1.shortName = 'LÂMPADA 1';
        lamp1.x = 640; lamp1.y = 70;

        this.cad.addPart('lamp_led');
        const lamp2 = this.cad.parts[4];
        lamp2.shortName = 'LÂMPADA 2';
        lamp2.x = 640; lamp2.y = 230;

        this.cad.addPart('neutral_bus');
        const nbus = this.cad.parts[5];
        nbus.x = 240; nbus.y = 310;

        // Fios
        this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: dj.id, idx: 0 }, points: [{ x: 150, y: 144 }, { x: 275, y: 80 }], color: 'f1', gauge: '2.5' });
        this.cad.wires.push({ id: 2, a: { pid: dj.id, idx: 1 }, b: { pid: sw.id, idx: 0 }, points: [{ x: 275, y: 260 }, { x: 380, y: 147 }], color: 'f1', gauge: '1.5' });
        this.cad.wires.push({ id: 3, a: { pid: sw.id, idx: 0 }, b: { pid: sw.id, idx: 2 }, points: [{ x: 400, y: 147 }, { x: 400, y: 183 }], color: 'f1', gauge: '1.5' });
        this.cad.wires.push({ id: 4, a: { pid: sw.id, idx: 1 }, b: { pid: lamp1.id, idx: 0 }, points: [{ x: 540, y: 147 }, { x: 540, y: 110 }], color: 'ret', gauge: '1.5' });
        this.cad.wires.push({ id: 5, a: { pid: sw.id, idx: 3 }, b: { pid: lamp2.id, idx: 0 }, points: [{ x: 540, y: 183 }, { x: 540, y: 270 }], color: 'ret2', gauge: '1.5' });
        this.cad.wires.push({ id: 6, a: { pid: src.id, idx: 1 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 140, y: 168 }, { x: 140, y: 333 }], color: 'n', gauge: '2.5' });
        this.cad.wires.push({ id: 7, a: { pid: nbus.id, idx: 3 }, b: { pid: lamp1.id, idx: 1 }, points: [{ x: 345, y: 390 }, { x: 740, y: 390 }, { x: 740, y: 115 }], color: 'n', gauge: '1.5' });
        this.cad.wires.push({ id: 8, a: { pid: nbus.id, idx: 4 }, b: { pid: lamp2.id, idx: 1 }, points: [{ x: 380, y: 390 }, { x: 740, y: 390 }, { x: 740, y: 275 }], color: 'n', gauge: '1.5' });

        this.cad.nextPartId = 7;
        this.cad.nextWireId = 9;
        this.cad.fitAll();
        this.runSimulation();
      } else

      if (type === 'mono-lamp') {
        this.cad.addPart('source_mono');
        const src = this.cad.parts[0];
        src.x = 80; src.y = 120;

        this.cad.addPart('breaker1');
        const dj = this.cad.parts[1];
        dj.x = 260; dj.y = 120;

        this.cad.addPart('switch_simple');
        const sw = this.cad.parts[2];
        sw.x = 420; sw.y = 120;
        sw.props.isOn = true;

        this.cad.addPart('lamp_led');
        const lamp = this.cad.parts[3];
        lamp.x = 600; lamp.y = 120;

        this.cad.addPart('neutral_bus');
        const nbus = this.cad.parts[4];
        nbus.x = 260; nbus.y = 300;

        this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: dj.id, idx: 0 }, points: [{ x: 180, y: 144 }, { x: 295, y: 80 }], color: 'f1', gauge: '2.5' });
        this.cad.wires.push({ id: 2, a: { pid: dj.id, idx: 1 }, b: { pid: sw.id, idx: 0 }, points: [{ x: 295, y: 260 }, { x: 380, y: 160 }], color: 'f1', gauge: '1.5' });
        this.cad.wires.push({ id: 3, a: { pid: sw.id, idx: 1 }, b: { pid: lamp.id, idx: 0 }, points: [], color: 'ret', gauge: '1.5' });
        this.cad.wires.push({ id: 4, a: { pid: src.id, idx: 1 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 160, y: 168 }, { x: 160, y: 323 }], color: 'n', gauge: '2.5' });
        this.cad.wires.push({ id: 5, a: { pid: nbus.id, idx: 4 }, b: { pid: lamp.id, idx: 1 }, points: [{ x: 385, y: 380 }, { x: 740, y: 380 }, { x: 740, y: 165 }], color: 'n', gauge: '1.5' });

        this.cad.nextPartId = 6;
        this.cad.nextWireId = 6;
        this.cad.fitAll();
        this.runSimulation();
      } else if (type === 'parallel') {
        this.cad.addPart('source_mono');
        const src = this.cad.parts[0];
        src.x = 60; src.y = 120;

        this.cad.addPart('breaker1');
        const dj = this.cad.parts[1];
        dj.x = 240; dj.y = 120;

        this.cad.addPart('switch_parallel');
        const sw1 = this.cad.parts[2];
        sw1.x = 380; sw1.y = 120;
        sw1.props.position = 1;

        this.cad.addPart('switch_parallel');
        const sw2 = this.cad.parts[3];
        sw2.x = 560; sw2.y = 120;
        sw2.props.position = 1;
        sw2.props.inverted = true;
        this.cad.updatePartGeometry(sw2);

        this.cad.addPart('lamp_led');
        const lamp = this.cad.parts[4];
        lamp.x = 740; lamp.y = 120;

        this.cad.addPart('neutral_bus');
        const nbus = this.cad.parts[5];
        nbus.x = 240; nbus.y = 300;

        this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: dj.id, idx: 0 }, points: [{ x: 150, y: 144 }, { x: 275, y: 80 }], color: 'f1', gauge: '2.5' });
        this.cad.wires.push({ id: 2, a: { pid: dj.id, idx: 1 }, b: { pid: sw1.id, idx: 0 }, points: [{ x: 275, y: 260 }, { x: 340, y: 160 }], color: 'f1', gauge: '1.5' });
        this.cad.wires.push({ id: 3, a: { pid: sw1.id, idx: 1 }, b: { pid: sw2.id, idx: 1 }, points: [], color: 'ret2', gauge: '1.5' });
        this.cad.wires.push({ id: 4, a: { pid: sw1.id, idx: 2 }, b: { pid: sw2.id, idx: 2 }, points: [], color: 'ret2', gauge: '1.5' });
        this.cad.wires.push({ id: 5, a: { pid: sw2.id, idx: 0 }, b: { pid: lamp.id, idx: 0 }, points: [], color: 'ret', gauge: '1.5' });
        this.cad.wires.push({ id: 6, a: { pid: src.id, idx: 1 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 140, y: 168 }, { x: 140, y: 323 }], color: 'n', gauge: '2.5' });
        this.cad.wires.push({ id: 7, a: { pid: nbus.id, idx: 4 }, b: { pid: lamp.id, idx: 1 }, points: [{ x: 365, y: 380 }, { x: 830, y: 380 }], color: 'n', gauge: '1.5' });

        this.cad.nextPartId = 7;
        this.cad.nextWireId = 8;
        this.cad.fitAll();
        this.runSimulation();
      } else if (type === 'qdc-complete') {
        this.cad.showEnclosure = true;
        const btnEnc = document.getElementById('btn-toggle-enclosure');
        if (btnEnc) btnEnc.classList.add('active');

        // TRILHO 1 (Superior, Y=155): DPS 3P + Disjuntor 2P Geral + IDR 4P Tetrapolar
        this.cad.addPart('spd3');
        const dps3 = this.cad.parts[this.cad.parts.length - 1];
        dps3.x = 180; dps3.y = 115;
        dps3.shortName = 'DPS 3P (45kA)';

        this.cad.addPart('breaker2');
        const djGeral = this.cad.parts[this.cad.parts.length - 1];
        djGeral.x = 325; djGeral.y = 110;
        djGeral.shortName = 'GERAL 2P';
        djGeral.props.rating = 50;

        this.cad.addPart('rcd4');
        const idr1 = this.cad.parts[this.cad.parts.length - 1];
        idr1.x = 445; idr1.y = 105;
        idr1.shortName = 'IDR GERAL 4P';
        idr1.props.rating = 63;

        // TRILHO 2 (Intermediário, Y=365): 2 Disjuntores 2P + 5 Disjuntores 1P + Barramento Pente
        this.cad.addPart('breaker2');
        const djBi1 = this.cad.parts[this.cad.parts.length - 1];
        djBi1.x = 180; djBi1.y = 325;
        djBi1.shortName = 'CIR 1 (2P 32A)';
        djBi1.props.rating = 32;

        this.cad.addPart('breaker2');
        const djBi2 = this.cad.parts[this.cad.parts.length - 1];
        djBi2.x = 290; djBi2.y = 325;
        djBi2.shortName = 'CIR 2 (2P 25A)';
        djBi2.props.rating = 25;

        this.cad.addPart('breaker1');
        const djMono1 = this.cad.parts[this.cad.parts.length - 1];
        djMono1.x = 400; djMono1.y = 325;
        djMono1.shortName = 'ILUM. 1 (10A)';
        djMono1.props.rating = 10;

        this.cad.addPart('breaker1');
        const djMono2 = this.cad.parts[this.cad.parts.length - 1];
        djMono2.x = 480; djMono2.y = 325;
        djMono2.shortName = 'ILUM. 2 (10A)';
        djMono2.props.rating = 10;

        this.cad.addPart('breaker1');
        const djMono3 = this.cad.parts[this.cad.parts.length - 1];
        djMono3.x = 560; djMono3.y = 325;
        djMono3.shortName = 'TUG SALA (16A)';
        djMono3.props.rating = 16;

        this.cad.addPart('breaker1');
        const djMono4 = this.cad.parts[this.cad.parts.length - 1];
        djMono4.x = 640; djMono4.y = 325;
        djMono4.shortName = 'TUG COZ. (20A)';
        djMono4.props.rating = 20;

        this.cad.addPart('comb_1p');
        const pente = this.cad.parts[this.cad.parts.length - 1];
        pente.x = 400; pente.y = 290;

        // TRILHO 3 (Inferior, Y=575): IDR 4P + 2 Disjuntores 2P
        this.cad.addPart('rcd4');
        const idr2 = this.cad.parts[this.cad.parts.length - 1];
        idr2.x = 180; idr2.y = 525;
        idr2.shortName = 'IDR PARCIAL 4P';
        idr2.props.rating = 40;

        this.cad.addPart('breaker2');
        const djBi3 = this.cad.parts[this.cad.parts.length - 1];
        djBi3.x = 360; djBi3.y = 535;
        djBi3.shortName = 'CHUVEIRO 1 (32A)';
        djBi3.props.rating = 32;

        this.cad.addPart('breaker2');
        const djBi4 = this.cad.parts[this.cad.parts.length - 1];
        djBi4.x = 475; djBi4.y = 535;
        djBi4.shortName = 'AR COND. (20A)';
        djBi4.props.rating = 20;

        // FUNDO DO QUADRO (Y=740): Barramento Terra PE e Barramento Neutro N
        this.cad.addPart('earth_bus');
        const ebus = this.cad.parts[this.cad.parts.length - 1];
        ebus.x = 330; ebus.y = 730;

        this.cad.addPart('neutral_bus');
        const nbus = this.cad.parts[this.cad.parts.length - 1];
        nbus.x = 540; nbus.y = 730;

        // Fios de Aterramento dos DPS para o Barramento de Terra
        this.cad.wires.push({
          id: 1, a: { pid: dps3.id, idx: 3 }, b: { pid: ebus.id, idx: 0 },
          points: [{ x: 201, y: 720 }, { x: 310, y: 720 }],
          color: 'pe', gauge: '10.0'
        });
        this.cad.wires.push({
          id: 2, a: { pid: dps3.id, idx: 4 }, b: { pid: ebus.id, idx: 1 },
          points: [{ x: 242, y: 740 }, { x: 330, y: 740 }],
          color: 'pe', gauge: '10.0'
        });
        this.cad.wires.push({
          id: 3, a: { pid: dps3.id, idx: 5 }, b: { pid: ebus.id, idx: 2 },
          points: [{ x: 284, y: 760 }, { x: 360, y: 760 }],
          color: 'pe', gauge: '10.0'
        });

        // Interligação Geral para IDR
        this.cad.wires.push({
          id: 4, a: { pid: djGeral.id, idx: 2 }, b: { pid: idr1.id, idx: 0 },
          points: [{ x: 353, y: 240 }, { x: 440, y: 240 }, { x: 440, y: 70 }, { x: 469, y: 70 }],
          color: 'f1', gauge: '10.0'
        });
        this.cad.wires.push({
          id: 5, a: { pid: djGeral.id, idx: 3 }, b: { pid: idr1.id, idx: 1 },
          points: [{ x: 392, y: 250 }, { x: 460, y: 250 }, { x: 460, y: 80 }, { x: 503, y: 80 }],
          color: 'f2', gauge: '10.0'
        });

        // Interligação do Neutro do IDR para o Barramento de Neutro
        this.cad.wires.push({
          id: 6, a: { pid: idr1.id, idx: 7 }, b: { pid: nbus.id, idx: 0 },
          points: [{ x: 573, y: 250 }, { x: 740, y: 250 }, { x: 740, y: 720 }, { x: 530, y: 720 }],
          color: 'n', gauge: '10.0'
        });

        this.cad.nextPartId = 20;
        this.cad.nextWireId = 15;
        this.cad.fitAll();
        this.runSimulation();
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.qdcApp = new App();
  });
})();
