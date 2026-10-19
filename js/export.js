/**
 * QDC Lab Pro - Módulo de Exportação e Relatórios Técnicos (JSON, PNG, SVG e Lista de Materiais BOM)
 */
import { WIRE_COLORS } from './components.js';

export class ExportManager {
  constructor(cadEngine, simulator) {
    this.cad = cadEngine;
    this.sim = simulator;
  }

  // 1. Salvar Projeto em arquivo .qdc (JSON)
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
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 2. Abrir Projeto de arquivo .qdc
  loadProjectFromFile(file, onSuccess = () => {}) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.parts || !data.wires) {
          throw new Error('Arquivo de projeto inválido ou corrompido.');
        }

        this.cad.saveHistory();
        this.cad.parts = data.parts;
        this.cad.wires = data.wires;
        this.cad.nextPartId = Math.max(...data.parts.map(p => p.id), 0) + 1;
        this.cad.nextWireId = Math.max(...data.wires.map(w => w.id), 0) + 1;

        if (data.systemVoltage) {
          this.sim.setSystemVoltage(data.systemVoltage);
        }

        if (data.viewBox) {
          this.cad.viewBox = data.viewBox;
          this.cad.updateViewBox();
        }

        this.cad.render();
        this.cad.onTopologyChange();
        onSuccess(data);
      } catch (err) {
        alert('Erro ao carregar projeto: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // 3. Exportar Imagem PNG em Alta Resolução
  exportToPng(filename = 'esquema_eletrico_qdc.png') {
    const svgElem = this.cad.svg;
    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElem);

    // Injeta estilos CSS para garantir visual perfeito no Canvas
    const styleElement = document.querySelector('link[href*="cad.css"], style');
    const customCss = `
      .cad-part-body { fill: #f8fafc; stroke: #64748b; }
      .cad-wire { stroke-linecap: round; stroke-linejoin: round; }
      text { font-family: system-ui, -apple-system, sans-serif; }
    `;
    source = source.replace('</defs>', `<style>${customCss}</style></defs>`);

    const img = new Image();
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // Alta resolução (2x)
      canvas.width = (svgElem.clientWidth || 1400) * scale;
      canvas.height = (svgElem.clientHeight || 900) * scale;

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // Fundo escuro com grade elegante
      ctx.fillStyle = '#0b1017';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

      ctx.drawImage(img, 0, 0, canvas.width / scale, canvas.height / scale);

      const a = document.createElement('a');
      a.download = filename;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  // 4. Exportar SVG Vetorial
  exportToSvg(filename = 'esquema_vetorial_qdc.svg') {
    const svgElem = this.cad.svg;
    const serializer = new XMLSerializer();
    const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svgElem);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 5. Gerar Lista de Materiais Quantitativa (BOM)
  generateBOM() {
    const partsCount = {};
    const wireStats = {}; // key: "color:gauge" -> { count, totalLengthPx }

    // Contagem de componentes
    this.cad.parts.forEach(p => {
      const name = p.name || p.kind;
      partsCount[name] = (partsCount[name] || 0) + 1;
    });

    // Estimativa de cabos por cor e bitola
    this.cad.wires.forEach(w => {
      const colorMeta = WIRE_COLORS[w.color] || WIRE_COLORS.ret;
      const gauge = w.gauge || '2.5';
      const key = `${colorMeta.name} - ${gauge} mm²`;

      const pA = this.cad.parts.find(p => p.id === w.a.pid);
      const pB = this.cad.parts.find(p => p.id === w.b.pid);
      if (!pA || !pB) return;

      const tA = pA.terms[w.a.idx];
      const tB = pB.terms[w.b.idx];
      if (!tA || !tB) return;

      // Calcula distância euclidiana acumulada
      let len = 0;
      let lastX = pA.x + tA.x;
      let lastY = pA.y + tA.y;

      if (w.points && w.points.length > 0) {
        w.points.forEach(pt => {
          len += Math.hypot(pt.x - lastX, pt.y - lastY);
          lastX = pt.x;
          lastY = pt.y;
        });
      }
      len += Math.hypot((pB.x + tB.x) - lastX, (pB.y + tB.y) - lastY);

      if (!wireStats[key]) {
        wireStats[key] = { segments: 0, lengthMeters: 0 };
      }
      wireStats[key].segments += 1;
      // Escala estimada: 40px = 1 metro na escala padrão do quadro
      wireStats[key].lengthMeters += (len / 40);
    });

    return {
      parts: partsCount,
      wires: wireStats
    };
  }

  // Gera relatório em CSV
  exportBOMToCsv(filename = 'lista_materiais_eletricos.csv') {
    const bom = this.generateBOM();
    let csv = 'Categoria;Item / Descrição;Quantidade;Unidade\r\n';

    Object.entries(bom.parts).forEach(([item, qtd]) => {
      csv += `Componente;${item};${qtd};un\r\n`;
    });

    Object.entries(bom.wires).forEach(([cabo, data]) => {
      csv += `Condutores;Cabo ${cabo};${data.lengthMeters.toFixed(1)};metros (${data.segments} ligações)\r\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
