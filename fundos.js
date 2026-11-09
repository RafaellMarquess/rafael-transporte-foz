/* ==========================================================================
   fundos.js — lista de fundos animados e funções para montá-los
   (usado pelo site e pelo painel; os estilos visuais estão em fundos.css)
   ========================================================================== */

const FUNDOS = [
  { id: 'particulas', nome: 'Partículas' },
  { id: 'aurora', nome: 'Aurora' },
  { id: 'ondas', nome: 'Ondas' },
  { id: 'gradiente', nome: 'Gradiente' },
  { id: 'estrelas', nome: 'Estrelas' },
  { id: 'bolhas', nome: 'Bolhas' },
  { id: 'cataratas', nome: 'Cachoeira' },
  { id: 'grade', nome: 'Retrô' },
  { id: 'pordosol', nome: 'Pôr do sol' },
  { id: 'raios', nome: 'Holofotes' },
  { id: 'pulso', nome: 'Radar' },
  { id: 'liso', nome: 'Liso' },
  { id: 'neblina', nome: 'Neblina' },
  { id: 'lumes', nome: 'Vaga-lumes' },
  { id: 'brasas', nome: 'Brasas' },
  { id: 'neve', nome: 'Neve' },
  { id: 'chuva', nome: 'Chuva' },
  { id: 'galaxia', nome: 'Galáxia' },
  { id: 'lava', nome: 'Lava' },
  { id: 'bokeh', nome: 'Bokeh' },
  { id: 'montanhas', nome: 'Montanhas' },
  { id: 'cometas', nome: 'Cometas' },
  { id: 'faixas', nome: 'Faixas' },
  { id: 'xadrez', nome: 'Xadrez' },
  { id: 'pontos', nome: 'Pontilhado' },
  { id: 'luar', nome: 'Luar' }
];

/* Quantos estilos aparecem no painel antes de tocar em "Ver mais fundos" */
const FUNDOS_VISIVEIS = 6;

/* cor1/cor2: usadas nas partículas interativas; "cor" é a bolinha mostrada no painel */
const PALETAS = [
  { id: 'azul', nome: 'Azul', cor: '#2563eb', cor2: '#38bdf8' },
  { id: 'verde', nome: 'Verde', cor: '#10b981', cor2: '#34d399' },
  { id: 'laranja', nome: 'Laranja', cor: '#f97316', cor2: '#fb923c' },
  { id: 'roxo', nome: 'Roxo', cor: '#7c3aed', cor2: '#a78bfa' },
  { id: 'rosa', nome: 'Rosa', cor: '#ec4899', cor2: '#f472b6' },
  { id: 'ciano', nome: 'Ciano', cor: '#06b6d4', cor2: '#22d3ee' }
];

const FUNDO_PADRAO = { estilo: 'particulas', paleta: 'azul' };

function fundoValido(cfg) {
  const c = cfg && typeof cfg === 'object' ? cfg : {};
  return {
    estilo: FUNDOS.some((f) => f.id === c.estilo) ? c.estilo : FUNDO_PADRAO.estilo,
    paleta: PALETAS.some((p) => p.id === c.paleta) ? c.paleta : FUNDO_PADRAO.paleta
  };
}

