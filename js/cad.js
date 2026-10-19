/**
 * QDC Lab Pro - Motor CAD & Renderização Interativa Vetorial SVG
 */
import { WIRE_COLORS, COMPONENT_DEFINITIONS } from './components.js';
import { sound } from './audio.js';

const NS = 'http://www.w3.org/2000/svg';

export class CadEngine {
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.options = options;

    // Estado do Canvas
    this.parts = [];
    this.wires = [];
    this.nextPartId = 1;
    this.nextWireId = 1;

    // Viewport & Navegação
    this.viewBox = { x: 0, y: 0, w: 1400, h: 900 };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.gridSize = 20;
    this.snapEnabled = true;

    // Seleção e Arrastos
    this.selected = null; // { type: 'part'|'wire', id: number }
    this.draggingPart = null;
    this.dragOffset = { x: 0, y: 0 };

    // Fiação
    this.drawingWire = null; // { from: { pid, idx }, points: [], color, gauge }
    this.activeWireColor = 'f1';
    this.activeWireGauge = '2.5';

    // Histórico de Undo / Redo
    this.undoStack = [];
    this.redoStack = [];

    // Multímetro (Pontas de Prova)
    this.multimeterActive = false;
    this.probeBlack = null; // { pid, tidx, x, y }
    this.probeRed = null;   // { pid, tidx, x, y }
    this.draggingProbe = null; // 'black' | 'red'

    // Callbacks
    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onTopologyChange = options.onTopologyChange || (() => {});
    this.onCursorMove = options.onCursorMove || (() => {});

