# ⚡ QDC Lab PRO — Simulador Elétrico Residencial & CAD NBR 5410

Simulador interativo de instalações elétricas residenciais com motor CAD 2D, cálculo de corrente em tempo real, detecção física de curto-circuito, dimensionamento de cabos pela norma **NBR 5410**, multímetro digital True RMS e suporte completo para smartphones e computadores.

---

## 🚀 Demonstração Rápida & Deploy na Vercel

O projeto foi estruturado para publicação imediata na [Vercel](https://vercel.com):

1. Conecte este repositório (`simula-qdc`) na sua conta da **Vercel**.
2. O arquivo [`vercel.json`](./vercel.json) já está configurado para publicação estática com suporte a SPA e cache otimizado.
3. Clique em **Deploy** — sua aplicação estará online com certificado HTTPS gratuito e performance instantânea.

---

## 🛠️ Principais Recursos

- **📐 CAD Elétrico 2D Realista**:
  - Componentes gráficos de alta fidelidade: Disjuntores DIN (1P, 2P, 3P), IDR (2P e 4P), DPS Classe II, Barramentos de Cobre (Neutro e Terra), Padrão de Entrada com relógio de medição, Interruptores 4x2 (Simples, Duplo de 2 Teclas, Three-Way Paralelo e Four-Way Intermediário), Tomadas 10A e 20A (NBR 14136), Plafon LED, Chuveiro Elétrico, Motor/Bomba e Ventilador de Teto.
  - Terminais normatizados com parafusos metálicos e encaixe magnético (*snap-to-terminal*).
  - Condutores ortogonais com curvas de 90° e codificação por cores e bitolas NBR 5410 (Fase, Neutro, Terra, Retornos e Paralelos).

- **🚨 Detector Físico de Curto-Circuito & Segurança**:
  - Análise topológica de nós por grafos (BFS).
  - Alerta sonoro e visual instantâneo se Fase tocar Neutro ou Terra sem carga intermediária.
  - Corte automático da simulação com condutores em curto piscando em vermelho vivo.

- **🔥 Dimensionamento de Condutores & Sobrecarga Térmica (NBR 5410)**:
  - Edição de potência (Watts) nas cargas (Lâmpadas, Chuveiro, Motor, Tomadas).
  - Cálculo automático de corrente: $I = \frac{P}{V}$ para 127V ou 220V.
  - Indicação da bitola mínima necessária (1,5 mm² a 16 mm²) e disjuntor de curva C recomendado.
  - Alerta térmico com cabo pulsando em laranja se a bitola for insuficiente para a corrente consumida.

- **💡💡 Interruptor Duplo 4x2**:
  - Duas teclas basculantes independentes com status luminoso e circuito pronto de exemplo (*2 Lâmpadas*).

- **📱 Otimizado para Celulares & Tablets**:
  - Barra de navegação inferior com gavetas deslizantes (*Drawers*).
  - Navegação suave com **1 dedo** (Pan) e **2 dedos** (Pinch-to-zoom).

- **📁 Gerenciador de Projetos Salvos (`localStorage`)**:
  - Salve e carregue múltiplos circuitos diretamente na memória do navegador.
  - Auto-Save contínuo em segundo plano.

- **📟 Multímetro Digital True RMS & Ferramentas**:
  - Pontas de prova virtuais (COM e V/Ω) para medir Tensão VAC, Continuidade (BIP) e Corrente Total.
  - Exportação de esquemas para **PNG**, **SVG** vetorial e Lista Quantitativa de Materiais (**BOM em CSV**).

---

## 💻 Como Rodar Localmente

O projeto é 100% autônomo (HTML5, Vanilla CSS3 e Vanilla JS), **sem necessidade de Node.js, compilação ou instalação de pacotes**:

Basta abrir o arquivo `index.html` diretamente em qualquer navegador moderno (Chrome, Edge, Safari, Firefox) ou usar uma extensão de servidor local (ex: *Live Server* do VS Code).

---

## 📜 Licença

Distribuído sob a licença MIT. Sinta-se à vontade para utilizar, modificar e contribuir!
