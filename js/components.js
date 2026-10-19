/**
 * QDC Lab Pro - Catálogo e Biblioteca de Componentes NBR 5410
 */

export const WIRE_COLORS = {
  f1: { name: 'Fase 1 (Preto)', hex: '#1e242b', standard: 'NBR 5410' },
  f2: { name: 'Fase 2 (Vermelho)', hex: '#ef4444', standard: 'NBR 5410' },
  f3: { name: 'Fase 3 (Branco)', hex: '#e2e8f0', standard: 'NBR 5410' },
  n:  { name: 'Neutro (Azul Claro)', hex: '#0284c7', standard: 'Obrigatório Azul' },
  pe: { name: 'Terra PE (Verde)', hex: '#10b981', standard: 'Obrigatório Verde/Verde-Amarelo' },
  ret:{ name: 'Retorno (Amarelo)', hex: '#eab308', standard: 'Comando Iluminação' },
  ret2:{ name: 'Retorno 2 (Laranja)', hex: '#f97316', standard: 'Comando Paralelo' },
  par:{ name: 'Paralelo / Three-Way (Cinza)', hex: '#64748b', standard: 'Comunicação' }
};

export const GAUGE_OPTIONS = [
  { value: '1.5', label: '1,5 mm² (Iluminação - até 15,5A)' },
  { value: '2.5', label: '2,5 mm² (Tomadas TUG - até 21A)' },
  { value: '4.0', label: '4,0 mm² (Cargas Médias/Ar - até 28A)' },
  { value: '6.0', label: '6,0 mm² (Chuveiro/TUE - até 36A)' },
  { value: '10.0', label: '10,0 mm² (Alimentação Geral - até 50A)' }
];

