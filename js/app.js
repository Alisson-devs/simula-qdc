/**
 * QDC Lab Pro - Orquestrador Principal da Aplicação
 */
import { CadEngine } from './cad.js';
import { CircuitSimulator } from './simulator.js';
import { ExportManager } from './export.js';
import { VirtualMultimeter } from './multimeter.js';
import { COMPONENT_DEFINITIONS, WIRE_COLORS } from './components.js';
import { sound } from './audio.js';

class App {
  constructor() {
    this.boardElem = document.getElementById('board');
    this.simToggle = document.getElementById('sim-mode-toggle');
    this.voltageSelect = document.getElementById('system-voltage');
    
    // Inicializa subsistemas
    this.sim = new CircuitSimulator();
    this.cad = new CadEngine(this.boardElem, {
      onSelectionChange: item => this.onSelectionChange(item),
      onTopologyChange: () => this.runSimulation(),
      onCursorMove: pt => this.updateCoordinates(pt)
    });

    this.exporter = new ExportManager(this.cad, this.sim);
    this.multimeter = new VirtualMultimeter(this.cad, this.sim);

    this.initUI();
    this.initPalettes();
    this.initExamples();
    this.runSimulation();
  }

  initUI() {
    // 1. Simulação & Tensão
    if (this.simToggle) {
      this.simToggle.addEventListener('change', () => {
        sound.playClick();
        this.runSimulation();
      });
    }

    if (this.voltageSelect) {
      this.voltageSelect.addEventListener('change', e => {
        this.sim.setSystemVoltage(e.target.value);
        this.runSimulation();
      });
    }

    // 2. Cores e Bitolas de Fio
    const wireColorSelect = document.getElementById('wire-color-select');
    if (wireColorSelect) {
      wireColorSelect.addEventListener('change', e => {
        this.cad.activeWireColor = e.target.value;
      });
    }

    const wireGaugeSelect = document.getElementById('wire-gauge-select');
    if (wireGaugeSelect) {
      wireGaugeSelect.addEventListener('change', e => {
        this.cad.activeWireGauge = e.target.value;
      });
    }

    // 3. Ações de Ferramentas
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

    // 4. Multímetro
    document.getElementById('btn-multimeter')?.addEventListener('click', () => {
      this.multimeter.toggle();
    });

    // 5. Arquivo & Exportação
    document.getElementById('btn-save-project')?.addEventListener('click', () => {
      this.exporter.saveProjectToFile();
    });

    const fileInput = document.getElementById('file-project-input');
    document.getElementById('btn-open-project')?.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
          this.exporter.loadProjectFromFile(file, () => {
            this.runSimulation();
          });
          e.target.value = '';
        }
      });
    }

    document.getElementById('btn-export-png')?.addEventListener('click', () => {
      this.exporter.exportToPng();
    });

    document.getElementById('btn-export-svg')?.addEventListener('click', () => {
      this.exporter.exportToSvg();
    });

    document.getElementById('btn-export-bom')?.addEventListener('click', () => {
      this.showBOMModal();
    });

    // 6. Abas da Paleta Lateral
    const tabButtons = document.querySelectorAll('[data-palette-tab]');
    const tabPanels = document.querySelectorAll('.palette-tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.paletteTab;
        document.getElementById(targetId)?.classList.add('active');
      });
    });

    // 7. Modal BOM
    const modal = document.getElementById('bom-modal');
    document.getElementById('btn-close-bom')?.addEventListener('click', () => {
      modal?.classList.remove('visible');
    });
    document.getElementById('btn-download-bom-csv')?.addEventListener('click', () => {
      this.exporter.exportBOMToCsv();
    });
  }

  // Gera botões para adicionar componentes a partir do catálogo
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

      btn.addEventListener('click', () => {
        this.cad.addPart(kind);
      });

      container.appendChild(btn);
    });
  }

  // Executa a simulação elétrica física e atualiza toda a interface
  runSimulation() {
    const isSimActive = this.simToggle ? this.simToggle.checked : false;
    const report = this.sim.analyze(this.cad.parts, this.cad.wires, isSimActive);

    // Re-renderiza o CAD com o feedback do simulador
    this.cad.render(report);

    // Atualiza multímetro
    this.multimeter.update(report);

    // Atualiza o painel de diagnóstico
    this.updateDiagnostics(report);

    // Atualiza estatísticas no cabeçalho
    this.updateHeaderStats(report);
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

    // Simulação ativa e sem curto
    if (report.loads.length > 0) {
      summaryBox.className = 'diag-card ok';
      summaryBox.innerHTML = `
        <strong>✅ Circuito em Operação Normal</strong>
        <p>${report.loads.length} carga(s) alimentadas perfeitamente. Nenhuma falha de isolação ou colisão de fase detectada.</p>
      `;
    } else {
      summaryBox.className = 'diag-card warn';
      summaryBox.innerHTML = `
        <strong>ℹ️ Circuito Energizado (Sem Cargas Ativas)</strong>
        <p>A tensão está presente nos condutores, mas nenhuma carga está com circuito fechado ou os disjuntores/interruptores estão abertos.</p>
      `;
    }

    // Lista de Cargas
    if (loadList) {
      if (report.loads.length === 0) {
        loadList.innerHTML = '<li>Nenhuma carga consumindo energia no momento.</li>';
      } else {
        loadList.innerHTML = report.loads.map(ld => `
          <li>
            <strong>${ld.name}</strong>: ${ld.power}W | ${ld.current.toFixed(2)}A (${ld.voltage}V)
          </li>
        `).join('');
      }
    }

    // Avisos e Alertas de Sobrecarga / Aterramento
    if (warningList) {
      if (report.warnings.length === 0) {
        warningList.innerHTML = '<li class="ok-text">Nenhum aviso técnico ou sobrecarga detectada.</li>';
      } else {
        warningList.innerHTML = report.warnings.map(w => `<li class="warn-text">${w}</li>`).join('');
      }
    }

    // Verificação de Normas NBR 5410
    if (complianceList) {
      if (report.compliance.length === 0) {
        complianceList.innerHTML = '<li class="ok-text">Cores e condutores em conformidade com a NBR 5410.</li>';
      } else {
        complianceList.innerHTML = report.compliance.map(c => `<li class="compliance-text">${c}</li>`).join('');
      }
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
    if (coordElem) {
      coordElem.textContent = `X: ${Math.round(pt.x)} | Y: ${Math.round(pt.y)}`;
    }
  }

  // Painel de propriedades do elemento selecionado
  onSelectionChange(selectedItem) {
    const propPanel = document.getElementById('properties-panel');
    const propTitle = document.getElementById('prop-title');
    const propContent = document.getElementById('prop-content');

    if (!propPanel) return;

    if (!selectedItem) {
      propPanel.classList.remove('active');
      return;
    }

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
              <option value="40" ${p.props.rating === 40 ? 'selected' : ''}>40 A</option>
              <option value="50" ${p.props.rating === 50 ? 'selected' : ''}>50 A</option>
              <option value="63" ${p.props.rating === 63 ? 'selected' : ''}>63 A</option>
            </select>
          </div>
        `;
      }

      const isLoad = ['lamp_led', 'shower', 'fan', 'motor', 'socket_tug', 'socket_tue', 'buzzer', 'air_conditioner', 'washing_machine', 'refrigerator', 'freezer', 'electric_iron', 'microwave'].includes(p.kind);
      if (isLoad) {
        const defaultV = (p.kind === 'shower' || p.kind === 'socket_tue' || p.kind === 'air_conditioner') ? 220 : (this.sim.systemVoltage === 127 ? 127 : 220);
        const currentVoltage = Number(p.props.voltage) || defaultV;
        p.props.voltage = currentVoltage;

        let defaultWatts = 200;
        if (p.kind === 'shower') defaultWatts = 5500;
        else if (p.kind === 'air_conditioner') defaultWatts = 1600;
        else if (p.kind === 'washing_machine') defaultWatts = 1000;
        else if (p.kind === 'refrigerator') defaultWatts = 300;
        else if (p.kind === 'freezer') defaultWatts = 450;
        else if (p.kind === 'electric_iron') defaultWatts = 1500;
        else if (p.kind === 'microwave') defaultWatts = 1200;
        else if (p.kind === 'socket_tue') defaultWatts = 2200;
        else if (p.kind === 'motor') defaultWatts = 750;
        else if (p.kind === 'fan') defaultWatts = 120;
        else if (p.kind === 'lamp_led') defaultWatts = 15;

        const currentWatts = p.props.watts || defaultWatts;
        p.props.watts = currentWatts;

        html += `
          <div class="prop-group">
            <label>Tensão Nominal (Voltagem da Carga)</label>
            <select id="prop-load-voltage">
              <option value="127" ${currentVoltage === 127 ? 'selected' : ''}>127 V (Monofásico)</option>
              <option value="220" ${currentVoltage === 220 ? 'selected' : ''}>220 V (Bifásico / Monofásico 220V)</option>
            </select>
          </div>
          <div class="prop-group">
            <label>Potência Nominal (Watts)</label>
            <input type="number" id="prop-load-watts" value="${currentWatts}" min="1" max="15000" step="5">
          </div>
        `;
      }

      if (propContent) propContent.innerHTML = html;

      // Eventos dos inputs
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

      document.getElementById('prop-load-voltage')?.addEventListener('change', e => {
        this.cad.saveHistory();
        p.props.voltage = Number(e.target.value);
        this.cad.render();
        this.runSimulation();
      });

      document.getElementById('prop-load-watts')?.addEventListener('input', e => {
        const val = Number(e.target.value);
        if (val > 0) {
          p.props.watts = val;
          this.cad.render();
          this.runSimulation();
        }
      });
    } else if (this.cad.selected.type === 'wire') {
      const w = selectedItem;
      if (propTitle) propTitle.textContent = `Condutor #${w.id}`;

      const currentAmps = this.sim.lastReport?.wireCurrents?.get(w.id) || 0;
      const wireGaugeNum = parseFloat(w.gauge) || 2.5;
      const gaugeEntry = [{ gauge: 1.5, maxAmps: 15.5 }, { gauge: 2.5, maxAmps: 21.0 }, { gauge: 4.0, maxAmps: 28.0 }, { gauge: 6.0, maxAmps: 36.0 }, { gauge: 10.0, maxAmps: 50.0 }, { gauge: 16.0, maxAmps: 68.0 }, { gauge: 25.0, maxAmps: 89.0 }, { gauge: 35.0, maxAmps: 111.0 }].find(g => g.gauge === wireGaugeNum) || { maxAmps: 21.0 };
      const maxAmps = gaugeEntry.maxAmps;
      const isOverloaded = currentAmps > maxAmps;
      const loadsList = this.sim.lastReport?.wireLoadSources?.get(w.id) || [];
      const loadsDesc = loadsList.length > 0 ? loadsList.join(', ') : 'Nenhuma carga ativa';

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
            <option value="1.5" ${w.gauge === '1.5' ? 'selected' : ''}>1,5 mm² (máx 15.5A)</option>
            <option value="2.5" ${w.gauge === '2.5' ? 'selected' : ''}>2,5 mm² (máx 21.0A)</option>
            <option value="4.0" ${w.gauge === '4.0' ? 'selected' : ''}>4,0 mm² (máx 28.0A)</option>
            <option value="6.0" ${w.gauge === '6.0' ? 'selected' : ''}>6,0 mm² (máx 36.0A)</option>
            <option value="10.0" ${w.gauge === '10.0' ? 'selected' : ''}>10,0 mm² (máx 50.0A)</option>
            <option value="16.0" ${w.gauge === '16.0' ? 'selected' : ''}>16,0 mm² (máx 68.0A)</option>
            <option value="25.0" ${w.gauge === '25.0' ? 'selected' : ''}>25,0 mm² (máx 89.0A)</option>
            <option value="35.0" ${w.gauge === '35.0' ? 'selected' : ''}>35,0 mm² (máx 111.0A)</option>
          </select>
        </div>
        <div class="dimensioning-box" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; margin-top: 10px; font-size: 11px;">
          <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">⚡ Telemetria NBR 5410:</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: var(--text-muted);">Corrente:</span>
            <strong style="color: ${isOverloaded ? '#ef4444' : '#f8fafc'};">${currentAmps.toFixed(2)} A</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: var(--text-muted);">Capacidade:</span>
            <strong style="color: #38bdf8;">${maxAmps} A</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Cargas:</span>
            <span style="color: #e2e8f0; font-size: 10px;">${loadsDesc}</span>
          </div>
        </div>
        <button id="btn-apply-gauge-branch" class="btn-icon" style="width: 100%; margin-top: 8px; font-weight: bold; background: #0284c7; color: #ffffff; border: none; padding: 7px; border-radius: 5px; cursor: pointer;">
          🔄 Aplicar ${w.gauge} mm² em todo o circuito conectado
        </button>
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
        this.onSelectionChange(w);
      });

      document.getElementById('btn-apply-gauge-branch')?.addEventListener('click', () => {
        this.cad.saveHistory();
        const targetGauge = w.gauge;
        const visitedWires = new Set([w.id]);
        const queue = [w];
        while (queue.length > 0) {
          const currW = queue.shift();
          currW.gauge = targetGauge;
          this.cad.wires.forEach(otherW => {
            if (visitedWires.has(otherW.id)) return;
            const sharesA = (otherW.a.pid === currW.a.pid && otherW.a.idx === currW.a.idx) || (otherW.b.pid === currW.a.pid && otherW.b.idx === currW.a.idx);
            const sharesB = (otherW.a.pid === currW.b.pid && otherW.a.idx === currW.b.idx) || (otherW.b.pid === currW.b.pid && otherW.b.idx === currW.b.idx);
            if (sharesA || sharesB) {
              visitedWires.add(otherW.id);
              queue.push(otherW);
            }
          });
        }
        this.cad.render();
        this.runSimulation();
        this.onSelectionChange(w);
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
      rowsHtml += `
        <tr>
          <td><span class="badge-type comp">Componente</span></td>
          <td>${name}</td>
          <td><strong>${count} un</strong></td>
        </tr>
      `;
    });

    Object.entries(bom.wires).forEach(([name, data]) => {
      rowsHtml += `
        <tr>
          <td><span class="badge-type wire">Condutor</span></td>
          <td>Cabo ${name}</td>
          <td><strong>${data.lengthMeters.toFixed(1)} m</strong> (${data.segments} trechos)</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rowsHtml || '<tr><td colspan="3">Nenhum componente no projeto.</td></tr>';
    modal.classList.add('visible');
  }

  // Exemplos rápidos pré-carregados
  initExamples() {
    document.getElementById('example-mono-lamp')?.addEventListener('click', () => {
      this.loadExampleCircuit('mono-lamp');
    });

    document.getElementById('example-parallel')?.addEventListener('click', () => {
      this.loadExampleCircuit('parallel');
    });

    document.getElementById('example-qdc-complete')?.addEventListener('click', () => {
      this.loadExampleCircuit('qdc-complete');
    });
  }

  loadExampleCircuit(type) {
    this.cad.clearAll();

    if (type === 'mono-lamp') {
      // 1. Rede Monofásica
      this.cad.addPart('source_mono');
      const src = this.cad.parts[0];
      src.x = 80; src.y = 120;

      // 2. Disjuntor 1P
      this.cad.addPart('breaker1');
      const dj = this.cad.parts[1];
      dj.x = 260; dj.y = 120;

      // 3. Interruptor Simples
      this.cad.addPart('switch_simple');
      const sw = this.cad.parts[2];
      sw.x = 420; sw.y = 120;

      // 4. Lâmpada LED
      this.cad.addPart('lamp_led');
      const lamp = this.cad.parts[3];
      lamp.x = 600; lamp.y = 120;

      // 5. Barramento de Neutro
      this.cad.addPart('neutral_bus');
      const nbus = this.cad.parts[4];
      nbus.x = 260; nbus.y = 300;

      // Ligações
      // Fonte F -> Disjuntor IN
      this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: dj.id, idx: 0 }, points: [{ x: 180, y: 144 }, { x: 295, y: 80 }], color: 'f1', gauge: '2.5' });
      // Disjuntor OUT -> Interruptor IN
      this.cad.wires.push({ id: 2, a: { pid: dj.id, idx: 1 }, b: { pid: sw.id, idx: 0 }, points: [{ x: 295, y: 260 }, { x: 380, y: 160 }], color: 'f1', gauge: '1.5' });
      // Interruptor OUT (Retorno) -> Lâmpada RET
      this.cad.wires.push({ id: 3, a: { pid: sw.id, idx: 1 }, b: { pid: lamp.id, idx: 0 }, points: [], color: 'ret', gauge: '1.5' });
      // Fonte Neutro -> Barramento Neutro
      this.cad.wires.push({ id: 4, a: { pid: src.id, idx: 1 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 160, y: 168 }, { x: 160, y: 323 }], color: 'n', gauge: '2.5' });
      // Barramento Neutro -> Lâmpada Neutro
      this.cad.wires.push({ id: 5, a: { pid: nbus.id, idx: 4 }, b: { pid: lamp.id, idx: 1 }, points: [{ x: 385, y: 380 }, { x: 740, y: 380 }, { x: 740, y: 165 }], color: 'n', gauge: '1.5' });

      this.cad.nextPartId = 6;
      this.cad.nextWireId = 6;
      this.cad.fitAll();
      this.runSimulation();
    } else if (type === 'parallel') {
      // Circuito Three-Way Paralelo
      this.cad.addPart('source_mono');
      const src = this.cad.parts[0];
      src.x = 60; src.y = 120;

      this.cad.addPart('breaker1');
      const dj = this.cad.parts[1];
      dj.x = 240; dj.y = 120;

      this.cad.addPart('switch_parallel');
      const sw1 = this.cad.parts[2];
      sw1.x = 380; sw1.y = 120;

      this.cad.addPart('switch_parallel');
      const sw2 = this.cad.parts[3];
      sw2.x = 560; sw2.y = 120;

      this.cad.addPart('lamp_led');
      const lamp = this.cad.parts[4];
      lamp.x = 740; lamp.y = 120;

      this.cad.addPart('neutral_bus');
      const nbus = this.cad.parts[5];
      nbus.x = 240; nbus.y = 300;

      this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: dj.id, idx: 0 }, points: [{ x: 150, y: 144 }, { x: 275, y: 80 }], color: 'f1', gauge: '2.5' });
      this.cad.wires.push({ id: 2, a: { pid: dj.id, idx: 1 }, b: { pid: sw1.id, idx: 0 }, points: [{ x: 275, y: 260 }, { x: 340, y: 160 }], color: 'f1', gauge: '1.5' });
      this.cad.wires.push({ id: 3, a: { pid: sw1.id, idx: 1 }, b: { pid: sw2.id, idx: 1 }, points: [{ x: 490, y: 145 }, { x: 530, y: 145 }], color: 'ret2', gauge: '1.5' });
      this.cad.wires.push({ id: 4, a: { pid: sw1.id, idx: 2 }, b: { pid: sw2.id, idx: 2 }, points: [{ x: 490, y: 175 }, { x: 530, y: 175 }], color: 'ret2', gauge: '1.5' });
      this.cad.wires.push({ id: 5, a: { pid: sw2.id, idx: 0 }, b: { pid: lamp.id, idx: 0 }, points: [{ x: 670, y: 160 }, { x: 710, y: 165 }], color: 'ret', gauge: '1.5' });
      this.cad.wires.push({ id: 6, a: { pid: src.id, idx: 1 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 140, y: 168 }, { x: 140, y: 323 }], color: 'n', gauge: '2.5' });
      this.cad.wires.push({ id: 7, a: { pid: nbus.id, idx: 4 }, b: { pid: lamp.id, idx: 1 }, points: [{ x: 365, y: 380 }, { x: 840, y: 380 }, { x: 840, y: 165 }], color: 'n', gauge: '1.5' });

      this.cad.nextPartId = 7;
      this.cad.nextWireId = 8;
      this.cad.fitAll();
      this.runSimulation();
    } else if (type === 'qdc-complete') {
      // QDC Completo com DR, DPS e Chuveiro 220V
      this.cad.addPart('source_bi');
      const src = this.cad.parts[0];
      src.x = 40; src.y = 80;

      this.cad.addPart('breaker2');
      const djGeral = this.cad.parts[1];
      djGeral.shortName = 'GERAL 2P';
      djGeral.props.rating = 50;
      djGeral.x = 220; djGeral.y = 80;

      this.cad.addPart('rcd2');
      const dr = this.cad.parts[2];
      dr.x = 360; dr.y = 80;

      this.cad.addPart('spd');
      const dps = this.cad.parts[3];
      dps.x = 500; dps.y = 80;

      this.cad.addPart('neutral_bus');
      const nbus = this.cad.parts[4];
      nbus.x = 220; nbus.y = 260;

      this.cad.addPart('earth_bus');
      const ebus = this.cad.parts[5];
      ebus.x = 440; ebus.y = 260;

      this.cad.addPart('shower');
      const shower = this.cad.parts[6];
      shower.x = 640; shower.y = 120;

      this.cad.wires.push({ id: 1, a: { pid: src.id, idx: 0 }, b: { pid: djGeral.id, idx: 0 }, points: [{ x: 130, y: 102 }, { x: 248, y: 50 }], color: 'f1', gauge: '10.0' });
      this.cad.wires.push({ id: 2, a: { pid: src.id, idx: 1 }, b: { pid: djGeral.id, idx: 1 }, points: [{ x: 150, y: 126 }, { x: 287, y: 50 }], color: 'f2', gauge: '10.0' });
      this.cad.wires.push({ id: 3, a: { pid: djGeral.id, idx: 2 }, b: { pid: dr.id, idx: 0 }, points: [{ x: 248, y: 210 }, { x: 388, y: 50 }], color: 'f1', gauge: '6.0' });
      this.cad.wires.push({ id: 4, a: { pid: src.id, idx: 2 }, b: { pid: dr.id, idx: 1 }, points: [{ x: 170, y: 150 }, { x: 427, y: 50 }], color: 'n', gauge: '10.0' });
      this.cad.wires.push({ id: 5, a: { pid: dr.id, idx: 3 }, b: { pid: nbus.id, idx: 0 }, points: [{ x: 427, y: 220 }, { x: 190, y: 283 }], color: 'n', gauge: '6.0' });
      this.cad.wires.push({ id: 6, a: { pid: src.id, idx: 3 }, b: { pid: ebus.id, idx: 0 }, points: [{ x: 180, y: 174 }, { x: 410, y: 283 }], color: 'pe', gauge: '10.0' });
      this.cad.wires.push({ id: 7, a: { pid: dr.id, idx: 2 }, b: { pid: shower.id, idx: 0 }, points: [{ x: 388, y: 230 }, { x: 610, y: 230 }, { x: 610, y: 148 }], color: 'f1', gauge: '6.0' });
      this.cad.wires.push({ id: 8, a: { pid: nbus.id, idx: 4 }, b: { pid: shower.id, idx: 2 }, points: [{ x: 345, y: 340 }, { x: 620, y: 340 }, { x: 620, y: 196 }], color: 'n', gauge: '6.0' });
      this.cad.wires.push({ id: 9, a: { pid: ebus.id, idx: 2 }, b: { pid: shower.id, idx: 1 }, points: [{ x: 505, y: 330 }, { x: 630, y: 330 }, { x: 630, y: 172 }], color: 'pe', gauge: '6.0' });

      this.cad.nextPartId = 8;
      this.cad.nextWireId = 10;
      this.cad.fitAll();
      this.runSimulation();
    }
  }
}

// Inicializa a aplicação ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  window.qdcApp = new App();
});
