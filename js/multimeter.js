/**
 * QDC Lab Pro - Instrumentação Virtual: Multímetro Digital True RMS
 */
import { sound } from './audio.js';

export class VirtualMultimeter {
  constructor(cadEngine, simulator) {
    this.cad = cadEngine;
    this.sim = simulator;
    this.active = false;
    this.mode = 'vac'; // 'vac', 'vdc', 'cont', 'amps'
    this.lastBeeping = false;

    this.container = document.getElementById('multimeter-widget');
    this.displayVal = document.getElementById('multi-val');
    this.displayMode = document.getElementById('multi-mode');
    this.displayStatus = document.getElementById('multi-status');

    this.initEvents();
  }

  toggle(forceState = null) {
    this.active = forceState !== null ? forceState : !this.active;
    this.cad.multimeterActive = this.active;

    if (this.container) {
      this.container.classList.toggle('visible', this.active);
    }

    if (!this.active) {
      sound.beep(false);
      this.lastBeeping = false;
      this.cad.probeBlack = null;
      this.cad.probeRed = null;
    } else {
      // Posiciona as pontas de prova no centro da tela inicialmente
      const cx = this.cad.viewBox.x + this.cad.viewBox.w * 0.4;
      const cy = this.cad.viewBox.y + this.cad.viewBox.h * 0.4;
      this.cad.probeBlack = { x: cx - 40, y: cy, pid: null, tidx: null };
      this.cad.probeRed = { x: cx + 40, y: cy, pid: null, tidx: null };
    }

    this.cad.render();
  }

  setMode(mode) {
    this.mode = mode;
    sound.playClick();
    this.update();
  }

  update(report = null) {
    if (!this.active) return;

    if (!report) {
      report = this.sim.analyze(this.cad.parts, this.cad.wires, true);
    }

    const measurement = this.sim.measure(this.cad.probeBlack, this.cad.probeRed, report);

    if (this.mode === 'vac') {
      if (this.displayMode) this.displayMode.textContent = 'True RMS ~ VAC';
      if (this.displayVal) this.displayVal.textContent = measurement.text;
      if (this.displayStatus) this.displayStatus.textContent = measurement.type || 'Aguardando medição';
      sound.beep(false);
      this.lastBeeping = false;
    } else if (this.mode === 'cont') {
      if (this.displayMode) this.displayMode.textContent = 'Continuidade Ω / BIP';
      if (measurement.mode === 'continuity') {
        if (this.displayVal) this.displayVal.textContent = '0.1 Ω';
        if (this.displayStatus) this.displayStatus.textContent = 'Circuito Fechado (Continuidade OK)';
        sound.beep(true);
        this.lastBeeping = true;
      } else {
        if (this.displayVal) this.displayVal.textContent = 'O.L (Aberto)';
        if (this.displayStatus) this.displayStatus.textContent = 'Circuito Aberto';
        sound.beep(false);
        this.lastBeeping = false;
      }
    } else if (this.mode === 'amps') {
      if (this.displayMode) this.displayMode.textContent = 'Corrente A~';
      if (this.displayVal) this.displayVal.textContent = `${report.totalCurrent.toFixed(2)} A`;
      if (this.displayStatus) this.displayStatus.textContent = `Potência: ${report.totalPower} W`;
      sound.beep(false);
      this.lastBeeping = false;
    }
  }

  initEvents() {
    const btnClose = document.getElementById('multi-close');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.toggle(false));
    }

    const modeButtons = document.querySelectorAll('[data-multi-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.multiMode);
      });
    });

    const btnProbeBlack = document.getElementById('probe-black-btn');
    if (btnProbeBlack) {
      btnProbeBlack.addEventListener('click', () => {
        this.cad.draggingProbe = 'black';
        alert('Clique no borne que deseja conectar a Ponta Preta (COM).');
      });
    }

    const btnProbeRed = document.getElementById('probe-red-btn');
    if (btnProbeRed) {
      btnProbeRed.addEventListener('click', () => {
        this.cad.draggingProbe = 'red';
        alert('Clique no borne que deseja conectar a Ponta Vermelha (V/Ω).');
      });
    }
  }
}
