/* ==========================================================================
   js.js — CÓDIGO COMPLETO INTEGRADO COM O SUPABASE
   ========================================================================== */

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ==========================================================================
   LEITURA DOS DADOS DO PAINEL (site_data) — cliente único do Supabase
   ========================================================================== */
let clienteSupabaseSite = null;

function consultarSiteData(id) {
  if (!clienteSupabaseSite) clienteSupabaseSite = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return clienteSupabaseSite.from('site_data').select('content').eq('id', id).maybeSingle();
}

/* Escapa texto vindo do banco antes de colocar no HTML (evita injeção de código) */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Deixa uma URL segura para usar dentro de url('...') */
function urlCss(u) {
  return String(u == null ? '' : u).replace(/['"()\\\s<>]/g, (c) => encodeURIComponent(c));
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


/* PERFIL: motorista, veículo, contato (editável no painel, aba Perfil) */
const PERFIL_PADRAO = {
  nome: 'Nome do Motorista',
  subtitulo: 'Motorista Particular & Transfers Profissionais',
  modelo: 'Modelo do carro',
  capacidade: 4,
  base: 'Cidade e região de atendimento',
  seguranca: 'Veículo Higienizado & Revisado',
  whatsapp: '5545999999999',
  fotoMotorista: 'fotos/placeholder-motorista.svg',
  fotoVeiculo: 'fotos/placeholder-carro.svg',
  ...((typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.perfilPadrao) || {})
};

let PERFIL = { ...PERFIL_PADRAO };

function aplicarPerfilNoSite() {
  const set = (id, texto) => {
    const el = document.getElementById(id);
    if (el && texto) el.textContent = texto;
  };

  set('driverName', PERFIL.nome);
  set('driverSubtitle', PERFIL.subtitulo);
  set('capacidadeTitulo', t(PERFIL.capacidade === 1 ? 'ate1' : 'ateN', { n: PERFIL.capacidade }));

  document.title = t('titulo', { nome: PERFIL.nome });

  const rodape = document.getElementById('footerCopy');
  if (rodape) rodape.textContent = `© ${new Date().getFullYear()} ${PERFIL.nome} • ${tx(PERFIL.base)}`;

  // Botão principal do topo
  const primeiroNome = PERFIL.nome.split(' ')[0];
  const topo = document.getElementById('btnWhatsappTopo');
  if (topo) {
    const texto = t('msgTopo', { nome: primeiroNome });
    topo.href = `https://wa.me/${PERFIL.whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  // Passageiros: de 1 até a capacidade do carro
  const sel = document.getElementById('passengers');
  if (sel) {
    const atual = parseInt(sel.value, 10) || 1;
    sel.innerHTML = '';
    for (let i = 1; i <= PERFIL.capacidade; i++) {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = i === 1 ? t('pax1') : t('paxN', { n: i });
      sel.appendChild(o);
    }
    sel.value = String(Math.min(atual, PERFIL.capacidade));
  }

  // Recalcula o link do WhatsApp da calculadora com o número novo
  const rota = document.getElementById('routeSelect');
  if (rota) rota.dispatchEvent(new Event('change'));
}

async function carregarPerfil() {
  try {
    const { data } = await consultarSiteData('perfil');
    const c = data && data.content;
    if (c && typeof c === 'object') {
      Object.keys(PERFIL_PADRAO).forEach((k) => {
        if (c[k] !== undefined && c[k] !== null && String(c[k]).trim() !== '') PERFIL[k] = c[k];
      });
      PERFIL.whatsapp = String(PERFIL.whatsapp).replace(/\D/g, '') || PERFIL_PADRAO.whatsapp;
      PERFIL.capacidade = Math.min(8, Math.max(1, parseInt(PERFIL.capacidade, 10) || 4));
    }
  } catch (e) {
    console.warn('Erro ao carregar perfil:', e);
  }
  aplicarPerfilNoSite();
}

/* AGENDA: aberta/fechada + datas bloqueadas */
let DISP = { aberto: true, mensagem: '', datas: [] };

function agendaBloqueada() {
  if (!DISP.aberto) return DISP.mensagem || 'Agenda fechada no momento. Volte em breve!';
  const dataEl = document.getElementById('tripDate');
  if (dataEl && dataEl.value && DISP.datas.includes(dataEl.value)) {
    return 'Não estou disponível nesta data. Escolha outro dia, por favor.';
  }
  return '';
}

function validarAgenda() {
  const btn = document.getElementById('btnSendQuote');
  const aviso = document.getElementById('avisoAgenda');
  if (!btn || !aviso) return;
  const motivo = agendaBloqueada();
  aviso.textContent = motivo;
  aviso.style.display = motivo ? 'block' : 'none';
  btn.classList.toggle('desabilitado', !!motivo);
  btn.setAttribute('aria-disabled', motivo ? 'true' : 'false');
}

function aplicarDisponibilidadeNoSite() {
  const badge = document.getElementById('badgeStatus');
  const texto = document.getElementById('badgeStatusTexto');
  if (badge && texto) {
    const hojeFechado = DISP.datas.includes(hojeISO());
    badge.classList.remove('fechada');
    if (!DISP.aberto) {
      texto.textContent = 'Agenda fechada no momento';
      badge.classList.add('fechada');
    } else if (hojeFechado) {
      texto.textContent = 'Indisponível hoje';
      badge.classList.add('fechada');
    } else {
      texto.textContent = 'Disponível para Agendamentos';
    }
  }
  validarAgenda();
}

async function carregarDisponibilidade() {
  try {
    const { data } = await consultarSiteData('disponibilidade');
    const c = data && data.content;
    if (c) {
      DISP = {
        aberto: c.aberto !== false,
        mensagem: c.mensagem || '',
        datas: Array.isArray(c.datas) ? c.datas : []
      };
    }
  } catch (e) {
    console.warn('Erro ao carregar agenda:', e);
  }
  aplicarDisponibilidadeNoSite();
}

/* PEDIDOS: registra a solicitação quando o cliente toca em "Agendar" */
let ultimoEnvioPedido = { chave: '', t: 0 };

function enviarPedido(corpo) {
  return fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Prefer: 'return=minimal' },
    body: JSON.stringify(corpo)
  });
}

function registrarPedido(p) {
  if (!p) return;
  const pedido = { ...p, idioma: IDIOMA };
  const chave = JSON.stringify(pedido);
  const agora = Date.now();
  if (chave === ultimoEnvioPedido.chave && agora - ultimoEnvioPedido.t < 30000) return;
  ultimoEnvioPedido = { chave, t: agora };
  try {
    enviarPedido(pedido)
      .then(async (resp) => {
        if (resp.ok) return;
        // Banco ainda sem a coluna "idioma" (SQL de atualização não rodado): registra sem ela
        let erro = {};
        try { erro = await resp.clone().json(); } catch (e) { /* sem corpo */ }
        if (erro && (erro.code === 'PGRST204' || /idioma/i.test(String(erro.message || '')))) {
          const { idioma, ...semIdioma } = pedido;
          await enviarPedido(semIdioma);
        }
      })
      .catch(() => {});
  } catch (e) { /* o WhatsApp continua funcionando mesmo se o registro falhar */ }
}

/* FUNDO ANIMADO: estilo e cor escolhidos no painel (site_data, id = 'tema') */
async function carregarFundo() {
  try {
    const { data } = await consultarSiteData('tema');
    const c = data && data.content;
    if (c && c.estilo && typeof aplicarFundoSite === 'function') aplicarFundoSite(c);
  } catch (e) {
    console.warn('Erro ao carregar fundo:', e);
  }
}

/* DISQUS: configurado em site-config.js; sem shortname a seção fica escondida */
function carregarDisqus() {
  const secao = document.getElementById('secaoComentarios');
  const shortname = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.disqusShortname) || '';
  if (!secao || !shortname) return;

  secao.style.display = 'block';
  const url = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.siteUrl) || location.href;

  window.disqus_config = function () {
    this.page.url = url;
    this.page.identifier = shortname + '-home';
  };

  const s = document.createElement('script');
  s.src = `https://${shortname}.disqus.com/embed.js`;
  s.setAttribute('data-timestamp', +new Date());
  document.head.appendChild(s);
}

/* DEPOIMENTOS editáveis pelo painel (aba Conteúdo) */
async function carregarDepoimentos() {
  const cont = document.getElementById('depoimentosLista');
  if (!cont) return;

  let lista = [];
  try {
    const { data } = await consultarSiteData('depoimentos');
    const c = data && data.content;
    if (Array.isArray(c)) lista = c.filter((i) => i && i.texto);
  } catch (e) {
    console.warn('Erro ao carregar depoimentos:', e);
  }

  cont.innerHTML = '';

  if (!lista.length) {
    const vazio = document.createElement('div');
    vazio.className = 'gallery-empty';
    vazio.style.gridColumn = 'auto';
    vazio.textContent = 'Em breve, avaliações dos nossos passageiros.';
    cont.appendChild(vazio);
    return;
  }

  lista.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'testimonial-card';

    const estrelas = document.createElement('div');
    estrelas.className = 'stars';
    estrelas.textContent = '★★★★★';

    const p = document.createElement('p');
    p.textContent = '“' + item.texto + '”';

    card.append(estrelas, p);

    if (item.autor) {
      const autor = document.createElement('span');
      autor.className = 'testimonial-author';
      autor.textContent = '— ' + item.autor;
      card.appendChild(autor);
    }
    cont.appendChild(card);
  });
}

/* FAQ editável pelo painel */
async function carregarFaq() {
  const cont = document.getElementById('faqLista');
  if (!cont) return;
  try {
    const { data } = await consultarSiteData('faq');
    const lista = data && data.content;
    if (!Array.isArray(lista) || !lista.length) return;

    cont.innerHTML = '';
    lista.forEach((item) => {
      if (!item.pergunta || !item.resposta) return;
      const d = document.createElement('details');
      const s = document.createElement('summary');
      const p = document.createElement('p');
      s.textContent = item.pergunta;
      p.textContent = item.resposta;
      d.append(s, p);
      cont.appendChild(d);
    });
    iniciarFaqSuave();
  } catch (e) {
    console.warn('Erro ao carregar FAQ:', e);
  }
}

/* 01. MODAL DO MOTORISTA */
function abrirModal() {
  Swal.fire({
    showClass: { popup: 'popup-entrada' },
    hideClass: { popup: 'popup-saida' },
    title: 'Identificação do Motorista',
    background: '#151921',
    color: '#ffffff',
    width: '440px',
    showCloseButton: true,
    showConfirmButton: false,
    customClass: { popup: 'driver-swal-popup' },
    html: `
      <div class="modal-photos">
        <div class="photo-card">
          <img src="${esc(PERFIL.fotoMotorista)}" alt="${esc(PERFIL.nome)}" class="clickable-photo" onclick="abrirFoto(this)">
          <span>Motorista</span>
        </div>
        <div class="photo-card">
          <img src="${esc(PERFIL.fotoVeiculo)}" alt="${esc(PERFIL.modelo)}" class="clickable-photo" onclick="abrirFoto(this)">
          <span>${esc(PERFIL.modelo)}</span>
        </div>
      </div>
      <div class="info-list">
        <div class="info-item">
          <i class="fa-solid fa-user-check"></i>
          <div><strong>Motorista Responsável</strong><span>${esc(PERFIL.nome)}</span></div>
        </div>
        <div class="info-item">
          <i class="fa-solid fa-car"></i>
          <div><strong>Veículo Oficial</strong><span>${esc(PERFIL.modelo)}</span></div>
        </div>
        <div class="info-item">
          <i class="fa-solid fa-shield-virus"></i>
          <div><strong>Status de Segurança</strong><span>${esc(PERFIL.seguranca)}</span></div>
        </div>
        <div class="info-item">
          <i class="fa-solid fa-location-dot"></i>
          <div><strong>Base de Atendimento</strong><span>${esc(PERFIL.base)}</span></div>
        </div>
      </div>
    `
  });
}

function fecharModal() { Swal.close(); }

/* 01a. LUPA DE PESQUISA FUNCIONAL */
function abrirPesquisa() {
  abrirModalBusca();
}

/* 02. LIGHTBOX / FOTOS */
let lightbox = { fotos: null, i: 0 };

function abrirFoto(foto) {
  lightbox.fotos = null;
  mostrarNoModal(foto.src);
}

function abrirFotoGaleria(indice) {
  lightbox.fotos = todasAsFotosGlobais;
  lightbox.i = indice;
  mostrarNoModal(todasAsFotosGlobais[indice].src);
}

function mostrarNoModal(src, direcao) {
  const modal = document.getElementById('photoModal');
  const imagem = document.getElementById('photoModalImage');
  if (!modal || !imagem) return;

  imagem.src = src;
  modal.classList.add('active');
  atualizarControlesLightbox();
}

function navegarFoto(passo) {
  if (!lightbox.fotos || lightbox.fotos.length < 2) return;
  const total = lightbox.fotos.length;
  lightbox.i = (lightbox.i + passo + total) % total;
  mostrarNoModal(lightbox.fotos[lightbox.i].src);
}

function atualizarControlesLightbox() {
  const tem = !!(lightbox.fotos && lightbox.fotos.length > 1);
  document.querySelectorAll('.photo-nav').forEach((b) => { b.style.display = tem ? 'flex' : 'none'; });
  const contador = document.getElementById('photoCounter');
  if (contador) {
    contador.style.display = tem ? 'block' : 'none';
    if (tem) contador.textContent = `${lightbox.i + 1} / ${lightbox.fotos.length}`;
  }
}

function criarControlesLightbox() {
  const modal = document.getElementById('photoModal');
  if (!modal) return;
  const criar = (classe, rotulo, html, passo) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `photo-nav ${classe}`;
    b.setAttribute('aria-label', rotulo);
    b.innerHTML = html;
    b.addEventListener('click', (e) => { e.stopPropagation(); navegarFoto(passo); });
    modal.appendChild(b);
  };
  criar('photo-prev', 'Anterior', '<i class="fa-solid fa-chevron-left"></i>', -1);
  criar('photo-next', 'Próxima', '<i class="fa-solid fa-chevron-right"></i>', 1);

  const contador = document.createElement('div');
  contador.id = 'photoCounter';
  contador.className = 'photo-counter';
  modal.appendChild(contador);
}

function fecharFoto() {
  const modal = document.getElementById('photoModal');
  if (modal) modal.classList.remove('active');
}

/* 03. SELEÇÃO DE ROTA */
function selecionarRota(valor) {
  const rota = document.getElementById('routeSelect');
  if (rota) {
    rota.value = valor;
    rota.dispatchEvent(new Event('change'));
    rota.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* 04. VERIFICAR DESTINO (Fronteira) */
function verificarDestino() {
  const select = document.getElementById('routeSelect');
  const alerta = document.getElementById('alertaInternacional');
  if (!select || !alerta) return;
  const opcao = select.options[select.selectedIndex];
  const textoOpcao = opcao ? (opcao.dataset.pt || opcao.text).toLowerCase() : '';
  const internacional = ['argentina', 'paraguai', 'puerto', 'ciudad', 'compras', 'feirinha']
    .some((palavra) => textoOpcao.includes(palavra));
  alerta.style.display = internacional ? 'block' : 'none';
}

/* 05a. PREÇO ANIMADO */
let precoAtual = null;
let quadroPreco = null;

function atualizarPreco(el, novo, formatar) {
  if (precoAtual === null || reduzirMovimento) {
    el.textContent = formatar(novo);
    precoAtual = novo;
    return;
  }
  if (novo === precoAtual) return;
  const de = precoAtual;
  precoAtual = novo;
  cancelAnimationFrame(quadroPreco);

  el.classList.remove('preco-pop');
  void el.offsetWidth;
  el.classList.add('preco-pop');

  const inicio = performance.now();
  const duracao = 450;

  const passo = (agora) => {
    const t = Math.min(1, (agora - inicio) / duracao);
    const suave = 1 - Math.pow(1 - t, 3);
    el.textContent = formatar(t < 1 ? de + (novo - de) * suave : novo);
    if (t < 1) quadroPreco = requestAnimationFrame(passo);
  };
  quadroPreco = requestAnimationFrame(passo);
}

/* 05. CALCULADORA */
function iniciarCalculadora() {
  const routeSelect = document.getElementById('routeSelect');
  const tripType = document.getElementById('tripType');
  const estimatedPrice = document.getElementById('estimatedPrice');
  const btnSendQuote = document.getElementById('btnSendQuote');
  const tripDate = document.getElementById('tripDate');
  const tripTime = document.getElementById('tripTime');
  const passengers = document.getElementById('passengers');
  const pickupLocation = document.getElementById('pickupLocation');

  if (!routeSelect || !tripType || !estimatedPrice || !btnSendQuote) return;

  if (tripDate) {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    tripDate.min = `${hoje.getFullYear()}-${mes}-${dia}`;
  }

  function formatarData(valor) {
    if (!valor) return 'A combinar';
    const [ano, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarValor(numero) {
    return `R$ ${numero.toFixed(2).replace('.', ',')}`;
  }

  let ultimoPedido = null;
  const TIPOS_VIAGEM_PT = {
    1: 'Apenas Ida (Leve até o local)',
    2: 'Ida e Volta (Com Desconto - Fico aguardando o retorno)'
  };

  function calculatePrice() {
    const basePrice = Math.max(0, parseFloat(routeSelect.value) || 0);
    const finalPrice = tripType.value === '2' ? basePrice * 2 : basePrice;

    atualizarPreco(estimatedPrice, finalPrice, formatarValor);

    // A mensagem vai em português (quem lê é o motorista), mesmo que o site esteja em outro idioma.
    const opcaoRota = routeSelect.options[routeSelect.selectedIndex];
    const routeText = opcaoRota ? (opcaoRota.dataset.pt || opcaoRota.text) : '';
    const typeText = TIPOS_VIAGEM_PT[tripType.value] || '';
    const dataText = tripDate ? formatarData(tripDate.value) : 'A combinar';
    const horarioText = tripTime && tripTime.value ? tripTime.value : 'A combinar';
    const qtdPass = passengers ? parseInt(passengers.value, 10) || 1 : 1;
    const passageirosText = qtdPass === 1 ? '1 passageiro' : `${qtdPass} passageiros`;
    const embarqueText = pickupLocation && pickupLocation.value.trim() ? pickupLocation.value.trim() : 'A combinar';

    const message =
      `Olá ${PERFIL.nome.split(' ')[0]}! Gostaria de agendar:\n\n` +
      `📍 *Trajeto:* ${routeText}\n` +
      `🔄 *Tipo:* ${typeText}\n` +
      `📅 *Data:* ${dataText}\n` +
      `🕒 *Horário:* ${horarioText}\n` +
      `👥 *Passageiros:* ${passageirosText}\n` +
      `🏨 *Embarque:* ${embarqueText}\n` +
      `💲 *Valor Estimado:* ${formatarValor(finalPrice)}` +
      (IDIOMA !== 'pt' ? `\n🌐 *Idioma do cliente:* ${NOMES_IDIOMA[IDIOMA]}` : '');

    btnSendQuote.href = `https://wa.me/${PERFIL.whatsapp}?text=${encodeURIComponent(message)}`;

    ultimoPedido = {
      trajeto: routeText.slice(0, 200),
      tipo: typeText.slice(0, 120),
      data_viagem: dataText,
      horario: horarioText,
      passageiros: passageirosText,
      embarque: embarqueText.slice(0, 200),
      valor: finalPrice
    };

    verificarDestino();
    validarAgenda();
  }

  btnSendQuote.addEventListener('click', (e) => {
    if (agendaBloqueada()) {
      e.preventDefault();
      validarAgenda();
      return;
    }
    registrarPedido(ultimoPedido);
  });

  routeSelect.addEventListener('change', calculatePrice);
  tripType.addEventListener('change', calculatePrice);
  [tripDate, tripTime, passengers].forEach((campo) => { if (campo) campo.addEventListener('change', calculatePrice); });
  if (pickupLocation) pickupLocation.addEventListener('input', calculatePrice);

  calculatePrice();
}

/* 06. GALERIA SUPABASE */
const FOTOS_GALERIA = [];
const FOTOS_POR_BLOCO = 4;
let todasAsFotosGlobais = [];
let limiteAtualFotos = FOTOS_POR_BLOCO;
let fotosJaMostradas = 0;

async function buscarFotosGaleria() {
  try {
    const resposta = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ prefix: '', limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
    });
    if (!resposta.ok) throw new Error('Falha ao listar fotos');
    const itens = await resposta.json();
    const fotos = itens.filter((o) => o.name && o.id && !o.name.startsWith('.') && !o.name.startsWith('destino_') && !o.name.startsWith('perfil_')).map((o) => ({
      src: urlPublicaFoto(o.name),
      legenda: nomeParaLegenda(o.name)
    }));
    return fotos.length ? fotos : FOTOS_GALERIA;
  } catch (erro) {
    return FOTOS_GALERIA;
  }
}

async function carregarGaleria() {
  const grade = document.getElementById('galleryGrid');
  if (!grade) return;
  if (todasAsFotosGlobais.length === 0) {
    try { todasAsFotosGlobais = await buscarFotosGaleria(); } catch (e) { todasAsFotosGlobais = []; }
  }
  grade.innerHTML = '';
  if (!todasAsFotosGlobais.length) {
    grade.innerHTML = '<div class="gallery-empty">Em breve, novas fotos por aqui.</div>';
    removerBotaoCarregarMais();
    return;
  }

  todasAsFotosGlobais.slice(0, limiteAtualFotos).forEach((foto, idx) => {
    const item = document.createElement('figure');
    item.className = 'gallery-item carregando';
    if (!reduzirMovimento && idx >= fotosJaMostradas) {
      item.style.setProperty('--i', idx - fotosJaMostradas);
      item.classList.add('entrando');
    }

    const img = document.createElement('img');
    img.alt = foto.legenda || 'Foto da galeria';
    img.loading = 'lazy';
    const terminou = () => item.classList.remove('carregando');
    img.addEventListener('load', terminou);
    img.addEventListener('error', terminou);
    img.src = foto.src;

    item.addEventListener('click', () => abrirFotoGaleria(idx));
    item.appendChild(img);

    if (foto.legenda) {
      const legenda = document.createElement('figcaption');
      legenda.textContent = foto.legenda;
      item.appendChild(legenda);
    }
    grade.appendChild(item);
  });

  fotosJaMostradas = Math.min(limiteAtualFotos, todasAsFotosGlobais.length);
  controlarBotaoCarregarMais();
}

function carregarMaisFotos() {
  limiteAtualFotos += FOTOS_POR_BLOCO;
  carregarGaleria();
}

function controlarBotaoCarregarMais() {
  let btn = document.getElementById('btnCarregarMais');
  if (!btn) {
    const grade = document.getElementById('galleryGrid');
    if (!grade) return;
    const container = document.createElement('div');
    container.id = 'containerBtnCarregarMais';
    container.innerHTML = `
      <button id="btnCarregarMais" class="btn-whatsapp" style="margin: 0 auto; width: auto; padding: 12px 24px; cursor: pointer;" onclick="carregarMaisFotos()">
        <i class="fa-solid fa-plus"></i> Ver mais fotos
      </button>
    `;
    grade.parentNode.insertBefore(container, grade.nextSibling);
    btn = document.getElementById('btnCarregarMais');
  }
  btn.style.display = limiteAtualFotos < todasAsFotosGlobais.length ? 'inline-flex' : 'none';
}

function removerBotaoCarregarMais() {
  const container = document.getElementById('containerBtnCarregarMais');
  if (container) container.remove();
}

/* 07. BARRA DE NAVEGAÇÃO DE VIDRO */
function iniciarBarraNavegacao() {
  const itens = Array.from(document.querySelectorAll('.nav-item'));
  if (!itens.length) return;
  const secoes = itens.map((item) => document.getElementById(item.dataset.target)).filter(Boolean);

  const nav = document.getElementById('glassNav');
  const pilula = document.createElement('span');
  pilula.className = 'nav-pill';
  nav.insertBefore(pilula, nav.firstChild);

  function moverPilula() {
    const ativo = itens.find((i) => i.classList.contains('active'));
    if (!ativo) return;
    pilula.style.width = ativo.offsetWidth + 'px';
    pilula.style.transform = `translateX(${ativo.offsetLeft}px)`;
  }

  let forcado = null;
  let timerForcado = null;
  function soltarForcado(ms) {
    clearTimeout(timerForcado);
    timerForcado = setTimeout(() => { forcado = null; marcarAtivo(); }, ms);
  }

  itens.forEach((item) => {
    item.addEventListener('click', () => {
      if (item.getAttribute('onclick')?.includes('abrirPesquisa') || item.getAttribute('onclick')?.includes('abrirModalBusca')) return;
      forcado = item.dataset.target;
      nav.classList.remove('escondida');
      marcarAtivo();
      soltarForcado(900);
    });
  });

  let ancora = window.scrollY;
  function controlarVisibilidade() {
    const y = window.scrollY;
    const noTopo = y < 80;
    const noFim = window.innerHeight + y >= document.body.scrollHeight - 80;

    if (reduzirMovimento || forcado || noTopo || noFim) {
      nav.classList.remove('escondida');
      ancora = y;
    } else if (y > ancora + 10) {
      nav.classList.add('escondida');
      ancora = y;
    } else if (y < ancora - 10) {
      nav.classList.remove('escondida');
      ancora = y;
    }
  }

  function marcarAtivo() {
    const linha = Math.min(window.innerHeight * 0.25, 160);
    let atual = secoes[0];
    secoes.forEach((secao) => {
      if (secao.getBoundingClientRect().top <= linha) { atual = secao; }
    });

    const ultima = secoes[secoes.length - 1];
    const fim = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
    if (fim && ultima.getBoundingClientRect().top < window.innerHeight * 0.6) { atual = ultima; }

    const alvoId = forcado || (atual ? atual.id : null);
    itens.forEach((item) => {
      if (item.dataset.target) {
        item.classList.toggle('active', item.dataset.target === alvoId);
      }
    });
    moverPilula();
  }

  window.addEventListener('scroll', () => {
    if (forcado) soltarForcado(200);
    marcarAtivo();
    controlarVisibilidade();
  }, { passive: true });
  window.addEventListener('resize', marcarAtivo);
  marcarAtivo();

  requestAnimationFrame(() => requestAnimationFrame(() => pilula.classList.add('pronto')));
  window.addEventListener('load', moverPilula);
}

/* 08. PAINEL ADMIN SECRETO */
function iniciarAcessoSecreto() {
  const alvo = document.getElementById('footerCopy');
  if (!alvo) return;
  let toques = 0;
  let timer = null;
  alvo.addEventListener('click', () => {
    toques++;
    clearTimeout(timer);
    timer = setTimeout(() => { toques = 0; }, 2000);
    if (toques >= 5) {
      toques = 0;
      window.location.href = 'admin.html';
    }
  });
}

/* 09. ATALHOS DE TECLADO */
function iniciarAtalhos() {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { fecharFoto(); fecharModal(); fecharModalBusca(); fecharDetalheTuristico(); }
    if (event.key === 'ArrowRight') navegarFoto(1);
    if (event.key === 'ArrowLeft') navegarFoto(-1);
  });
}

/* 09a. REVELAR AO ROLAR */
function iniciarRevelarAoRolar() {
  if (reduzirMovimento || !('IntersectionObserver' in window)) return;
  const alvos = document.querySelectorAll(
    '.btn-driver-info, .section-header, .compact-card, .calculator-card, ' +
    '.feature-card, .faq-container details, .testimonial-card, #avaliacoes .section-title'
  );
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const el = entrada.target;
      observador.unobserve(el);
      el.classList.add('visivel');
      setTimeout(() => el.classList.remove('reveal', 'visivel'), 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  alvos.forEach((el) => {
    const posicao = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--d', Math.min(posicao, 5) * 80 + 'ms');
    el.classList.add('reveal');
    observador.observe(el);
  });
}

/* 09b. FAQ SUAVE */
function iniciarFaqSuave() {
  document.querySelectorAll('.faq-container details').forEach((d) => {
    const resumo = d.querySelector('summary');
    let animacao = null;
    resumo.addEventListener('click', (e) => {
      e.preventDefault();
      if (reduzirMovimento || !d.animate) {
        d.open = !d.open;
        return;
      }
      if (animacao) animacao.cancel();
      const altura = d.offsetHeight;
      const abrindo = !d.open;
      let alvo;
      if (abrindo) {
        d.style.overflow = 'hidden';
        d.open = true;
        alvo = d.offsetHeight;
      } else {
        const cs = getComputedStyle(d);
        alvo = resumo.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        d.style.overflow = 'hidden';
      }
      animacao = d.animate({ height: [altura + 'px', alvo + 'px'] }, { duration: 340, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      animacao.onfinish = () => { d.open = abrindo; d.style.overflow = ''; animacao = null; };
      animacao.oncancel = () => { d.style.overflow = ''; };
    });
  });
}

/* 09c. RIPPLE (Onda de toque) */
function iniciarRipple() {
  if (reduzirMovimento) return;
  const seletor = '.btn-whatsapp, .btn-secondary-whatsapp, .btn-driver-info, .compact-card';
  document.addEventListener('pointerdown', (e) => {
    const alvo = e.target.closest(seletor);
    if (!alvo) return;
    const r = alvo.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2;
    const onda = document.createElement('span');
    onda.className = 'ripple';
    onda.style.width = onda.style.height = d + 'px';
    onda.style.left = (e.clientX - r.left - d / 2) + 'px';
    onda.style.top = (e.clientY - r.top - d / 2) + 'px';
    alvo.appendChild(onda);
    setTimeout(() => onda.remove(), 900);
  }, { passive: true });
}

/* ==========================================================================
   BASE DE DADOS DE PONTOS TURÍSTICOS E CARREGAMENTO DO SUPABASE
   ========================================================================== */
const PONTOS_TURISTICOS_PADRAO = [
  {
    id: 'cataratas_br',
    titulo: 'Cataratas do Iguaçu (Lado Brasileiro)',
    sub: 'Parque Nacional do Iguaçu',
    preco: 130,
    foto: 'fotos/cataratas.jpeg',
    descricao: 'Explore uma das Sete Maravilhas Naturais do Mundo com toda a comodidade. Desfrute da passarela panorâmica com vista de frente para a monumental Garganta do Diabo, sem se preocupar com trânsito, estacionamento ou filas de transporte.',
    tipoServico: {
      ida: 'Transporte direto e pontual até o Centro de Visitantes do Parque Nacional.',
      idaVolta: 'Levo até a portaria e aguardo o término do seu passeio para trazê-lo de volta com total conforto e segurança.'
    }
  },
  {
    id: 'feirinha_arg',
    titulo: 'Feirinha de Puerto Iguazú & Gastronomia',
    sub: 'Gastronomia & Vinhos em 🇦🇷',
    preco: 175,
    foto: 'fotos/puerto-iguazu-fronteira-brasil-argentina-1024x768.webp',
    descricao: 'Prove as melhores picanhas, queijos e alfajores na tradicional Feirinha de Puerto Iguazú, com transporte privativo seguro e confortável.',
    tipoServico: {
      ida: 'Travessia noturna com segurança até o centro gastronômico argentino.',
      idaVolta: 'Levo para jantar ou passear na feirinha, aguardo o horário combinado e retorno com você a Foz.'
    }
  },
  {
    id: 'parque_aves',
    titulo: 'Parque das Aves',
    sub: 'Imersão na Mata Atlântica',
    preco: 130,
    foto: 'fotos/cataratas.jpeg',
    descricao: 'Um santuário espetacular localizado bem em frente às Cataratas. Vivencie uma experiência única de imersão em viveiros gigantes com tucanos, araras e centenas de espécies de aves da Mata Atlântica.',
    tipoServico: {
      ida: 'Deixo você na entrada principal do parque no horário combinado.',
      idaVolta: 'Levo até o local, aguardo o tempo da sua visita e faço o retorno com você para o hotel ou residência.'
    }
  },
  {
    id: 'itaipu',
    titulo: 'Usina Hidrelétrica de Itaipu',
    sub: 'Binacional Brasil / Paraguai',
    preco: 90,
    foto: 'fotos/usina-de-itaipu-foz-do-iguacu-curiosidades-scaled.jpg',
    descricao: 'Conheça uma das maiores produtoras de energia limpa e renovável do planeta. Realize a visita panorâmica ou os circuitos especiais com a praticidade de um transfer privativo.',
    tipoServico: {
      ida: 'Transporte direto até o Centro de Recepção de Visitantes da Itaipu.',
      idaVolta: 'Levo até o complexo turístico, aguardo o encerramento do tour e trago você de volta com total comodidade.'
    }
  },
  {
    id: 'templo_budista',
    titulo: 'Templo Budista Chen Yen',
    sub: 'Paz e Estátuas Gigantes',
    preco: 95,
    foto: 'fotos/usina-de-itaipu-foz-do-iguacu-curiosidades-scaled.jpg',
    descricao: 'Um refúgio de serenidade e contemplação em Foz do Iguaçu, com dezenas de estátuas douradas imponentes, uma imagem de Buda com 7 metros de altura e uma vista privilegiada da região.',
    tipoServico: {
      ida: 'Transporte confortável direto até o portão de entrada do templo.',
      idaVolta: 'Levo, aguardo a sua contemplação e fotografias pelo local, e retorno com você.'
    }
  },
  {
    id: 'marco_fronteiras',
    titulo: 'Marco das Três Fronteiras',
    sub: 'Encontro do Brasil, Argentina e Paraguai',
    preco: 85,
    foto: 'fotos/puerto-iguazu-fronteira-brasil-argentina-1024x768.webp',
    descricao: 'O ponto histórico onde as fronteiras do Brasil, Argentina e Paraguai se encontram. Desfrute de um pôr do sol inesquecível, praça de alimentação temática e apresentações culturais à noites.',
    tipoServico: {
      ida: 'Desembarque rápido e seguro na entrada do complexo cultural.',
      idaVolta: 'Levo para curtir a tarde e as atrações noturnas, aguardando o horário combinado para o regresso.'
    }
  },
  {
    id: 'museu_cera',
    titulo: 'Complexo Dreamland (Museu de Cera)',
    sub: 'Vale dos Dinossauros & Atrações',
    preco: 95,
    foto: 'fotos/cataratas.jpeg',
    descricao: 'Um excelente passeio para a família na Avenida das Cataratas, reunindo estátuas de cera em tamanho real de grandes ícones mundiais, o Vale dos Dinossauros animatrônicos e o Bar de Gelo.',
    tipoServico: {
      ida: 'Deixo você na entrada do complexo de entretenimento com total agilidade.',
      idaVolta: 'Levo até o local, aguardo a diversão da família e retorno com segurança para Foz.'
    }
  },
  {
    id: 'compras_py',
    titulo: 'Compras em Ciudad del Este (Paraguai)',
    sub: 'Eletrônicos, Perfumes & Utilidades',
    preco: 180,
    foto: 'fotos/tienda-nissei-ciudad.jpg',
    descricao: 'Vá às compras no comércio paraguaio (Nissei, CellShop, Monalisa e shoppings) com total tranquilidade. Livre-se do estresse com o trânsito da Ponte da Amizade e estacionamento.',
    tipoServico: {
      ida: 'Travessia segura e desembarque direto no centro comercial escolhido.',
      idaVolta: 'Levo ao Paraguai, fico aguardando no ponto de apoio/estacionamento com segurança para guardar as suas sacolas e trago de volta.'
    }
  }
];

let PONTOS_TURISTICOS = [...PONTOS_TURISTICOS_PADRAO];

// Função unificada que busca os dados atualizados do Supabase
async function carregarDestinosDinamicos() {
  try {
    const { data } = await consultarSiteData('destinos');

    if (data && data.content && Array.isArray(data.content) && data.content.length > 0) {
      PONTOS_TURISTICOS = data.content.map(d => ({
        id: String(d.id || ('dest_' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => (b % 36).toString(36)).join(''))).replace(/[^\w-]/g, ''),
        titulo: d.titulo,
        sub: d.sub || 'Passeio Privativo em Foz',
        preco: Math.min(100000, Math.max(0, Number(d.preco) || 0)),  // nunca negativo nem absurdo, mesmo que o banco esteja errado
        foto: d.foto || 'fotos/cataratas.jpeg',
        descricao: d.desc || d.descricao || 'Passeio turístico imperdível na região.',
        ativo: d.ativo !== false,
        destaque: d.destaque === true,
        tipoServico: d.tipoServico || {
          ida: 'Transporte privativo direto até o destino.',
          idaVolta: 'Levo até o local, aguardo o término do passeio e trago de volta.'
        }
      })).filter(p => p.ativo);
    }
  } catch (e) {
    console.warn('Erro ao carregar do Supabase:', e);
  }

  carregarDestinosPrincipais();
  atualizarSelectCalculadora();
  carregarAvisoTopo();
}

/* Aviso do topo: lido da nuvem (site_data, id = 'aviso') */
async function carregarAvisoTopo() {
  const caixa = document.getElementById('avisoTopo');
  const texto = document.getElementById('avisoTopoTexto');
  if (!caixa || !texto) return;
  try {
    const { data } = await consultarSiteData('aviso');

    const aviso = data && data.content;
    if (aviso && aviso.ativo && aviso.texto) {
      texto.textContent = aviso.texto;
      caixa.style.display = 'flex';
    } else {
      caixa.style.display = 'none';
    }
  } catch (e) {
    console.warn('Erro ao carregar aviso:', e);
  }
}

function atualizarSelectCalculadora() {
  const select = document.getElementById('routeSelect');
  if (!select) return;

  select.innerHTML = PONTOS_TURISTICOS.map(p => `
    <option value="${Number(p.preco) || 0}" data-pt="${esc(p.titulo)}">${esc(p.titulo)}</option>
  `).join('');

  select.dispatchEvent(new Event('change'));
}

function abrirModalBusca() {
  const overlay = document.getElementById('searchModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.getElementById('searchInput').focus();
    renderizarListaBusca(PONTOS_TURISTICOS);
  }
}

function fecharModalBusca() {
  const overlay = document.getElementById('searchModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function filtrarPontosTuristicos() {
  const termo = document.getElementById('searchInput').value.toLowerCase().trim();
  const filtrados = PONTOS_TURISTICOS.filter(p => 
    p.titulo.toLowerCase().includes(termo) || 
    p.sub.toLowerCase().includes(termo) || 
    p.descricao.toLowerCase().includes(termo)
  );
  renderizarListaBusca(filtrados);
}

function renderizarListaBusca(lista) {
  const container = document.getElementById('searchResultsList');
  if (!container) return;
  
  if (!lista.length) {
    container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Nenhum ponto encontrado.</div>';
    return;
  }

  container.innerHTML = lista.map(p => `
    <div class="search-result-item" onclick="selecionarPontoTuristico('${p.id}')">
      <img src="${esc(p.foto)}" alt="${esc(p.titulo)}">
      <div class="search-result-info">
        <h4>${esc(p.titulo)}</h4>
        <span><span>R$ ${p.preco.toFixed(2).replace('.', ',')}</span> • <span>${esc(p.sub)}</span></span>
      </div>
    </div>
  `).join('');
}

function selecionarPontoTuristico(id) {
  fecharModalBusca();
  const ponto = PONTOS_TURISTICOS.find(p => p.id === id);
  if (!ponto) return;

  const detailModal = document.getElementById('touristDetailModal');
  const detailContent = document.getElementById('touristDetailContent');

  detailContent.innerHTML = `
    <button class="tourist-modal-close-btn" onclick="fecharDetalheTuristico()">&times;</button>
    <div class="tourist-hero-bg" style="background-image: url('${esc(urlCss(ponto.foto))}')">
      <div class="tourist-hero-title">
        <h2>${esc(ponto.titulo)}</h2>
        <span><span>Estimativa:</span> R$ ${ponto.preco.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
    <div class="tourist-detail-body">
      <div class="tourist-section-block">
        <h4><i class="fa-solid fa-circle-info"></i> Sobre o Ponto Turístico</h4>
        <p>${esc(ponto.descricao)}</p>
      </div>

      <div class="tourist-section-block">
        <h4><i class="fa-solid fa-car-side"></i> Como Funciona o Transporte</h4>
        <p><strong>Apenas Ida:</strong> ${esc(ponto.tipoServico.ida)}</p>
        <p style="margin-top: 6px;"><strong>Ida e Volta:</strong> ${esc(ponto.tipoServico.idaVolta)}</p>
      </div>

      <button class="btn-whatsapp" style="width:100%; margin-top:10px;" onclick="agendarDiretoDaBusca('${ponto.id}')">
        <i class="fa-brands fa-whatsapp"></i> Agendar este Trajeto
      </button>
    </div>
  `;

  detailModal.classList.add('active');
}

function fecharDetalheTuristico() {
  const modal = document.getElementById('touristDetailModal');
  if (modal) modal.classList.remove('active');
}

function agendarDiretoDaBusca(id) {
  fecharDetalheTuristico();
  const select = document.getElementById('routeSelect');
  const ponto = PONTOS_TURISTICOS.find(p => p.id === id);
  if (!ponto || !select) return;
  const preco = ponto.preco;
  const nomeTrajeto = ponto.titulo;

  let encontrada = false;
  for (let i = 0; i < select.options.length; i++) {
    if ((select.options[i].dataset.pt || select.options[i].text) === nomeTrajeto) {
      select.selectedIndex = i;
      encontrada = true;
      break;
    }
  }

  if (!encontrada) {
    const opt = document.createElement('option');
    opt.value = preco;
    opt.text = tx(nomeTrajeto);
    opt.dataset.pt = nomeTrajeto;
    select.add(opt);
    select.value = preco;
  }

  select.dispatchEvent(new Event('change'));
  
  const calc = document.getElementById('calculadora');
  if (calc) {
    calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function carregarDestinosPrincipais(animarExtras) {
  const container = document.getElementById('listaDestinosPrincipal');
  if (!container) return;

  const LIMITE = 4;
  const emDestaque = PONTOS_TURISTICOS.filter((p) => p.destaque);
  const base = emDestaque.length ? emDestaque : PONTOS_TURISTICOS.slice(0, LIMITE);
  const principais = mostrarTodosDestinos ? PONTOS_TURISTICOS : base;

  container.innerHTML = principais.map((p, i) => `
    <div class="compact-card${animarExtras && i >= base.length && !reduzirMovimento ? ' destino-entra' : ''}" onclick="selecionarPontoTuristico('${p.id}')" style="cursor: pointer; --i: ${Math.max(0, i - base.length)};">
      <div class="thumb-wrapper">
        <img src="${esc(p.foto)}" loading="lazy" alt="${esc(p.titulo)}">
      </div>
      <div class="compact-info">
        <div class="compact-header">
          <h3>${esc(p.titulo)}</h3>
        </div>
        <p>${esc(p.sub)}</p>
      </div>
      <div class="compact-btn" onclick="event.stopPropagation(); selecionarPontoTuristico('${p.id}')">
        <i class="fa-solid fa-eye"></i>
        <span>Ver Detalhes</span>
      </div>
    </div>
  `).join('') + (PONTOS_TURISTICOS.length > base.length ? `
    <button type="button" class="btn-ver-todos${mostrarTodosDestinos ? ' aberto' : ''}" onclick="alternarTodosDestinos()" aria-expanded="${mostrarTodosDestinos}">
      ${mostrarTodosDestinos ? t('menos') : t('verTodos', { n: PONTOS_TURISTICOS.length })}
      <i class="fa-solid fa-chevron-down seta" aria-hidden="true"></i>
    </button>
  ` : '');
}

let mostrarTodosDestinos = false;

function alternarTodosDestinos() {
  mostrarTodosDestinos = !mostrarTodosDestinos;
  carregarDestinosPrincipais(mostrarTodosDestinos);

  // Ao recolher, volta suavemente ao topo da seção para o cliente não se perder
  if (!mostrarTodosDestinos) {
    const secao = document.querySelector('.compact-destinations-section');
    if (secao) secao.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' });
  }
}

/* IDIOMA: chamado por i18n.js depois de trocar PT/EN/ES.
   Refaz só o que tem texto com variáveis; o resto o i18n.js já traduziu. */
function aoMudarIdioma() {
  Swal.close();
  fecharDetalheTuristico();
  aplicarPerfilNoSite();
  carregarDestinosPrincipais();
  const overlay = document.getElementById('searchModalOverlay');
  if (overlay && overlay.classList.contains('active')) filtrarPontosTuristicos();
}

/* 10. INICIALIZAÇÃO DO DOM */
document.addEventListener('DOMContentLoaded', () => {
  iniciarCalculadora();
  iniciarAtalhos();
  carregarGaleria();
  iniciarBarraNavegacao();
  iniciarAcessoSecreto();
  criarControlesLightbox();
  iniciarRevelarAoRolar();
  iniciarFaqSuave();
  iniciarRipple();
  aplicarPerfilNoSite();
  carregarDisponibilidade();
  carregarFaq();
  carregarPerfil();
  carregarDisqus();
  carregarDepoimentos();
  carregarFundo();
  
  // Executa a busca assíncrona dos destinos no Supabase ao iniciar
  carregarDestinosDinamicos();
});