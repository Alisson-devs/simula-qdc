/**
 * QDC Lab Pro - Motor de Simulação Elétrica e Física de Circuitos (NBR 5410)
 */
import { sound } from './audio.js';

export class CircuitSimulator {
  constructor() {
    this.systemVoltage = 220; // 127V / 220V ou 220V / 380V
    this.trippedParts = new Set();
    this.overloadTimers = new Map();
  }

  setSystemVoltage(v) {
    this.systemVoltage = Number(v) || 220;
  }

  // Executa uma varredura completa da topologia da rede
  analyze(parts, wires, isSimulationActive) {
    const report = {
      active: isSimulationActive,
      hasShort: false,
      shorts: [],
      shortedWires: new Set(),
      trippedBreakers: [],
      loads: [],
      totalPower: 0,
      totalCurrent: 0,
      phaseLoads: { f1: 0, f2: 0, f3: 0 },
      liveWires: new Map(), // wireId -> { f1, f2, f3, n, pe, ret, voltage, current }
      terminalPotentials: new Map(), // 'pid:tidx' -> Set of nets
      warnings: [],
      compliance: []
    };

    if (!isSimulationActive) {
      return report;
    }

    // 1. Mapeamento de malhas equipotenciais (Graph Traversal)
    const nets = {
      f1: new Set(),
      f2: new Set(),
      f3: new Set(),
      n:  new Set(),
      pe: new Set()
    };

    // Identifica pontos de entrada de alimentação (Sources)
    parts.filter(p => p.kind.startsWith('source')).forEach(source => {
      source.terms.forEach(t => {
        const key = `${source.id}:${t.idx}`;
        if (t.type === 'f1') nets.f1.add(key);
        else if (t.type === 'f2') nets.f2.add(key);
        else if (t.type === 'f3') nets.f3.add(key);
        else if (t.type === 'n')  nets.n.add(key);
        else if (t.type === 'pe') nets.pe.add(key);
      });
    });

    // Propaga conexões através de fios e componentes comutadores
    let changed = true;
    let iterations = 0;
    const maxIterations = 200; // Evita loop infinito

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Propagação por fios externos
      wires.forEach(w => {
        const kA = `${w.a.pid}:${w.a.idx}`;
        const kB = `${w.b.pid}:${w.b.idx}`;

        Object.keys(nets).forEach(netName => {
          const net = nets[netName];
          if (net.has(kA) && !net.has(kB)) {
            net.add(kB);
            changed = true;
          }
          if (net.has(kB) && !net.has(kA)) {
            net.add(kA);
            changed = true;
          }
        });
      });

      // Propagação por contato direto de barramentos pente encaixados nos bornes
      const dockedConns = this.getDockedCombConnections(parts);
      dockedConns.forEach(dc => {
        const kA = `${dc.combId}:${dc.combTermIdx}`;
        const kB = `${dc.compId}:${dc.compTermIdx}`;

        Object.keys(nets).forEach(netName => {
          const net = nets[netName];
          if (net.has(kA) && !net.has(kB)) {
            net.add(kB);
            changed = true;
          }
          if (net.has(kB) && !net.has(kA)) {
            net.add(kA);
            changed = true;
          }
        });
      });

      // Propagação interna em componentes (disjuntores, chaves, barramentos)
      parts.forEach(p => {
        const conductionPairs = this.getInternalConductionPairs(p);

        conductionPairs.forEach(([idxA, idxB]) => {
          const kA = `${p.id}:${idxA}`;
          const kB = `${p.id}:${idxB}`;

          Object.keys(nets).forEach(netName => {
            const net = nets[netName];
            if (net.has(kA) && !net.has(kB)) {
              net.add(kB);
              changed = true;
            }
            if (net.has(kB) && !net.has(kA)) {
              net.add(kA);
              changed = true;
            }
          });
        });
      });
    }

    // Registra potenciais por terminal para o multímetro
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