export const COMPONENT_DEFINITIONS = {
  // ==========================================
  // ALIMENTAÇÃO / PADRÃO DE ENTRADA
  // ==========================================
  source_mono: {
    name: 'Padrão Monofásico (127V ou 220V)',
    shortName: 'REDE MONO',
    category: 'source',
    categoryLabel: 'Alimentação',
    w: 120, h: 90,
    terms: [
      { id: 'f1', label: 'Fase (F)', type: 'f1', x: 0, y: 24, side: 'left' },
      { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 48, side: 'left' },
      { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 72, side: 'left' }
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
      { id: 'f1', label: 'Fase 1 (R)', type: 'f1', x: 0, y: 22, side: 'left' },
      { id: 'f2', label: 'Fase 2 (S)', type: 'f2', x: 0, y: 46, side: 'left' },
      { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 70, side: 'left' },
      { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 94, side: 'left' }
    ],
    defaultProps: { voltage: 220 }
  },

  source_tri: {
    name: 'Padrão Trifásico (220V/380V ou 127V/220V)',
    shortName: 'REDE TRIFÁSICA',
    category: 'source',
    categoryLabel: 'Alimentação',
    w: 150, h: 140,
    terms: [
      { id: 'f1', label: 'Fase 1 (R)', type: 'f1', x: 0, y: 22, side: 'left' },
      { id: 'f2', label: 'Fase 2 (S)', type: 'f2', x: 0, y: 46, side: 'left' },
      { id: 'f3', label: 'Fase 3 (T)', type: 'f3', x: 0, y: 70, side: 'left' },
      { id: 'n',  label: 'Neutro (N)', type: 'n', x: 0, y: 94, side: 'left' },
      { id: 'pe', label: 'Terra (PE)', type: 'pe', x: 0, y: 118, side: 'left' }
    ],
    defaultProps: { voltage: 380 }
  },

  // ==========================================
  // PROTEÇÃO QDC
  // ==========================================
  breaker1: {
    name: 'Disjuntor Termomagnético 1P (Monopolar)',
    shortName: 'DISJUNTOR 1P',
    category: 'qdc',
    categoryLabel: 'Proteção QDC',
    w: 70, h: 110,
    terms: [
      { id: 'in',  label: 'Entrada Fase', type: 'f1', x: 35, y: 0, side: 'top' },
      { id: 'out', label: 'Saída Circuito', type: 'f1', x: 35, y: 110, side: 'bottom' }
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
      { id: 'in1',  label: 'Entrada F1', type: 'f1', x: 28, y: 0, side: 'top' },
      { id: 'in2',  label: 'Entrada F2', type: 'f2', x: 67, y: 0, side: 'top' },
      { id: 'out1', label: 'Saída F1',   type: 'f1', x: 28, y: 110, side: 'bottom' },
      { id: 'out2', label: 'Saída F2',   type: 'f2', x: 67, y: 110, side: 'bottom' }
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
      { id: 'in1',  label: 'Entrada F1', type: 'f1', x: 25, y: 0, side: 'top' },
      { id: 'in2',  label: 'Entrada F2', type: 'f2', x: 62, y: 0, side: 'top' },
      { id: 'in3',  label: 'Entrada F3', type: 'f3', x: 100, y: 0, side: 'top' },
      { id: 'out1', label: 'Saída F1',   type: 'f1', x: 25, y: 110, side: 'bottom' },
      { id: 'out2', label: 'Saída F2',   type: 'f2', x: 62, y: 110, side: 'bottom' },
      { id: 'out3', label: 'Saída F3',   type: 'f3', x: 100, y: 110, side: 'bottom' }
    ],
    defaultProps: { rating: 50, isOn: true, tripped: false, curve: 'C' }
  },

  rcd2: {
    name: 'Interruptor Diferencial Residual (IDR / DR 2P)',
    shortName: 'DR 2 POLOS (30mA)',
    category: 'qdc',
    categoryLabel: 'Proteção QDC',
    w: 95, h: 120,
    terms: [
      { id: 'in_f',  label: 'Entrada Fase',   type: 'f1', x: 28, y: 0, side: 'top' },
      { id: 'in_n',  label: 'Entrada Neutro', type: 'n',  x: 67, y: 0, side: 'top' },
      { id: 'out_f', label: 'Saída Fase',     type: 'f1', x: 28, y: 120, side: 'bottom' },
      { id: 'out_n', label: 'Saída Neutro',   type: 'n',  x: 67, y: 120, side: 'bottom' }
    ],
    defaultProps: { rating: 40, sensitivity: 30, isOn: true, tripped: false }
  },

  rcd4: {
    name: 'Interruptor Diferencial Residual (IDR / DR 4P)',
    shortName: 'DR TETRAPOLAR (30mA)',
    category: 'qdc',
    categoryLabel: 'Proteção QDC',
    w: 155, h: 120,
    terms: [
      { id: 'in1',  label: 'Entrada F1',     type: 'f1', x: 24, y: 0, side: 'top' },
      { id: 'in2',  label: 'Entrada F2',     type: 'f2', x: 58, y: 0, side: 'top' },
      { id: 'in3',  label: 'Entrada F3',     type: 'f3', x: 92, y: 0, side: 'top' },
      { id: 'in_n', label: 'Entrada Neutro', type: 'n',  x: 128, y: 0, side: 'top' },
      { id: 'out1', label: 'Saída F1',       type: 'f1', x: 24, y: 120, side: 'bottom' },
      { id: 'out2', label: 'Saída F2',       type: 'f2', x: 58, y: 120, side: 'bottom' },
      { id: 'out3', label: 'Saída F3',       type: 'f3', x: 92, y: 120, side: 'bottom' },
      { id: 'out_n',label: 'Saída Neutro',   type: 'n',  x: 128, y: 120, side: 'bottom' }
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
      { id: 'in',  label: 'Entrada Fase/N', type: 'f1', x: 35, y: 0, side: 'top' },
      { id: 'pe',  label: 'Aterramento PE', type: 'pe', x: 35, y: 100, side: 'bottom' }
    ],
    defaultProps: { maxVoltage: 275, maxCurrentKa: 45, ok: true }
  },

  neutral_bus: {
    name: 'Barramento de Neutro Isolado',
    shortName: 'BARRAMENTO NEUTRO',
    category: 'bus',
    categoryLabel: 'Barramentos',
    w: 160, h: 46,
    terms: [
      { id: 'n0', label: 'N0', type: 'n', x: 0, y: 23, side: 'left' },
      { id: 'n1', label: 'N1', type: 'n', x: 35, y: 46, side: 'bottom' },
      { id: 'n2', label: 'N2', type: 'n', x: 65, y: 46, side: 'bottom' },
      { id: 'n3', label: 'N3', type: 'n', x: 95, y: 46, side: 'bottom' },
      { id: 'n4', label: 'N4', type: 'n', x: 125, y: 46, side: 'bottom' },
      { id: 'n5', label: 'N5', type: 'n', x: 160, y: 23, side: 'right' }
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
      { id: 'pe0', label: 'PE0', type: 'pe', x: 0, y: 23, side: 'left' },
      { id: 'pe1', label: 'PE1', type: 'pe', x: 35, y: 46, side: 'bottom' },
      { id: 'pe2', label: 'PE2', type: 'pe', x: 65, y: 46, side: 'bottom' },
      { id: 'pe3', label: 'PE3', type: 'pe', x: 95, y: 46, side: 'bottom' },
      { id: 'pe4', label: 'PE4', type: 'pe', x: 125, y: 46, side: 'bottom' },
      { id: 'pe5', label: 'PE5', type: 'pe', x: 160, y: 23, side: 'right' }
    ],
    defaultProps: {}
  },

  // ==========================================
  // COMANDOS & INTERRUPTORES
  // ==========================================
  switch_simple: {
    name: 'Interruptor Simples (1 Tecla)',
    shortName: 'INTERRUPTOR SIMPLES',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 80, h: 80,
    terms: [
      { id: 'in',  label: 'Fase (L)', type: 'f1', x: 0, y: 40, side: 'left' },
      { id: 'out', label: 'Retorno (R)', type: 'ret', x: 80, y: 40, side: 'right' }
    ],
    defaultProps: { isOn: false }
  },

  switch_parallel: {
    name: 'Interruptor Paralelo (Three-Way)',
    shortName: 'THREE-WAY (PARALELO)',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 90, h: 80,
    terms: [
      { id: 'com', label: 'Comum (Fase ou Ret. Lâmpada)', type: 'f1', x: 0, y: 40, side: 'left' },
      { id: 'p1',  label: 'Paralelo 1', type: 'ret2', x: 90, y: 25, side: 'right' },
      { id: 'p2',  label: 'Paralelo 2', type: 'ret2', x: 90, y: 55, side: 'right' }
    ],
    defaultProps: { position: 1 } // 1 ou 2
  },

  switch_intermediate: {
    name: 'Interruptor Intermediário (Four-Way)',
    shortName: 'FOUR-WAY (INTERMEDIÁRIO)',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 90, h: 80,
    terms: [
      { id: 'in1',  label: 'Entrada 1', type: 'ret2', x: 0, y: 25, side: 'left' },
      { id: 'in2',  label: 'Entrada 2', type: 'ret2', x: 0, y: 55, side: 'left' },
      { id: 'out1', label: 'Saída 1',   type: 'ret2', x: 90, y: 25, side: 'right' },
      { id: 'out2', label: 'Saída 2',   type: 'ret2', x: 90, y: 55, side: 'right' }
    ],
    defaultProps: { crossed: false }
  },

  switch_bipolar: {
    name: 'Interruptor Bipolar (2 Polos Simultâneos 220V)',
    shortName: 'INTERRUPTOR BIPOLAR',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 90, h: 90,
    terms: [
      { id: 'in1',  label: 'Fase 1 IN',  type: 'f1', x: 0, y: 28, side: 'left' },
      { id: 'in2',  label: 'Fase 2 IN',  type: 'f2', x: 0, y: 62, side: 'left' },
      { id: 'out1', label: 'Fase 1 OUT', type: 'ret', x: 90, y: 28, side: 'right' },
      { id: 'out2', label: 'Fase 2 OUT', type: 'ret', x: 90, y: 62, side: 'right' }
    ],
    defaultProps: { isOn: false }
  },

  switch_push: {
    name: 'Pulsador de Campainha / Minuteria',
    shortName: 'PULSADOR CAMPAINHA',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 80, h: 80,
    terms: [
      { id: 'in',  label: 'Fase IN', type: 'f1', x: 0, y: 40, side: 'left' },
      { id: 'out', label: 'Retorno OUT', type: 'ret', x: 80, y: 40, side: 'right' }
    ],
    defaultProps: { isPressed: false }
  },

  pir_sensor: {
    name: 'Sensor de Presença (Infravermelho PIR)',
    shortName: 'SENSOR DE PRESENÇA',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 95, h: 95,
    terms: [
      { id: 'f',   label: 'Fase (L)',    type: 'f1', x: 0, y: 26, side: 'left' },
      { id: 'n',   label: 'Neutro (N)',  type: 'n',  x: 0, y: 48, side: 'left' },
      { id: 'out', label: 'Retorno (R)', type: 'ret', x: 95, y: 48, side: 'right' }
    ],
    defaultProps: { detected: false }
  },

  photocell: {
    name: 'Relé Fotoelétrico / Fotocélula',
    shortName: 'FOTOCÉLULA DIA/NOITE',
    category: 'command',
    categoryLabel: 'Comandos & Teclas',
    w: 95, h: 95,
    terms: [
      { id: 'f',   label: 'Fase (L)',    type: 'f1', x: 0, y: 26, side: 'left' },
      { id: 'n',   label: 'Neutro (N)',  type: 'n',  x: 0, y: 48, side: 'left' },
      { id: 'out', label: 'Carga (R)',   type: 'ret', x: 95, y: 48, side: 'right' }
    ],
    defaultProps: { isNight: false }
  },

  // ==========================================
  // CARGAS & CONSUMIDORES
  // ==========================================
  lamp_led: {
    name: 'Lâmpada LED (Iluminação Teto)',
    shortName: 'LÂMPADA LED',
    category: 'load',
    categoryLabel: 'Cargas & Aparelhos',
    w: 90, h: 90,
    terms: [
      { id: 'ret', label: 'Retorno / Fase', type: 'ret', x: 0, y: 45, side: 'left' },
      { id: 'n',   label: 'Neutro',         type: 'n',   x: 90, y: 45, side: 'right' }
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
      { id: 'f',  label: 'Fase (Direita)', type: 'f1', x: 0, y: 25, side: 'left' },
      { id: 'pe', label: 'Terra (Centro)', type: 'pe', x: 0, y: 45, side: 'left' },
      { id: 'n',  label: 'Neutro (Esquerda)', type: 'n', x: 0, y: 65, side: 'left' }
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
      { id: 'f1', label: 'Fase 1', type: 'f1', x: 0, y: 25, side: 'left' },
      { id: 'pe', label: 'Terra',  type: 'pe', x: 0, y: 45, side: 'left' },
      { id: 'f2', label: 'Fase 2 / Neutro', type: 'f2', x: 0, y: 65, side: 'left' }
    ],
    defaultProps: { loadConnected: true, watts: 1500 }
  },

  shower: {
    name: 'Chuveiro Elétrico Potente (5500W / 7500W)',
    shortName: 'CHUVEIRO ELÉTRICO',
    category: 'load',
    categoryLabel: 'Cargas & Aparelhos',
    w: 120, h: 105,
    terms: [
      { id: 'f1', label: 'Fase 1 (ou Fase)', type: 'f1', x: 0, y: 28, side: 'left' },
      { id: 'pe', label: 'Terra (Obrigatório)', type: 'pe', x: 0, y: 52, side: 'left' },
      { id: 'f2', label: 'Fase 2 (ou Neutro)', type: 'f2', x: 0, y: 76, side: 'left' }
    ],
    defaultProps: { mode: 'inverno', watts: 6800, isRunning: false } // 'desligado', 'verao' (3200W), 'inverno' (6800W)
  },

  fan: {
    name: 'Ventilador de Teto com Iluminação',
    shortName: 'VENTILADOR C/ LUZ',
    category: 'load',
    categoryLabel: 'Cargas & Aparelhos',
    w: 105, h: 105,
    terms: [
      { id: 'ret_mot', label: 'Retorno Motor', type: 'ret', x: 0, y: 30, side: 'left' },
      { id: 'ret_luz', label: 'Retorno Luz',   type: 'ret', x: 0, y: 55, side: 'left' },
      { id: 'n',       label: 'Neutro Comum',  type: 'n',   x: 105, y: 42, side: 'right' }
    ],
    defaultProps: { watts: 130, fanOn: false, lightOn: false }
  },

  motor: {
    name: 'Motor Elétrico / Bomba Monofásica',
    shortName: 'MOTOR / BOMBA D’ÁGUA',
    category: 'load',
    categoryLabel: 'Cargas & Aparelhos',
    w: 110, h: 95,
    terms: [
      { id: 'f',  label: 'Fase',  type: 'f1', x: 0, y: 28, side: 'left' },
      { id: 'pe', label: 'Terra', type: 'pe', x: 0, y: 48, side: 'left' },
      { id: 'n',  label: 'Neutro',type: 'n',  x: 0, y: 68, side: 'left' }
    ],
    defaultProps: { hp: '1/2 CV', watts: 550, isRunning: false }
  },

  buzzer: {
    name: 'Campainha Sonora / Cigarra',
    shortName: 'CAMPAINHA ELETRÔNICA',
    category: 'load',
    categoryLabel: 'Cargas & Aparelhos',
    w: 80, h: 80,
    terms: [
      { id: 'ret', label: 'Retorno Pulsador', type: 'ret', x: 0, y: 40, side: 'left' },
      { id: 'n',   label: 'Neutro',           type: 'n',   x: 80, y: 40, side: 'right' }
    ],
    defaultProps: { isRinging: false }
  }
};