/* Números "aleatórios" sempre iguais (o fundo não muda de cara a cada visita) */
function gerador(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function criarFilhos(el, quantidade, classe, estiloDe) {
  for (let i = 0; i < quantidade; i++) {
    const s = document.createElement('span');
    s.className = classe;
    s.style.cssText = estiloDe(i);
    el.appendChild(s);
  }
}

/* Monta o fundo (estilo + cor) dentro de um elemento */
function montarFundo(el, estilo, paleta) {
  const v = fundoValido({ estilo, paleta });
  const r = gerador(7);
  const n = (x, d = 2) => Number(x.toFixed(d));

  el.className = `fundo f-${v.estilo} paleta-${v.paleta}`;
  el.innerHTML = '';

  const estrelas = (qtd) => criarFilhos(el, qtd, 'estrela', () =>
    `left:${n(r() * 100)}%;top:${n(r() * 100)}%;--t:${n(1 + r() * 2.2)};--d:${n(2 + r() * 4)}s;--a:-${n(r() * 6)}s`);

  const CONSTROI = {
    estrelas: () => estrelas(32),
    bolhas: () => criarFilhos(el, 14, 'bolha', () =>
      `left:${n(r() * 94)}%;--y:${n(r() * 100)}%;--t:${n(12 + r() * 36)};--d:${n(10 + r() * 10)}s;--a:-${n(r() * 16)}s`),
    cataratas: () => criarFilhos(el, 24, 'fio', () =>
      `left:${n(r() * 100)}%;--t:${n(1 + r() * 2.5)};--d:${n(3 + r() * 4)}s;--a:-${n(r() * 7)}s`),
    ondas: () => criarFilhos(el, 3, 'onda', () => ''),
    pulso: () => criarFilhos(el, 4, 'anel', (i) => `--i:${i}`),
    lumes: () => criarFilhos(el, 20, 'lume', () =>
      `left:${n(r() * 96)}%;top:${n(20 + r() * 76)}%;--t:${n(2 + r() * 3)};--dx:${n(-30 + r() * 60, 0)};--d:${n(6 + r() * 8)}s;--a:-${n(r() * 12)}s`),
    brasas: () => criarFilhos(el, 26, 'brasa', () =>
      `left:${n(r() * 98)}%;--t:${n(1.5 + r() * 2.5)};--dx:${n(-24 + r() * 48, 0)};--d:${n(5 + r() * 7)}s;--a:-${n(r() * 12)}s`),
    neve: () => criarFilhos(el, 42, 'floco', () =>
      `left:${n(r() * 98)}%;--t:${n(1.5 + r() * 3)};--dx:${n(-18 + r() * 36, 0)};--d:${n(7 + r() * 9)}s;--a:-${n(r() * 16)}s`),
    chuva: () => criarFilhos(el, 40, 'pingo', () =>
      `left:${n(r() * 104 - 2)}%;--t:${n(10 + r() * 14)};--d:${n(0.8 + r() * 0.9)}s;--a:-${n(r() * 2)}s`),
    lava: () => criarFilhos(el, 6, 'blob', () =>
      `left:${n(r() * 80 - 5)}%;--t:${n(34 + r() * 30, 0)};--d:${n(12 + r() * 12)}s;--a:-${n(r() * 14)}s`),
    bokeh: () => criarFilhos(el, 14, 'bk', () =>
      `left:${n(r() * 92)}%;top:${n(r() * 88)}%;--t:${n(34 + r() * 80, 0)};--dx:${n(-30 + r() * 60, 0)};--d:${n(8 + r() * 10)}s;--a:-${n(r() * 12)}s`),
    montanhas: () => criarFilhos(el, 3, 'serra', (i) => `--i:${i}`),
    cometas: () => { estrelas(22); criarFilhos(el, 5, 'cometa', () =>
      `left:${n(r() * 60 - 10)}%;top:${n(r() * 45)}%;--d:${n(5 + r() * 5)}s;--a:-${n(r() * 10)}s`); },
    luar: () => estrelas(26)
  };
  if (CONSTROI[v.estilo]) CONSTROI[v.estilo]();
  // película escura por cima de tudo (a força de cada estilo fica em fundos.css)
  const veu = document.createElement('span');
  veu.className = 'veu';
  el.appendChild(veu);
  return v;
}

function trocarPaleta(el, paleta) {
  PALETAS.forEach((p) => el.classList.remove('paleta-' + p.id));
  el.classList.add('paleta-' + paleta);
}


/* ==========================================================================
   SÓ NO SITE: aplica o fundo escolhido no painel
   ========================================================================== */
let FUNDO_ATUAL = null;

function destruirParticulas() {
  try {
    if (window.pJSDom && window.pJSDom.length) {
      window.pJSDom[0].pJS.fn.vendors.destroypJS();
      window.pJSDom = [];
    }
  } catch (e) { /* já estava desligado */ }
}

function iniciarParticulas(paleta) {
  if (typeof particlesJS !== 'function') return;
  const p = PALETAS.find((x) => x.id === paleta) || PALETAS[0];
  destruirParticulas();
  particlesJS('particles-js', {
    particles: {
      number: { value: 60, density: { enable: true, value_area: 800 } },
      color: { value: [p.cor, p.cor2, '#ffffff'] },
      shape: { type: ['circle', 'triangle', 'edge'] },
      opacity: { value: 0.6, random: true },
      size: { value: 4, random: true },
      line_linked: { enable: false },
      move: { enable: true, speed: 1.5, direction: 'bottom', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'bubble' }, onclick: { enable: true, mode: 'push' } }
    },
    retina_detect: true
  });
}

function aplicarFundoSite(cfg) {
  const caixa = document.getElementById('fundoAnimado');
  const particulas = document.getElementById('particles-js');
  if (!caixa || !particulas) return;

  const v = fundoValido(cfg);
  if (FUNDO_ATUAL && FUNDO_ATUAL.estilo === v.estilo && FUNDO_ATUAL.paleta === v.paleta) return;
  FUNDO_ATUAL = v;

  if (v.estilo === 'particulas') {
    caixa.style.display = 'none';
    caixa.innerHTML = '';
    particulas.style.display = 'block';
    iniciarParticulas(v.paleta);
  } else {
    destruirParticulas();
    particulas.style.display = 'none';
    caixa.style.display = 'block';
    montarFundo(caixa, v.estilo, v.paleta);
  }

  try { localStorage.setItem('fundo', JSON.stringify(v)); } catch (e) { /* ok */ }
}

/* Ao abrir o site: usa o último fundo visto (sem piscar); senão o padrão do site-config.js */
function iniciarFundoSite() {
  if (!document.getElementById('fundoAnimado')) return;
  let inicial = null;
  try { inicial = JSON.parse(localStorage.getItem('fundo')); } catch (e) { /* sem cache */ }
  if (!inicial && typeof SITE_CONFIG !== 'undefined') inicial = SITE_CONFIG.fundoPadrao;
  aplicarFundoSite(inicial);
}

document.addEventListener('DOMContentLoaded', iniciarFundoSite);