    // 2. DETECTOR DE CURTO-CIRCUITO E COLISÃO DE MALHAS
    const shortTests = [
      { a: 'f1', b: 'f2', nameA: 'Fase 1', nameB: 'Fase 2', severity: 'Fase-Fase 220V' },
      { a: 'f1', b: 'f3', nameA: 'Fase 1', nameB: 'Fase 3', severity: 'Fase-Fase 220V' },
      { a: 'f2', b: 'f3', nameA: 'Fase 2', nameB: 'Fase 3', severity: 'Fase-Fase 220V' },
      { a: 'f1', b: 'n',  nameA: 'Fase 1', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
      { a: 'f2', b: 'n',  nameA: 'Fase 2', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
      { a: 'f3', b: 'n',  nameA: 'Fase 3', nameB: 'Neutro', severity: 'Fase-Neutro Franco' },
      { a: 'f1', b: 'pe', nameA: 'Fase 1', nameB: 'Terra (PE)', severity: 'Fase-Terra (Choque/Falha Gravíssima)' },
      { a: 'f2', b: 'pe', nameA: 'Fase 2', nameB: 'Terra (PE)', severity: 'Fase-Terra (Choque/Falha Gravíssima)' },
      { a: 'f3', b: 'pe', nameA: 'Fase 3', nameB: 'Terra (PE)', severity: 'Fase-Terra (Choque/Falha Gravíssima)' }
    ];

    shortTests.forEach(test => {
      for (let node of nets[test.a]) {
        if (nets[test.b].has(node)) {
          report.hasShort = true;
          report.shorts.push(`🔥 Curto-Circuito ${test.severity}: ${test.nameA} conectado diretamente com ${test.nameB}!`);

          // Identifica fios no curto
          wires.forEach(w => {
            const kA = `${w.a.pid}:${w.a.idx}`;
            const kB = `${w.b.pid}:${w.b.idx}`;
            if (kA === node || kB === node || (nets[test.a].has(kA) && nets[test.b].has(kB)) || (nets[test.b].has(kA) && nets[test.a].has(kB))) {
              report.shortedWires.add(w.id);
            }
          });
        }
      }
    });

    // Se houver curto, dispara o disjuntor mais próximo ligado no ramo
    if (report.hasShort) {
      sound.playShortCircuit();

      parts.forEach(p => {
        if (['breaker1', 'breaker2', 'breaker3', 'rcd2', 'rcd4'].includes(p.kind) && p.props?.isOn && !p.props?.tripped) {
          // Verifica se o disjuntor está no caminho do curto
          const hasShortTerminal = p.terms.some(t => {
            const k = `${p.id}:${t.idx}`;
            return (nets.f1.has(k) && nets.n.has(k)) || (nets.f1.has(k) && nets.f2.has(k)) || (nets.f1.has(k) && nets.pe.has(k));
          });

          if (hasShortTerminal) {
            p.props.isOn = false;
            p.props.tripped = true;
            report.trippedBreakers.push(p.id);
            sound.playTrip();
          }
        }
      });

      return report;
    }

    // 3. ANÁLISE DE CARGAS E CONSUMO (Se não houver curto franco)
    parts.forEach(p => {
      this.evaluateLoad(p, nets, report);
    });

    // 4. MAPEIA ENERGIZAÇÃO DOS FIOS PARA FEEDBACK VISUAL
    wires.forEach(w => {
      const kA = `${w.a.pid}:${w.a.idx}`;
      const kB = `${w.b.pid}:${w.b.idx}`;
      
      const hasF1 = nets.f1.has(kA) || nets.f1.has(kB);
      const hasF2 = nets.f2.has(kA) || nets.f2.has(kB);
      const hasF3 = nets.f3.has(kA) || nets.f3.has(kB);
      const hasN  = nets.n.has(kA)  || nets.n.has(kB);
      const hasPE = nets.pe.has(kA) || nets.pe.has(kB);

      const isLive = hasF1 || hasF2 || hasF3;

      let estimatedVoltage = 0;
      if ((hasF1 && hasF2) || (hasF2 && hasF3) || (hasF1 && hasF3)) {
        estimatedVoltage = this.systemVoltage === 127 ? 220 : 380;
      } else if (isLive && hasN) {
        estimatedVoltage = this.systemVoltage === 127 ? 127 : 220;
      } else if (isLive) {
        estimatedVoltage = this.systemVoltage === 127 ? 127 : 220;
      }

      report.liveWires.set(w.id, {
        isLive,
        hasF1, hasF2, hasF3, hasN, hasPE,
        voltage: estimatedVoltage
      });

      // Verificação NBR 5410 de Cores dos Condutores
      this.checkWireNormCompliance(w, { hasF1, hasF2, hasF3, hasN, hasPE }, report);
    });

    // 5. VERIFICAÇÃO DE SOBRECARGA EM DISJUNTORES
    parts.forEach(p => {
      if (['breaker1', 'breaker2', 'breaker3'].includes(p.kind) && p.props?.isOn && !p.props?.tripped) {
        const rating = Number(p.props.rating) || 16;
        // Se a corrente calculada no circuito ultrapassar o disjuntor em 30%
        if (report.totalCurrent > rating * 1.35) {
          report.warnings.push(`⚠️ Sobrecarga no Disjuntor ${p.shortName || p.id}: Corrente excessiva para a capacidade de ${rating}A.`);
        }
      }
    });

    return report;
  }

  // Identifica conexões físicas diretas de encaixe entre dentes do pente e bornes superiores
  getDockedCombConnections(parts) {
    const connections = [];
    const combs = parts.filter(p => ['comb_1p', 'comb_2p', 'comb_3p'].includes(p.kind));
    const modulars = parts.filter(p => ['breaker1', 'breaker2', 'breaker3', 'spd', 'spd3', 'rcd2', 'rcd4'].includes(p.kind));

    combs.forEach(comb => {
      comb.terms.forEach(ct => {
        const pinGlobalX = comb.x + ct.x;
        const pinGlobalY = comb.y + ct.y;

        modulars.forEach(comp => {
          comp.terms.forEach(mt => {
            // Apenas bornes de entrada superiores (y <= 20)
            if (mt.y > 20) return;
            const borneGlobalX = comp.x + mt.x;
            const borneGlobalY = comp.y + mt.y;

            const dx = Math.abs(pinGlobalX - borneGlobalX);
            const dy = Math.abs(pinGlobalY - borneGlobalY);
            if (dx <= 8 && dy <= 16) {
              connections.push({
                combId: comb.id,
                combTermIdx: ct.idx,
                combPinId: ct.id,
                compId: comp.id,
                compTermIdx: mt.idx,
                compTermId: mt.id,
                phase: ct.type
              });
            }
          });
        });
      });
    });
    return connections;
  }

  // Define os pares de terminais internamente fechados de cada componente
  getInternalConductionPairs(p) {
    const pairs = [];
    const props = p.props || {};

    if (props.tripped) return pairs; // Desarmado = tudo aberto

    switch (p.kind) {
      case 'breaker1':
        if (props.isOn) pairs.push([0, 1]);
        break;

      case 'breaker2':
        if (props.isOn) {
          pairs.push([0, 2]); // In1 -> Out1
          pairs.push([1, 3]); // In2 -> Out2
        }
        break;

      case 'breaker3':
        if (props.isOn) {
          pairs.push([0, 3]); // In1 -> Out1
          pairs.push([1, 4]); // In2 -> Out2
          pairs.push([2, 5]); // In3 -> Out3
        }
        break;

      case 'rcd2':
        if (props.isOn) {
          pairs.push([0, 2]); // In_F -> Out_F
          pairs.push([1, 3]); // In_N -> Out_N
        }
        break;

      case 'rcd4':
        if (props.isOn) {
          pairs.push([0, 4]); // In1 -> Out1
          pairs.push([1, 5]); // In2 -> Out2
          pairs.push([2, 6]); // In3 -> Out3
          pairs.push([3, 7]); // In_N -> Out_N
        }
        break;

      case 'neutral_bus':
      case 'earth_bus':
      case 'wire_junction':
      case 'comb_1p':
        // Todos os terminais do barramento monofásico são equipotenciais
        if (p.terms && p.terms.length > 1) {
          for (let i = 0; i < p.terms.length - 1; i++) {
            pairs.push([i, i + 1]);
          }
        }
        break;

      case 'comb_2p':
        // Barramento Bifásico: Pinos pares = L1; Pinos ímpares = L2
        if (p.terms && p.terms.length > 2) {
          for (let i = 0; i < p.terms.length - 2; i += 2) {
            pairs.push([i, i + 2]);
          }
          for (let i = 1; i < p.terms.length - 2; i += 2) {
            pairs.push([i, i + 2]);
          }
        }
        break;

      case 'comb_3p':
        // Barramento Trifásico: L1 (0, 3, 6...), L2 (1, 4, 7...), L3 (2, 5, 8...)
        if (p.terms && p.terms.length > 3) {
          for (let i = 0; i < p.terms.length - 3; i += 3) {
            pairs.push([i, i + 3]);
          }
          for (let i = 1; i < p.terms.length - 3; i += 3) {
            pairs.push([i, i + 3]);
          }
          for (let i = 2; i < p.terms.length - 3; i += 3) {
            pairs.push([i, i + 3]);
          }
        }
        break;

      case 'switch_simple':
        if (props.isOn) pairs.push([0, 1]);
        break;

      case 'switch_parallel':
        // Comum (0). Posição 1 conecta ao borne 1, posição 2 conecta ao borne 2
        if (props.position === 1) pairs.push([0, 1]);
        else pairs.push([0, 2]);
        break;

      case 'switch_intermediate':
        // Four-way: Direto ou Cruzado
        if (!props.crossed) {
          pairs.push([0, 2]);
          pairs.push([1, 3]);
        } else {
          pairs.push([0, 3]);
          pairs.push([1, 2]);
        }
        break;

      case 'switch_bipolar':
        if (props.isOn) {
          pairs.push([0, 2]);
          pairs.push([1, 3]);
        }
        break;

      case 'switch_push':
        if (props.isPressed) pairs.push([0, 1]);
        break;

      case 'pir_sensor':
        // Se detector ativo, fecha contato da Fase com o Retorno
        if (props.detected) pairs.push([0, 2]);
        break;

      case 'photocell':
        // Se noite, fecha contato da Fase com a Carga
        if (props.isNight) pairs.push([0, 2]);
        break;

      case 'spd':
        // DPS em regime normal não conduz (só fecha em pico de surto)
        break;

      default:
        break;
    }

    return pairs;
  }

  // Avalia o funcionamento de cada carga (lâmpada, tomada, chuveiro, etc.)
  evaluateLoad(p, nets, report, wires = []) {
    const props = p.props || {};

    const hasTerm = (termId, netName) => {
      const t = p.terms.find(item => item.id === termId);
      if (!t) return false;
      return nets[netName].has(`${p.id}:${t.idx}`);
    };

    // Tensão nominal escolhida pelo usuário para a carga
    const defaultV = (p.kind === 'shower' || p.kind === 'socket_tue') ? 220 : (this.systemVoltage === 127 ? 127 : 220);
    const nominalVoltage = Number(props.voltage) || defaultV;
    props.voltage = nominalVoltage;

    const getAppliedVoltage = () => {
      const activePhases = new Set();
      let hasN = false;
      p.terms.forEach(t => {
        const key = `${p.id}:${t.idx}`;
        if (nets.f1?.has(key)) activePhases.add('f1');
        if (nets.f2?.has(key)) activePhases.add('f2');
        if (nets.f3?.has(key)) activePhases.add('f3');
        if (nets.n?.has(key)) hasN = true;
      });
      if (activePhases.size >= 2) {
        return this.systemVoltage === 127 ? 220 : 380;
      }
      if (activePhases.size === 1 && hasN) {
        return this.systemVoltage === 127 ? 127 : 220;
      }
      return 0;
    };

    const handleLoadPowerAndCurrent = (basePower, label) => {
      const appliedV = getAppliedVoltage();
      if (appliedV <= 0) return;

      if (nominalVoltage === 127 && appliedV >= 220) {
        report.warnings.push(`🚨 SOBRETENSÃO CRÍTICA: Carga "${p.shortName || p.name}" (#${p.id}) de 127V está recebendo ${appliedV}V! Risco de QUEIMA IMEDIATA / INCÊNDIO!`);
      } else if (nominalVoltage === 220 && appliedV === 127) {
        report.warnings.push(`⚠️ SUBTENSÃO: Carga "${p.shortName || p.name}" (#${p.id}) de 220V recebendo 127V. Operação com rendimento e força reduzidos (~33%).`);
      }

      let effectivePower = basePower;
      if (nominalVoltage === 220 && appliedV === 127) {
        effectivePower = Math.round(basePower * (127 / 220) * (127 / 220));
      } else if (nominalVoltage === 127 && appliedV >= 220) {
        effectivePower = Math.round(basePower * (appliedV / 127) * (appliedV / 127));
      }

      const current = effectivePower / appliedV;
      report.totalPower += effectivePower;
      report.totalCurrent += current;
      report.loads.push({
        name: `${label} (${nominalVoltage}V)`,
        power: effectivePower,
        current,
        voltage: appliedV
      });
    };

    switch (p.kind) {
      case 'lamp_led': {
        const retLive = hasTerm('ret', 'f1') || hasTerm('ret', 'f2') || hasTerm('ret', 'f3');
        const hasNeutral = hasTerm('n', 'n');
        const isPowered = retLive && hasNeutral;

        props.isLit = isPowered;
        if (isPowered) {
          handleLoadPowerAndCurrent(props.watts || 15, `Lâmpada LED (${p.id})`);
        }
        break;
      }

      case 'socket_tug': {
        const hasF1 = hasTerm('f', 'f1') || hasTerm('f', 'f2') || hasTerm('f', 'f3');
        const hasN  = hasTerm('n', 'n');
        const hasPE = hasTerm('pe', 'pe');

        const isPowered = hasF1 && hasN;
        props.isPowered = isPowered;

        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Tomada TUG (${p.id}) funcionando sem condutor de proteção (Terra PE). Risco de choque elétrico.`);
        }

        if (isPowered) {
          handleLoadPowerAndCurrent(props.watts || 100, `Tomada TUG 10A (${p.id})`);
        }
        break;
      }

      case 'socket_tue': {
        const hasF1 = hasTerm('f1', 'f1') || hasTerm('f1', 'f2') || hasTerm('f1', 'f3');
        const hasF2 = hasTerm('f2', 'f1') || hasTerm('f2', 'f2') || hasTerm('f2', 'f3') || hasTerm('f2', 'n');
        const hasPE = hasTerm('pe', 'pe');

        const isPowered = hasF1 && hasF2;
        props.isPowered = isPowered;

        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Tomada TUE 20A (${p.id}) sem condutor Terra PE obrigatório!`);
        }

        if (isPowered) {
          handleLoadPowerAndCurrent(props.watts || 2200, `Tomada TUE 20A (${p.id})`);
        }
        break;
      }

      case 'shower': {
        const hasF1 = hasTerm('f1', 'f1') || hasTerm('f1', 'f2') || hasTerm('f1', 'f3');
        const hasF2 = hasTerm('f2', 'f1') || hasTerm('f2', 'f2') || hasTerm('f2', 'f3') || hasTerm('f2', 'n');
        const hasPE = hasTerm('pe', 'pe');

        const isPowered = hasF1 && hasF2;
        props.isRunning = isPowered && props.mode !== 'desligado';

        if (isPowered && !hasPE) {
          report.warnings.push(`🚨 CRÍTICO: Chuveiro Elétrico ligado SEM condutor de aterramento (PE)! Risco gravíssimo de choque letal na água.`);
        }

        if (props.isRunning) {
          const basePower = props.mode === 'inverno' ? (props.watts || 6800) : Math.round((props.watts || 6800) * 0.47);
          handleLoadPowerAndCurrent(basePower, `Chuveiro Elétrico (${props.mode})`);
        }
        break;
      }

      case 'fan': {
        const motLive = hasTerm('ret_mot', 'f1') || hasTerm('ret_mot', 'f2') || hasTerm('ret_mot', 'f3');
        const luzLive = hasTerm('ret_luz', 'f1') || hasTerm('ret_luz', 'f2') || hasTerm('ret_luz', 'f3');
        const hasN = hasTerm('n', 'n');

        props.fanOn = motLive && hasN;
        props.lightOn = luzLive && hasN;

        let power = 0;
        if (props.fanOn) power += 80;
        if (props.lightOn) power += 50;

        if (power > 0) {
          handleLoadPowerAndCurrent(power, 'Ventilador de Teto');
        }
        break;
      }

      case 'motor': {
        const hasF = hasTerm('f', 'f1') || hasTerm('f', 'f2') || hasTerm('f', 'f3');
        const hasN = hasTerm('n', 'n');
        const hasPE = hasTerm('pe', 'pe');

        const isPowered = hasF && hasN;
        props.isRunning = isPowered;

        if (isPowered && !hasPE) {
          report.warnings.push(`⚠️ Carcaça do Motor Elétrico (${p.id}) desprovida de ligação com o barramento de aterramento (PE).`);
        }

        if (isPowered) {
          handleLoadPowerAndCurrent(props.watts || 750, `Motor / Bomba D'água`);
        }
        break;
      }

      case 'buzzer': {
        const retLive = hasTerm('ret', 'f1') || hasTerm('ret', 'f2');
        const hasN = hasTerm('n', 'n');

        const ringing = retLive && hasN;
        props.isRinging = ringing;
        if (ringing) {
          sound.playBuzzer();
          report.loads.push({ name: 'Campainha Eletrônica', power: 10, current: 0.08, voltage: 127 });
        }
        break;
      }

      default:
        break;
    }
  }

  // Verifica conformidade de cores da NBR 5410 nos fios instalados
  checkWireNormCompliance(w, status, report) {
    // Regra rígida: Neutro DEVE ser Azul Claro
    if (status.hasN && w.color !== 'n') {
      report.compliance.push(`Norma NBR 5410: Condutor de Neutro deve ter isolação exclusivamente Azul Claro (utilizado: ${w.color}).`);
    }
    // Regra rígida: PE DEVE ser Verde ou Verde/Amarelo
    if (status.hasPE && w.color !== 'pe') {
      report.compliance.push(`Norma NBR 5410: Condutor de Proteção (PE) deve ter isolação Verde/Verde-Amarelo (utilizado: ${w.color}).`);
    }
    // Não pode usar verde ou azul para condutores de Fase
    if ((status.hasF1 || status.hasF2 || status.hasF3) && (w.color === 'pe' || w.color === 'n')) {
      report.compliance.push(`Norma NBR 5410: Proibido utilizar condutores Azul ou Verde para condução de FASE!`);
    }
  }

  // Medição precisa para o multímetro digital entre ponta preta (COM) e ponta vermelha (V/Ω)
  measure(probeBlack, probeRed, report) {
    if (!report || !report.active) {
      return { mode: 'off', text: '0.0 V' };
    }

    if (!probeBlack || !probeRed) {
      return { mode: 'floating', text: '0.0 V' };
    }

    const netsBlack = report.terminalPotentials.get(`${probeBlack.pid}:${probeBlack.tidx}`) || new Set();
    const netsRed   = report.terminalPotentials.get(`${probeRed.pid}:${probeRed.tidx}`) || new Set();

    const isBlackF1 = netsBlack.has('f1'), isRedF1 = netsRed.has('f1');
    const isBlackF2 = netsBlack.has('f2'), isRedF2 = netsRed.has('f2');
    const isBlackF3 = netsBlack.has('f3'), isRedF3 = netsRed.has('f3');
    const isBlackN  = netsBlack.has('n'),  isRedN  = netsRed.has('n');
    const isBlackPE = netsBlack.has('pe'), isRedPE = netsRed.has('pe');

    const blackHasPhase = isBlackF1 || isBlackF2 || isBlackF3;
    const redHasPhase   = isRedF1   || isRedF2   || isRedF3;

    // Fase - Fase
    if (blackHasPhase && redHasPhase) {
      if ((isBlackF1 && isRedF2) || (isBlackF2 && isRedF1) || (isBlackF1 && isRedF3) || (isBlackF3 && isRedF1) || (isBlackF2 && isRedF3) || (isBlackF3 && isRedF2)) {
        const v = this.systemVoltage === 127 ? 220 : 380;
        return { mode: 'voltage', text: `${v.toFixed(1)} V~`, type: 'Fase - Fase' };
      }
      return { mode: 'voltage', text: `0.0 V~`, type: 'Mesma Fase' };
    }

    // Fase - Neutro
    if ((blackHasPhase && isRedN) || (redHasPhase && isBlackN)) {
      const v = this.systemVoltage === 127 ? 127 : 220;
      return { mode: 'voltage', text: `${v.toFixed(1)} V~`, type: 'Fase - Neutro' };
    }

    // Fase - Terra
    if ((blackHasPhase && isRedPE) || (redHasPhase && isBlackPE)) {
      const v = this.systemVoltage === 127 ? 127 : 220;
      return { mode: 'voltage', text: `${v.toFixed(1)} V~`, type: 'Fase - Terra' };
    }

    // Neutro - Terra
    if ((isBlackN && isRedPE) || (isRedN && isBlackPE)) {
      return { mode: 'voltage', text: `0.8 V~`, type: 'Queda de Tensão N-PE' };
    }

    // Continuidade / Mesmo nó
    let connected = false;
    for (let n of netsBlack) {
      if (netsRed.has(n)) {
        connected = true;
        break;
      }
    }

    if (connected && netsBlack.size > 0) {
      return { mode: 'continuity', text: `0.2 Ω (BIP)`, type: 'Continuidade Elétrica' };
    }

    return { mode: 'voltage', text: `0.0 V~`, type: 'Sem Diferencial de Potencial' };
  }
}