    this.initDOM();
    this.initEvents();
  }

  initDOM() {
    this.svg.innerHTML = `
      <defs>
        <pattern id="cad-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1.2" fill="#94a3b8" opacity="0.35"/>
        </pattern>
        <pattern id="cad-grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#cad-grid-small)"/>
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#64748b" stroke-width="0.8" opacity="0.25"/>
        </pattern>

        <linearGradient id="body-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f1f5f9"/>
        </linearGradient>

        <linearGradient id="din-rail-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#cbd5e1"/>
          <stop offset="50%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>

        <linearGradient id="bus-copper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>

        <filter id="cad-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.18"/>
        </filter>

        <filter id="glow-light" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id="short-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feFlood flood-color="#ef4444" result="color"/>
          <feComposite in2="blur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect id="cad-bg" width="100%" height="100%" fill="#0b1017"/>
      <rect id="cad-grid-bg" width="100%" height="100%" fill="url(#cad-grid-large)"/>

      <g id="viewport-group">
        <g id="wires-layer"></g>
        <g id="parts-layer"></g>
        <g id="effects-layer"></g>
        <g id="overlay-layer"></g>
        <g id="probes-layer"></g>
      </g>
    `;

    this.viewport = this.svg.querySelector('#viewport-group');
    this.wiresLayer = this.svg.querySelector('#wires-layer');
    this.partsLayer = this.svg.querySelector('#parts-layer');
    this.effectsLayer = this.svg.querySelector('#effects-layer');
    this.overlayLayer = this.svg.querySelector('#overlay-layer');
    this.probesLayer = this.svg.querySelector('#probes-layer');

    this.updateViewBox();
  }

  updateViewBox() {
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
  }

  // Utilitário para criar elementos SVG
  el(tag, attrs = {}, text = '') {
    const elem = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => elem.setAttribute(k, v));
    if (text) elem.textContent = text;
    return elem;
  }

  snap(val) {
    if (!this.snapEnabled) return val;
    return Math.round(val / this.gridSize) * this.gridSize;
  }

  clientToSvg(e) {
    const pt = this.svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  saveHistory() {
    const snapshot = {
      parts: JSON.parse(JSON.stringify(this.parts)),
      wires: JSON.parse(JSON.stringify(this.wires)),
      nextPartId: this.nextPartId,
      nextWireId: this.nextWireId
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const current = {
      parts: JSON.parse(JSON.stringify(this.parts)),
      wires: JSON.parse(JSON.stringify(this.wires)),
      nextPartId: this.nextPartId,
      nextWireId: this.nextWireId
    };
    this.redoStack.push(current);

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
    const current = {
      parts: JSON.parse(JSON.stringify(this.parts)),
      wires: JSON.parse(JSON.stringify(this.wires)),
      nextPartId: this.nextPartId,
      nextWireId: this.nextWireId
    };
    this.undoStack.push(current);

    const next = this.redoStack.pop();
    this.parts = next.parts;
    this.wires = next.wires;
    this.nextPartId = next.nextPartId;
    this.nextWireId = next.nextWireId;
    this.selected = null;
    this.render();
    this.onTopologyChange();
  }

  // ==========================================
  // MANIPULAÇÃO DE PEÇAS
  // ==========================================
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

    let w = def.w;
    let h = def.h;

    // Se estiver na orientação horizontal, inverte e ajusta os terminais
    if (p.orientation === 'horizontal') {
      p.terms = def.terms.map((t, idx) => ({
        id: t.id,
        label: t.label,
        type: t.type,
        idx,
        x: t.y,
        y: t.x
      }));
      p.w = h;
      p.h = w;
    } else {
      p.terms = def.terms.map((t, idx) => ({
        id: t.id,
        label: t.label,
        type: t.type,
        idx,
        x: t.x,
        y: t.y
      }));
      p.w = w;
      p.h = h;
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

  // ==========================================
  // RENDERIZAÇÃO GERAL
  // ==========================================
  render(simulationReport = null) {
    this.wiresLayer.innerHTML = '';
    this.partsLayer.innerHTML = '';
    this.effectsLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';

    // 1. Renderiza Fios
    this.renderWires(simulationReport);

    // 2. Renderiza Componentes
    this.parts.forEach(p => {
      this.renderPart(p, simulationReport);
    });

    // 3. Renderiza Fio Temporário em Construção
    if (this.drawingWire) {
      this.renderDrawingWire();
    }

    // 4. Renderiza Pontas do Multímetro se ativo
    this.renderMultimeterProbes();
  }

  // Calcula o comando do path (d) ortogonal/poligonal
  calcWirePath(pA, tA, pB, tB, points = []) {
    const ax = pA.x + tA.x;
    const ay = pA.y + tA.y;
    const bx = pB.x + tB.x;
    const by = pB.y + tB.y;

    let d = `M ${ax} ${ay} `;
    if (points && points.length > 0) {
      points.forEach(pt => {
        d += `L ${pt.x} ${pt.y} `;
      });
    }
    d += `L ${bx} ${by}`;
    return d;
  }

  renderWires(simulationReport) {
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

      const colorMeta = WIRE_COLORS[w.color] || WIRE_COLORS.ret;
      const strokeColor = colorMeta.hex;

      // Espessura conforme bitola (gauge)
      const gaugeWidths = { '1.5': 4, '2.5': 5, '4.0': 6, '6.0': 7, '10.0': 9 };
      const baseWidth = gaugeWidths[w.gauge] || 5;

      // Fio Principal
      const wireElem = this.el('path', {
        d: pathData,
        class: `cad-wire ${isSelected ? 'selected' : ''} ${isShorted ? 'short-circuit' : ''}`,
        'data-wire': w.id,
        stroke: strokeColor,
        'stroke-width': baseWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: 'none'
      });

      wireElem.addEventListener('pointerdown', e => {
        e.stopPropagation();
        this.selected = { type: 'wire', id: w.id };
        this.render(simulationReport);
        this.onSelectionChange(w);
      });

      this.wiresLayer.appendChild(wireElem);

      // Fio de Fluxo de Energia Animado
      if (simulationReport?.active && !simulationReport.hasShort) {
        const wireStatus = simulationReport.liveWires?.get(w.id);
        if (wireStatus?.isLive) {
          const energyOverlay = this.el('path', {
            d: pathData,
            class: 'cad-energy-overlay active',
            fill: 'none',
            stroke: '#fef08a',
            'stroke-width': 2.5,
            'stroke-linecap': 'round',
            'stroke-dasharray': '8 16'
          });
          this.wiresLayer.appendChild(energyOverlay);
        }
      }

      // Se estiver selecionado, exibe os vértices (waypoints) arrastáveis
      if (isSelected && w.points && w.points.length > 0) {
        w.points.forEach((pt, ptIdx) => {
          const handle = this.el('circle', {
            cx: pt.x,
            cy: pt.y,
            r: 5,
            class: 'cad-waypoint-handle',
            fill: '#38bdf8',
            stroke: '#ffffff',
            'stroke-width': 2,
            style: 'cursor: move;'
          });

          handle.addEventListener('pointerdown', ev => {
            ev.stopPropagation();
            const startPt = this.clientToSvg(ev);
            const onMove = moveEv => {
              const cur = this.clientToSvg(moveEv);
              pt.x = this.snap(cur.x);
              pt.y = this.snap(cur.y);
              this.render(simulationReport);
            };
            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              this.saveHistory();
              this.onTopologyChange();
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          });

          this.overlayLayer.appendChild(handle);
        });
      }
    });
  }

  // Renderiza componente elétrico na tela
  renderPart(p, simulationReport) {
    const isSelected = this.selected?.type === 'part' && this.selected.id === p.id;
    const g = this.el('g', {
      class: `cad-part ${isSelected ? 'selected' : ''}`,
      'data-part': p.id,
      transform: `translate(${p.x}, ${p.y})`
    });

    const bodyW = p.w;
    const bodyH = p.h;

    // Fundo da Peça (Gabinete com acabamento moderno)
    const body = this.el('rect', {
      class: 'cad-part-body',
      width: bodyW,
      height: bodyH,
      rx: 7,
      fill: 'url(#body-grad)',
      stroke: isSelected ? '#38bdf8' : '#64748b',
      'stroke-width': isSelected ? 2.5 : 1.2,
      filter: 'url(#cad-shadow)'
    });
    g.appendChild(body);

    // Trilho DIN de apoio visual no fundo para disjuntores e DRs
    if (['breaker1', 'breaker2', 'breaker3', 'rcd2', 'rcd4', 'spd'].includes(p.kind)) {
      const din = this.el('rect', {
        x: 4, y: 4,
        width: bodyW - 8, height: bodyH - 8,
        rx: 4,
        fill: '#f1f5f9',
        stroke: '#cbd5e1',
        'stroke-width': 1
      });
      g.appendChild(din);
    }

    // Título e Rótulo
    const title = this.el('text', {
      x: bodyW / 2,
      y: 16,
      'text-anchor': 'middle',
      class: 'cad-part-title',
      fill: '#1e293b',
      'font-size': '10px',
      'font-weight': '700',
      'pointer-events': 'none'
    }, p.shortName || p.name);
    g.appendChild(title);

    // ==========================================
    // RENDERIZAÇÃO ESPECÍFICA POR COMPONENTE
    // ==========================================
    this.renderPartSpecifics(p, g, bodyW, bodyH, simulationReport);

    // ==========================================
    // BORNES / TERMINAIS COM MAGNETISMO
    // ==========================================
    p.terms.forEach(t => {
      const termGroup = this.el('g', { class: 'cad-terminal' });

      // Suporte do borne
      const bg = this.el('rect', {
        x: t.x - 7, y: t.y - 7,
        width: 14, height: 14,
        rx: 3,
        fill: '#e2e8f0',
        stroke: '#94a3b8',
        'stroke-width': 1
      });

      // Ilhó metálico do parafuso
      const screwColor = WIRE_COLORS[t.type]?.hex || '#475569';
      const screw = this.el('circle', {
        cx: t.x, cy: t.y,
        r: 4.5,
        fill: screwColor,
        stroke: '#0f172a',
        'stroke-width': 0.8
      });

      // Fenda do parafuso
      const slot = this.el('line', {
        x1: t.x - 2.5, y1: t.y,
        x2: t.x + 2.5, y2: t.y,
        stroke: '#ffffff',
        'stroke-width': 1,
        'pointer-events': 'none'
      });

      // Hitbox ampliada para facilitar a conexão do fio
      const hitbox = this.el('circle', {
        cx: t.x, cy: t.y,
        r: 16,
        fill: 'transparent',
        class: 'cad-term-hitbox',
        style: 'cursor: crosshair;'
      });

      hitbox.appendChild(this.el('title', {}, `${t.label} (${t.type.toUpperCase()})`));

      hitbox.addEventListener('pointerenter', () => {
        screw.setAttribute('stroke', '#fbbf24');
        screw.setAttribute('stroke-width', '2.5');
      });

      hitbox.addEventListener('pointerleave', () => {
        screw.setAttribute('stroke', '#0f172a');
        screw.setAttribute('stroke-width', '0.8');
      });

      hitbox.addEventListener('pointerdown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();

        if (this.multimeterActive && this.draggingProbe) {
          // Conecta a ponta de prova ao borne clicado
          if (this.draggingProbe === 'black') {
            this.probeBlack = { pid: p.id, tidx: t.idx, x: p.x + t.x, y: p.y + t.y };
          } else {
            this.probeRed = { pid: p.id, tidx: t.idx, x: p.x + t.x, y: p.y + t.y };
          }
          this.draggingProbe = null;
          sound.playClick();
          this.render(simulationReport);
          this.onTopologyChange();
          return;
        }

        // Fiação
        if (!this.drawingWire) {
          // Começa o fio
          this.drawingWire = {
            from: { pid: p.id, idx: t.idx },
            points: [],
            color: this.activeWireColor,
            gauge: this.activeWireGauge
          };
          sound.playClick();
          this.render(simulationReport);
        } else {
          // Termina o fio se não for o mesmo borne
          if (this.drawingWire.from.pid === p.id && this.drawingWire.from.idx === t.idx) {
            this.drawingWire = null;
            this.render(simulationReport);
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
            sound.playClick();
            this.render(simulationReport);
            this.onTopologyChange();
          }
        }
      });

      termGroup.appendChild(bg);
      termGroup.appendChild(screw);
      termGroup.appendChild(slot);
      termGroup.appendChild(hitbox);
      g.appendChild(termGroup);
    });

    // Eventos de arrasto da peça inteira
    g.addEventListener('pointerdown', ev => {
      if (ev.target.classList.contains('cad-term-hitbox') || ev.target.classList.contains('cad-actionable')) return;
      if (ev.button !== 0) return;
      ev.stopPropagation();

      this.selected = { type: 'part', id: p.id };
      const cur = this.clientToSvg(ev);
      this.draggingPart = {
        id: p.id,
        dx: cur.x - p.x,
        dy: cur.y - p.y
      };

      this.render(simulationReport);
      this.onSelectionChange(p);
    });

    this.partsLayer.appendChild(g);
  }

  // Renderiza os detalhes visuais específicos de cada componente
  renderPartSpecifics(p, g, w, h, simulationReport) {
    const props = p.props || {};

    // 1. DISJUNTORES
    if (['breaker1', 'breaker2', 'breaker3'].includes(p.kind)) {
      const isTripped = props.tripped;
      const isOn = props.isOn && !isTripped;

      // Alavanca mecânica (Toggle Switch)
      const switchW = w * 0.45;
      const switchH = 26;
      const sx = (w - switchW) / 2;
      const sy = (h - switchH) / 2;

      const toggle = this.el('rect', {
        x: sx, y: sy,
        width: switchW, height: switchH,
        rx: 4,
        class: 'cad-actionable',
        fill: isOn ? '#10b981' : (isTripped ? '#f59e0b' : '#ef4444'),
        stroke: '#0f172a',
        'stroke-width': 1.2,
        style: 'cursor: pointer;'
      });

      const label = this.el('text', {
        x: w / 2, y: sy + 16,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '10px',
        'font-weight': 'bold',
        'pointer-events': 'none'
      }, isTripped ? 'TRIP' : (isOn ? 'ON' : 'OFF'));

      toggle.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.tripped) {
          props.tripped = false;
          props.isOn = false; // Arma na posição OFF primeiro
        } else {
          props.isOn = !props.isOn;
        }
        sound.playClick();
        this.render(simulationReport);
        this.onTopologyChange();
      });

      g.appendChild(toggle);
      g.appendChild(label);

      // Rótulo da Amperagem
      const rating = this.el('text', {
        x: w / 2, y: h - 14,
        'text-anchor': 'middle',
        fill: '#475569',
        'font-size': '9px',
        'font-weight': 'bold',
        'pointer-events': 'none'
      }, `C${props.rating || 16}A`);
      g.appendChild(rating);
    }

    // 2. DISPOSITIVOS DR (IDR)
    else if (['rcd2', 'rcd4'].includes(p.kind)) {
      const isTripped = props.tripped;
      const isOn = props.isOn && !isTripped;

      // Alavanca principal
      const switchW = w * 0.4;
      const switchH = 24;
      const sx = 14;
      const sy = (h - switchH) / 2;

      const toggle = this.el('rect', {
        x: sx, y: sy,
        width: switchW, height: switchH,
        rx: 4,
        class: 'cad-actionable',
        fill: isOn ? '#10b981' : (isTripped ? '#f59e0b' : '#ef4444'),
        stroke: '#0f172a',
        'stroke-width': 1.2,
        style: 'cursor: pointer;'
      });

      const label = this.el('text', {
        x: sx + switchW / 2, y: sy + 15,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '9px',
        'font-weight': 'bold',
        'pointer-events': 'none'
      }, isTripped ? 'TRIP' : (isOn ? 'I' : '0'));

      toggle.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.tripped) {
          props.tripped = false;
          props.isOn = false;
        } else {
          props.isOn = !props.isOn;
        }
        sound.playClick();
        this.render(simulationReport);
        this.onTopologyChange();
      });

      g.appendChild(toggle);
      g.appendChild(label);

      // Botão de TESTE 'T' (Funcional!)
      const testBtn = this.el('circle', {
        cx: w - 24, cy: sy + switchH / 2,
        r: 9,
        class: 'cad-actionable',
        fill: '#38bdf8',
        stroke: '#0284c7',
        'stroke-width': 1.2,
        style: 'cursor: pointer;'
      });

      const testLbl = this.el('text', {
        x: w - 24, y: sy + switchH / 2 + 4,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '9px',
        'font-weight': 'bold',
        'pointer-events': 'none'
      }, 'T');

      testBtn.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        if (props.isOn && !props.tripped) {
          props.isOn = false;
          props.tripped = true;
          sound.playTrip();
          this.render(simulationReport);
          this.onTopologyChange();
        }
      });

      g.appendChild(testBtn);
      g.appendChild(testLbl);
    }

    // 3. BARRAMENTOS (Neutro e Terra)
    else if (p.kind === 'neutral_bus' || p.kind === 'earth_bus') {
      const busColor = p.kind === 'neutral_bus' ? '#0284c7' : '#10b981';
      const copperBar = this.el('rect', {
        x: 10, y: 15,
        width: w - 20, height: 16,
        rx: 3,
        fill: 'url(#bus-copper)',
        stroke: busColor,
        'stroke-width': 1.5
      });
      g.appendChild(copperBar);
    }

    // 4. INTERRUPTORES (Simples, Paralelo, Intermediário)
    else if (p.kind === 'switch_simple' || p.kind === 'switch_parallel' || p.kind === 'switch_intermediate' || p.kind === 'switch_bipolar' || p.kind === 'switch_push') {
      const rockerW = 32;
      const rockerH = 46;
      const rx = (w - rockerW) / 2;
      const ry = (h - rockerH) / 2;

      let isActive = props.isOn;
      if (p.kind === 'switch_parallel') isActive = props.position === 1;
      if (p.kind === 'switch_intermediate') isActive = props.crossed;
      if (p.kind === 'switch_push') isActive = props.isPressed;

      const rocker = this.el('rect', {
        x: rx, y: ry,
        width: rockerW, height: rockerH,
        rx: 5,
        class: 'cad-actionable',
        fill: isActive ? '#f8fafc' : '#e2e8f0',
        stroke: '#94a3b8',
        'stroke-width': 1.5,
        style: 'cursor: pointer;'
      });

      const notch = this.el('circle', {
        cx: w / 2,
        cy: isActive ? ry + 10 : ry + rockerH - 10,
        r: 3,
        fill: isActive ? '#38bdf8' : '#94a3b8'
      });

      rocker.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (p.kind === 'switch_parallel') {
          props.position = props.position === 1 ? 2 : 1;
        } else if (p.kind === 'switch_intermediate') {
          props.crossed = !props.crossed;
        } else if (p.kind === 'switch_push') {
          props.isPressed = true;
          setTimeout(() => {
            props.isPressed = false;
            this.render(simulationReport);
            this.onTopologyChange();
          }, 400);
        } else {
          props.isOn = !props.isOn;
        }
        sound.playClick();
        this.render(simulationReport);
        this.onTopologyChange();
      });

      g.appendChild(rocker);
      g.appendChild(notch);
    }

    // 5. LÂMPADA LED
    else if (p.kind === 'lamp_led') {
      const isLit = props.isLit && simulationReport?.active;
      const cx = w / 2;
      const cy = h / 2;

      const bulb = this.el('circle', {
        cx, cy,
        r: 22,
        fill: isLit ? '#fef08a' : '#f1f5f9',
        stroke: isLit ? '#facc15' : '#94a3b8',
        'stroke-width': 2,
        filter: isLit ? 'url(#glow-light)' : 'none'
      });
      g.appendChild(bulb);

      if (isLit) {
        const filament = this.el('path', {
          d: `M ${cx - 8} ${cy + 5} Q ${cx} ${cy - 12} ${cx + 8} ${cy + 5}`,
          fill: 'none',
          stroke: '#ca8a04',
          'stroke-width': 2
        });
        g.appendChild(filament);
      }
    }

    // 6. TOMADA (TUG ou TUE)
    else if (p.kind === 'socket_tug' || p.kind === 'socket_tue') {
      const cx = w / 2;
      const cy = h / 2;
      const face = this.el('circle', {
        cx, cy,
        r: 22,
        fill: '#f8fafc',
        stroke: '#cbd5e1',
        'stroke-width': 1.5
      });
      g.appendChild(face);

      // Orifícios da tomada brasileira NBR 14136
      g.appendChild(this.el('circle', { cx: cx - 11, cy, r: 3.2, fill: '#1e293b' }));
      g.appendChild(this.el('circle', { cx: cx + 11, cy, r: 3.2, fill: '#1e293b' }));
      g.appendChild(this.el('circle', { cx, cy: cy + 7, r: 3.2, fill: '#1e293b' }));

      // LED indicador de presença de tensão
      const ledColor = (props.isPowered && simulationReport?.active) ? '#10b981' : '#94a3b8';
      const led = this.el('circle', {
        cx, cy: h - 14,
        r: 3,
        fill: ledColor
      });
      g.appendChild(led);
    }

    // 7. CHUVEIRO ELÉTRICO
    else if (p.kind === 'shower') {
      const isRunning = props.isRunning && simulationReport?.active;
      const cx = w / 2;
      const cy = h / 2;

      // Bojo do chuveiro
      const showerHead = this.el('path', {
        d: `M ${cx - 24} ${cy + 10} L ${cx + 24} ${cy + 10} L ${cx + 14} ${cy - 15} L ${cx - 14} ${cy - 15} Z`,
        fill: '#f1f5f9',
        stroke: isRunning ? '#38bdf8' : '#64748b',
        'stroke-width': 2
      });
      g.appendChild(showerHead);

      // Seletor de Temperatura (Verão / Inverno / Desligado)
      const selW = 40;
      const sel = this.el('rect', {
        x: cx - selW / 2, y: cy - 28,
        width: selW, height: 12,
        rx: 3,
        class: 'cad-actionable',
        fill: props.mode === 'inverno' ? '#ef4444' : (props.mode === 'verao' ? '#f59e0b' : '#64748b'),
        style: 'cursor: pointer;'
      });

      const selText = this.el('text', {
        x: cx, y: cy - 19,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '8px',
        'font-weight': 'bold',
        'pointer-events': 'none'
      }, props.mode.toUpperCase());

      sel.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.saveHistory();
        if (props.mode === 'inverno') props.mode = 'verao';
        else if (props.mode === 'verao') props.mode = 'desligado';
        else props.mode = 'inverno';
        sound.playClick();
        this.render(simulationReport);
        this.onTopologyChange();
      });

      g.appendChild(sel);
      g.appendChild(selText);

      // Jatos d'água animados se ligado
      if (isRunning) {
        for (let i = -16; i <= 16; i += 8) {
          const stream = this.el('line', {
            x1: cx + i, y1: cy + 12,
            x2: cx + i, y2: cy + 28,
            stroke: '#38bdf8',
            'stroke-width': 1.5,
            'stroke-dasharray': '2 2'
          });
          g.appendChild(stream);
        }
      }
    }

    // 8. VENTILADOR DE TETO
    else if (p.kind === 'fan') {
      const isSpinning = props.fanOn && simulationReport?.active;
      const cx = w / 2;
      const cy = h / 2;

      const bladesGroup = this.el('g', {
        class: isSpinning ? 'cad-spin-fast' : '',
        transform: `translate(${cx}, ${cy})`
      });

      // Pás do ventilador
      bladesGroup.appendChild(this.el('ellipse', { cx: 0, cy: -20, rx: 6, ry: 16, fill: '#64748b' }));
      bladesGroup.appendChild(this.el('ellipse', { cx: -18, cy: 12, rx: 16, ry: 6, fill: '#64748b', transform: 'rotate(30)' }));
      bladesGroup.appendChild(this.el('ellipse', { cx: 18, cy: 12, rx: 16, ry: 6, fill: '#64748b', transform: 'rotate(-30)' }));
      bladesGroup.appendChild(this.el('circle', { cx: 0, cy: 0, r: 8, fill: '#1e293b' }));

      g.appendChild(bladesGroup);

      // Luz central do ventilador
      if (props.lightOn && simulationReport?.active) {
        const centerLight = this.el('circle', {
          cx, cy,
          r: 7,
          fill: '#fef08a',
          stroke: '#facc15',
          filter: 'url(#glow-light)'
        });
        g.appendChild(centerLight);
      }
    }

    // 9. MOTOR ELÉTRICO
    else if (p.kind === 'motor') {
      const isRunning = props.isRunning && simulationReport?.active;
      const cx = w / 2;
      const cy = h / 2;

      // Carcaça com aletas
      const bodyMotor = this.el('circle', {
        cx, cy,
        r: 22,
        fill: '#334155',
        stroke: isRunning ? '#10b981' : '#475569',
        'stroke-width': 2
      });
      g.appendChild(bodyMotor);

      const shaft = this.el('g', {
        class: isRunning ? 'cad-spin-fast' : '',
        transform: `translate(${cx}, ${cy})`
      });
      shaft.appendChild(this.el('circle', { cx: 0, cy: 0, r: 8, fill: '#e2e8f0' }));
      shaft.appendChild(this.el('rect', { x: -3, y: -7, width: 6, height: 14, fill: '#0f172a' }));
      g.appendChild(shaft);
    }
  }

  // Renderiza o fio que está sendo traçado pelo usuário
  renderDrawingWire() {
    const pA = this.parts.find(p => p.id === this.drawingWire.from.pid);
    if (!pA) return;

    const tA = pA.terms[this.drawingWire.from.idx];
    const mousePos = this.currentMousePos || { x: pA.x + tA.x, y: pA.y + tA.y };

    const pathData = this.calcWirePath(pA, tA, { x: 0, y: 0 }, mousePos, this.drawingWire.points);
    const colorMeta = WIRE_COLORS[this.drawingWire.color] || WIRE_COLORS.ret;

    const tempWire = this.el('path', {
      d: pathData,
      class: 'cad-wire-drawing',
      stroke: colorMeta.hex,
      'stroke-width': 4.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-dasharray': '6 6',
      fill: 'none',
      opacity: 0.85
    });

    this.wiresLayer.appendChild(tempWire);
  }

  // Renderiza pontas de prova do multímetro
  renderMultimeterProbes() {
    this.probesLayer.innerHTML = '';
    if (!this.multimeterActive) return;

    const renderProbe = (probe, color, label) => {
      if (!probe) return;
      const g = this.el('g', {
        transform: `translate(${probe.x}, ${probe.y})`,
        style: 'cursor: grab;'
      });

      // Corpo da ponta de prova
      const handle = this.el('polygon', {
        points: '0,0 -5,-25 5,-25',
        fill: color,
        stroke: '#0f172a',
        'stroke-width': 1
      });

      // Ponta de agulha metálica
      const needle = this.el('line', {
        x1: 0, y1: 0,
        x2: 0, y2: 6,
        stroke: '#f8fafc',
        'stroke-width': 2
      });

      const text = this.el('text', {
        x: 0, y: -28,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '8px',
        'font-weight': 'bold'
      }, label);

      g.appendChild(needle);
      g.appendChild(handle);
      g.appendChild(text);

      g.addEventListener('pointerdown', ev => {
        ev.stopPropagation();
        this.draggingProbe = label === 'COM' ? 'black' : 'red';
      });

      this.probesLayer.appendChild(g);
    };

    renderProbe(this.probeBlack, '#1e293b', 'COM');
    renderProbe(this.probeRed, '#ef4444', 'V/Ω');
  }

  // ==========================================
  // EVENTOS DO CANVAS (ZOOM, PAN, POINTER)
  // ==========================================
  initEvents() {
    // Zoom com a roda do mouse
    this.svg.addEventListener('wheel', ev => {
      ev.preventDefault();
      const zoomFactor = ev.deltaY < 0 ? 0.9 : 1.1;
      const cur = this.clientToSvg(ev);

      const newW = this.viewBox.w * zoomFactor;
      const newH = this.viewBox.h * zoomFactor;

      // Limita zoom
      if (newW < 400 || newW > 4000) return;

      this.viewBox.x = cur.x - (cur.x - this.viewBox.x) * zoomFactor;
      this.viewBox.y = cur.y - (cur.y - this.viewBox.y) * zoomFactor;
      this.viewBox.w = newW;
      this.viewBox.h = newH;

      this.updateViewBox();
    }, { passive: false });

    // Pointer Down no fundo
    this.svg.addEventListener('pointerdown', ev => {
      // Pan com botão do meio ou barra de espaço
      if (ev.button === 1 || this.spacePressed) {
        this.isPanning = true;
        this.panStart = { x: ev.clientX, y: ev.clientY };
        return;
      }

      // Se clicar no fundo durante o traçado de fio, adiciona um waypoint (curva 90°)
      if (this.drawingWire && ev.button === 0) {
        const pt = this.clientToSvg(ev);
        this.drawingWire.points.push({
          x: this.snap(pt.x),
          y: this.snap(pt.y)
        });
        sound.playClick();
        this.render();
        return;
      }

      // Desmarca seleção se clicar no fundo vazio
      if (ev.target === this.svg || ev.target.id === 'cad-bg' || ev.target.id === 'cad-grid-bg') {
        this.selected = null;
        this.render();
        this.onSelectionChange(null);
      }
    });

    // Pointer Move
    window.addEventListener('pointermove', ev => {
      const cur = this.clientToSvg(ev);
      this.currentMousePos = { x: this.snap(cur.x), y: this.snap(cur.y) };
      this.onCursorMove(this.currentMousePos);

      // Pan
      if (this.isPanning) {
        const dx = (ev.clientX - this.panStart.x) * (this.viewBox.w / this.svg.clientWidth);
        const dy = (ev.clientY - this.panStart.y) * (this.viewBox.h / this.svg.clientHeight);
        this.viewBox.x -= dx;
        this.viewBox.y -= dy;
        this.panStart = { x: ev.clientX, y: ev.clientY };
        this.updateViewBox();
        return;
      }

      // Arrasto de Peça
      if (this.draggingPart) {
        const p = this.parts.find(item => item.id === this.draggingPart.id);
        if (p) {
          p.x = this.snap(cur.x - this.draggingPart.dx);
          p.y = this.snap(cur.y - this.draggingPart.dy);
          this.render();
        }
        return;
      }

      // Traçado do fio em tempo real
      if (this.drawingWire) {
        this.render();
      }
    });

    // Pointer Up
    window.addEventListener('pointerup', () => {
      if (this.isPanning) this.isPanning = false;
      if (this.draggingPart) {
        this.draggingPart = null;
        this.saveHistory();
        this.onTopologyChange();
      }
    });

    // Atalhos de teclado
    window.addEventListener('keydown', ev => {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;

      if (ev.code === 'Space') {
        this.spacePressed = true;
        this.svg.style.cursor = 'grab';
      }

      if (ev.key === 'Escape') {
        if (this.drawingWire) {
          this.drawingWire = null;
          this.render();
        }
      }

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        this.deleteSelected();
      }

      if (ev.key === 'r' || ev.key === 'R') {
        this.rotateSelected();
      }

      if (ev.ctrlKey && (ev.key === 'z' || ev.key === 'Z')) {
        ev.preventDefault();
        this.undo();
      }

      if (ev.ctrlKey && (ev.key === 'y' || ev.key === 'Y')) {
        ev.preventDefault();
        this.redo();
      }

      if (ev.ctrlKey && (ev.key === 'd' || ev.key === 'D')) {
        ev.preventDefault();
        this.duplicateSelected();
      }
    });

    window.addEventListener('keyup', ev => {
      if (ev.code === 'Space') {
        this.spacePressed = false;
        this.svg.style.cursor = 'crosshair';
      }
    });

    // Botão direito cancela fiação sem abrir menu de contexto do navegador
    this.svg.addEventListener('contextmenu', ev => {
      if (this.drawingWire) {
        ev.preventDefault();
        this.drawingWire = null;
        this.render();
      }
    });
  }

  // Zoom Helpers
  zoomIn() {
    this.viewBox.x += this.viewBox.w * 0.05;
    this.viewBox.y += this.viewBox.h * 0.05;
    this.viewBox.w *= 0.9;
    this.viewBox.h *= 0.9;
    this.updateViewBox();
  }

  zoomOut() {
    this.viewBox.x -= this.viewBox.w * 0.05;
    this.viewBox.y -= this.viewBox.h * 0.05;
    this.viewBox.w *= 1.1;
    this.viewBox.h *= 1.1;
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
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    });

    const pad = 120;
    this.viewBox = {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(800, maxX - minX + pad * 2),
      h: Math.max(600, maxY - minY + pad * 2)
    };
    this.updateViewBox();
  }
}
