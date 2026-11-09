/* ==========================================================================
   PAINEL DE ADMIN: LOGIN, GALERIA, PREÇOS, DESTINOS, AVISOS E CONFIGURAÇÕES
   ========================================================================== */
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);

// Guarda a lista de destinos em memória para manipulação rápida
let destinosLocais = [];

// Escapa texto para colocar dentro de atributos/HTML sem quebrar (aspas, <, &)
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mostrar(logado) {
  const viewLogin = $('viewLogin');
  const viewPainel = $('viewPainel');
  if (viewLogin) viewLogin.classList.toggle('hidden', logado);
  if (viewPainel) viewPainel.classList.toggle('hidden', !logado);
}

function msg(id, texto, tipo) {
  const el = $(id);
  if (!el) return;
  el.textContent = texto || '';
  el.className = 'msg' + (tipo ? ' ' + tipo : '');
}

/* ---------- Controlo de Abas (Tabs) ---------- */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.admin-tab-content').forEach(c => {
      c.classList.add('hidden');
      c.classList.remove('active');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const target = $(btn.dataset.tab);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Ao abrir Pedidos, busca os mais recentes
    if (btn.dataset.tab === 'tabPedidos' && typeof carregarPedidos === 'function') carregarPedidos();
  });
});

/* ---------- Login & Sessão ---------- */
const formLogin = $('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnEntrar = $('btnEntrar');
    if (btnEntrar) btnEntrar.disabled = true;
    msg('msgLogin', 'Entrando...');

    const emailEl = $('email');
    const senhaEl = $('senha');

    const { error } = await db.auth.signInWithPassword({
      email: emailEl ? emailEl.value.trim() : '',
      password: senhaEl ? senhaEl.value : ''
    });

    if (btnEntrar) btnEntrar.disabled = false;

    if (error) {
      msg('msgLogin', 'E-mail ou senha incorretos.', 'erro');
      return;
    }

    if (senhaEl) senhaEl.value = '';
    msg('msgLogin', '');
  });
}

const btnSair = $('btnSair');
if (btnSair) {
  btnSair.addEventListener('click', async () => {
    await db.auth.signOut();
  });
}

db.auth.onAuthStateChange((evento, sessao) => {
  const logado = !!sessao;
  mostrar(logado);
  if (logado) {
    listarFotos();
    carregarDadosAdmin();
  }
});

db.auth.getSession().then(({ data }) => {
  const logado = !!(data && data.session);
  mostrar(logado);
  if (logado) {
    listarFotos();
    carregarDadosAdmin();
  }
});

/* ---------- Reduz a foto antes de enviar (otimização) ---------- */
async function prepararImagem(arquivo) {
  try {
    const bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
    const max = 1600;
    const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);

    const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
    if (blob) return { blob, ext: 'jpg', tipo: 'image/jpeg' };
  } catch (e) { /* usa o original se falhar */ }

  const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
  const permitido = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  return { blob: arquivo, ext: permitido, tipo: arquivo.type || 'image/jpeg' };
}

/* ---------- Prévia das fotos escolhidas ---------- */
let urlsPrevia = [];

function mostrarPrevia() {
  urlsPrevia.forEach((u) => URL.revokeObjectURL(u));
  urlsPrevia = [];

  const grade = $('previewGrid');
  if (!grade) return;
  grade.innerHTML = '';

  const arquivosInput = $('arquivos');
  if (!arquivosInput) return;
  const arquivos = Array.from(arquivosInput.files);

  const dropInfo = $('dropInfo');
  const btnEnviar = $('btnEnviar');

  if (!arquivos.length) {
    if (dropInfo) dropInfo.textContent = 'Pode escolher várias de uma vez';
    if (btnEnviar) btnEnviar.textContent = 'Enviar fotos';
    return;
  }

  if (dropInfo) {
    dropInfo.textContent = arquivos.length === 1
      ? '1 foto escolhida. Toque para trocar.'
      : `${arquivos.length} fotos escolhidas. Toque para trocar.`;
  }

  if (btnEnviar) {
    btnEnviar.textContent = arquivos.length === 1
      ? 'Enviar 1 foto'
      : `Enviar ${arquivos.length} fotos`;
  }

  arquivos.slice(0, 12).forEach((arquivo) => {
    const url = URL.createObjectURL(arquivo);
    urlsPrevia.push(url);

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Prévia';
    grade.appendChild(img);
  });
}

const inputArq = $('arquivos');
if (inputArq) inputArq.addEventListener('change', mostrarPrevia);

// Arrastar e soltar (computador)
const zona = $('dropzone');
if (zona) {
  ['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.add('arrastando');
  }));
  ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.remove('arrastando');
  }));
  zona.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      const arqEl = $('arquivos');
      if (arqEl) {
        arqEl.files = e.dataTransfer.files;
        mostrarPrevia();
      }
    }
  });
}

/* ---------- Enviar fotos para o Supabase ---------- */
const btnEnv = $('btnEnviar');
if (btnEnv) {
  btnEnv.addEventListener('click', async () => {
    const arquivosInput = $('arquivos');
    if (!arquivosInput) return;
    const arquivos = Array.from(arquivosInput.files);

    if (!arquivos.length) {
      msg('msgUpload', 'Escolha pelo menos uma foto.', 'erro');
      return;
    }

    const legendaEl = $('legenda');
    const sufixo = typeof legendaParaNome === 'function' ? legendaParaNome(legendaEl ? legendaEl.value : '') : '';
    btnEnv.disabled = true;

    let enviadas = 0;
    let falhas = 0;

    for (let i = 0; i < arquivos.length; i++) {
      msg('msgUpload', `Enviando ${i + 1} de ${arquivos.length}...`);

      const { blob, ext, tipo } = await prepararImagem(arquivos[i]);
      const aleatorio = Math.random().toString(36).slice(2, 6);
      const nome = `${Date.now()}_${aleatorio}${sufixo}.${ext}`;

      const { error } = await db.storage.from(SUPABASE_BUCKET).upload(nome, blob, {
        contentType: tipo,
        cacheControl: '31536000',
        upsert: false
      });

      if (error) falhas++; else enviadas++;
    }

    btnEnv.disabled = false;
    arquivosInput.value = '';
    if (legendaEl) legendaEl.value = '';
    mostrarPrevia();

    if (falhas) {
      msg('msgUpload', `${enviadas} enviada(s), ${falhas} com erro.`, 'erro');
    } else {
      msg('msgUpload', `${enviadas} foto(s) enviada(s)!`, 'ok');
    }

    listarFotos();
  });
}

/* ---------- Listar e excluir fotos ---------- */
async function listarFotos() {
  const lista = $('listaFotos');
  if (!lista) return;
  lista.innerHTML = '';

  const { data, error } = await db.storage.from(SUPABASE_BUCKET).list('', {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' }
  });

  if (error) {
    lista.innerHTML = '<div class="vazio">Não foi possível carregar as fotos.</div>';
    return;
  }

  // Fotos de destinos (destino_...) e do perfil (perfil_...) ficam fora da galeria
  const fotos = (data || []).filter((o) => o.name && o.id && !o.name.startsWith('.') && !o.name.startsWith('destino_') && !o.name.startsWith('perfil_'));

  if (!fotos.length) {
    lista.innerHTML = '<div class="vazio">Nenhuma foto enviada ainda.</div>';
    return;
  }

  fotos.forEach((foto) => {
    const card = document.createElement('div');
    card.className = 'admin-photo';

    const img = document.createElement('img');
    img.src = typeof urlPublicaFoto === 'function' ? urlPublicaFoto(foto.name) : foto.name;
    img.alt = 'Foto da galeria';
    img.loading = 'lazy';
    card.appendChild(img);

    const legenda = typeof nomeParaLegenda === 'function' ? nomeParaLegenda(foto.name) : '';
    if (legenda) {
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = legenda;
      card.appendChild(cap);
    }

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.title = 'Excluir foto';
    botao.innerHTML = '<i class="fa-solid fa-trash"></i>';
    botao.addEventListener('click', () => excluirFotoGaleria(foto.name));
    card.appendChild(botao);

    lista.appendChild(card);
  });
}

async function excluirFotoGaleria(nome) {
  if (!confirm('Excluir esta foto da galeria?')) return;

  const { error } = await db.storage.from(SUPABASE_BUCKET).remove([nome]);

  if (error) {
    msg('msgUpload', 'Não foi possível excluir a foto.', 'erro');
    return;
  }

  msg('msgUpload', 'Foto excluída.', 'ok');
  listarFotos();
}

/* ==========================================================================
   DADOS NA NUVEM (SUPABASE): PEDIDOS, AGENDA, DESTINOS, FAQ, AVISO, CONFIG
   ========================================================================== */

const pad2 = (n) => String(n).padStart(2, '0');

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dataBR(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function dinheiro(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

async function lerSiteData(id) {
  try {
    const { data, error } = await db.from('site_data').select('content').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? data.content : null;
  } catch (e) {
    console.warn('Erro ao ler', id, e);
    return null;
  }
}

function salvarSiteData(id, content) {
  return db.from('site_data').upsert({ id, content, updated_at: new Date().toISOString() });
}

/* Move um item (destino / pergunta) para cima ou para baixo na lista */
function moverItem(btn, direcao) {
  const item = btn.closest('.item-ordenavel');
  if (!item) return;
  const alvo = direcao < 0 ? item.previousElementSibling : item.nextElementSibling;
  if (!alvo) return;
  if (direcao < 0) item.parentNode.insertBefore(item, alvo);
  else item.parentNode.insertBefore(alvo, item);
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  btn.focus({ preventScroll: true });
}

async function carregarDadosAdmin() {
  await Promise.all([
    carregarPedidos(),
    carregarFormDisponibilidade(),
    carregarFormAvisos(),
    carregarFormDestinos(),
    carregarFormFaq(),
    carregarFormDepoimentos(),
    carregarFormFundo(),
    carregarFormPerfil()
  ]);
}

/* ==========================================================================
   1. PEDIDOS
   ========================================================================== */
let pedidosCache = [];
let filtroPedidos = 'aberto';

const ROTULO_STATUS = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado'
};

async function carregarPedidos() {
  const lista = $('listaPedidos');
  if (!lista) return;

  const { data, error } = await db
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    console.error('Erro ao carregar pedidos:', error);
    lista.innerHTML = `<p class="vazio-txt">Não foi possível carregar os pedidos.<br><small>${esc(error.message)}<br>Se for a primeira vez, rode o arquivo <b>supabase-pedidos.sql</b> no Supabase.</small></p>`;
    return;
  }

  pedidosCache = data || [];
  renderResumoPedidos();
  renderPedidos();
}

function renderResumoPedidos() {
  const box = $('resumoPedidos');
  if (!box) return;

  const agora = new Date();
  const doMes = pedidosCache.filter((p) => {
    const d = new Date(p.created_at);
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  });

  const ganhosMes = doMes.filter((p) => p.status === 'concluido').reduce((s, p) => s + Number(p.valor || 0), 0);
  const novos = pedidosCache.filter((p) => p.status === 'novo').length;

  const contagem = {};
  pedidosCache.filter((p) => p.status !== 'cancelado').forEach((p) => {
    contagem[p.trajeto] = (contagem[p.trajeto] || 0) + 1;
  });
  const top = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];

  box.innerHTML = `
    <div class="stat"><span class="stat-rotulo">Novos</span><strong class="stat-valor">${novos}</strong></div>
    <div class="stat"><span class="stat-rotulo">Ganhos do mês</span><strong class="stat-valor verde">${dinheiro(ganhosMes)}</strong></div>
    <div class="stat"><span class="stat-rotulo">Mais pedido</span><strong class="stat-valor pequeno">${top ? esc(top[0]) : '—'}</strong>${top ? `<span class="stat-sub">${top[1]}x</span>` : ''}</div>
  `;

  try { if (navigator.setAppBadge) { novos ? navigator.setAppBadge(novos) : navigator.clearAppBadge(); } } catch (e) { /* recurso opcional */ }
  const badge = $('badgePedidos');
  if (badge) {
    badge.textContent = novos > 99 ? '99+' : novos;
    badge.classList.toggle('hidden', novos === 0);
  }
}

function renderPedidos() {
  const lista = $('listaPedidos');
  if (!lista) return;

  const filtros = { aberto: ['novo', 'confirmado'], concluido: ['concluido'], cancelado: ['cancelado'], todos: null };
  const permitidos = filtros[filtroPedidos];
  const itens = pedidosCache.filter((p) => !permitidos || permitidos.includes(p.status));

  if (!itens.length) {
    lista.innerHTML = '<p class="vazio-txt">Nenhum pedido por aqui.</p>';
    return;
  }

  lista.innerHTML = itens.map(htmlPedido).join('');
}

function htmlPedido(p) {
  const quando = new Date(p.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const acoes = {
    novo: [['confirmado', 'Confirmar', 'btn-ok', 'fa-check'], ['cancelado', 'Cancelar', 'btn-perigo-suave', 'fa-xmark']],
    confirmado: [['concluido', 'Concluir', 'btn-ok', 'fa-flag-checkered'], ['cancelado', 'Cancelar', 'btn-perigo-suave', 'fa-xmark']],
    concluido: [['confirmado', 'Reabrir', 'btn-sec', 'fa-rotate-left']],
    cancelado: [['novo', 'Reabrir', 'btn-sec', 'fa-rotate-left']]
  }[p.status] || [];

  const botoes = acoes.map(([st, rotulo, classe, icone]) =>
    `<button type="button" class="btn-grande ${classe}" onclick="mudarStatusPedido('${p.id}', '${st}')"><i class="fa-solid ${icone}"></i> ${rotulo}</button>`
  ).join('');

  return `
    <article class="pedido">
      <div class="pedido-topo">
        <span class="selo status-${esc(p.status)}">${esc(ROTULO_STATUS[p.status] || p.status)}</span>
        ${p.idioma && p.idioma !== 'pt' ? `<span class="pedido-lingua"><i class="fa-solid fa-language" aria-hidden="true"></i> ${esc(NOME_IDIOMA[p.idioma] || p.idioma)}</span>` : ''}
        <time class="pedido-quando">${esc(quando)}</time>
      </div>
      <h3 class="pedido-titulo">${esc(p.trajeto)}</h3>
      <p class="pedido-info"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> ${esc(p.data_viagem || 'A combinar')} &middot; <i class="fa-solid fa-clock" aria-hidden="true"></i> ${esc(p.horario || 'A combinar')} &middot; <i class="fa-solid fa-users" aria-hidden="true"></i> ${esc(p.passageiros || '')}</p>
      <p class="pedido-info"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${esc(p.embarque || 'A combinar')}</p>
      <p class="pedido-info"><i class="fa-solid fa-route" aria-hidden="true"></i> ${esc(p.tipo || '')}</p>
      <div class="pedido-valor">${dinheiro(p.valor)}</div>
      ${htmlBotoesZap(p)}
      <div class="pedido-acoes">
        ${botoes}
        <button type="button" class="btn-icone" aria-label="Excluir pedido" onclick="excluirPedido('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `;
}

/* ----- Mensagens prontas de WhatsApp (no idioma do cliente) -----
   O WhatsApp abre sem número de propósito: o pedido não guarda o telefone do
   cliente (privacidade). Você escolhe o contato da conversa dele e só envia. */
const NOME_IDIOMA = { pt: 'Português', en: 'English', es: 'Español' };

const MSG_ZAP = {
  pt: {
    confirmar: (d) => `Olá! Aqui é ${d.nome}. Seu transfer está confirmado ✅\n\n📍 ${d.trajeto}\n📅 ${d.data} às ${d.hora}\n🏨 Embarque: ${d.embarque}\n💲 Valor: ${d.valor}\n\nEstarei no local no horário combinado. Qualquer dúvida é só chamar!`,
    chegada: (d) => `Olá! Aqui é ${d.nome}. Já cheguei ao local de embarque 🚗${d.modelo ? ` (${d.modelo})` : ''}. Pode vir quando estiver pronto!`,
    avaliacao: (d) => `Olá! Foi um prazer levar você hoje 😊 Se puder, deixe sua avaliação, ajuda muito o meu trabalho:${d.link ? `\n${d.link}` : ''}\nObrigado e boa viagem!`
  },
  en: {
    confirmar: (d) => `Hello! This is ${d.nome}. Your transfer is confirmed ✅\n\n📍 ${d.trajeto}\n📅 ${d.data} at ${d.hora}\n🏨 Pickup: ${d.embarque}\n💲 Price: ${d.valor}\n\nI will be there on time. Feel free to message me with any questions!`,
    chegada: (d) => `Hello! This is ${d.nome}. I have arrived at the pickup point 🚗${d.modelo ? ` (${d.modelo})` : ''}. Come whenever you are ready!`,
    avaliacao: (d) => `Hello! It was a pleasure driving you today 😊 If you can, please leave a review, it really helps my work:${d.link ? `\n${d.link}` : ''}\nThank you and safe travels!`
  },
  es: {
    confirmar: (d) => `¡Hola! Le habla ${d.nome}. Su traslado está confirmado ✅\n\n📍 ${d.trajeto}\n📅 ${d.data} a las ${d.hora}\n🏨 Recogida: ${d.embarque}\n💲 Valor: ${d.valor}\n\nEstaré en el lugar a la hora acordada. ¡Cualquier duda, escríbame!`,
    chegada: (d) => `¡Hola! Le habla ${d.nome}. Ya llegué al punto de recogida 🚗${d.modelo ? ` (${d.modelo})` : ''}. ¡Puede venir cuando esté listo!`,
    avaliacao: (d) => `¡Hola! Fue un placer llevarlo hoy 😊 Si puede, deje su opinión, ayuda mucho a mi trabajo:${d.link ? `\n${d.link}` : ''}\n¡Gracias y buen viaje!`
  }
};

function htmlBotoesZap(p) {
  if (p.status === 'cancelado') return '';
  const rotulos = {
    novo: [['confirmar', 'fa-circle-check', 'Confirmar no WhatsApp', false]],
    confirmado: [['chegada', 'fa-car-side', 'Avisar que cheguei', false]],
    concluido: [['avaliacao', 'fa-star', 'Pedir avaliação', true]]
  }[p.status] || [];
  if (!rotulos.length) return '';
  return `<div class="pedido-zap">${rotulos.map(([tipo, icone, rotulo, destaque]) =>
    `<button type="button" class="btn-zap${destaque ? ' destaque' : ''}" onclick="abrirZapPedido('${p.id}', '${tipo}')"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i><i class="fa-solid ${icone}" aria-hidden="true"></i> ${rotulo}</button>`
  ).join('')}</div>`;
}

function abrirZapPedido(id, tipo) {
  const p = pedidosCache.find((x) => x.id === id);
  if (!p) return;
  const lingua = MSG_ZAP[p.idioma] ? p.idioma : 'pt';
  const link = (perfilAtual.avaliacaoGoogle || '').trim();

  if (tipo === 'avaliacao' && !link) {
    msg('msgPedidos', 'Dica: cadastre o link de avaliação do Google na aba Perfil para ele ir junto na mensagem.', '');
  }

  const texto = MSG_ZAP[lingua][tipo]({
    nome: (perfilAtual.nome || '').split(' ')[0] || '',
    modelo: perfilAtual.modelo || '',
    trajeto: p.trajeto || '',
    data: p.data_viagem || '—',
    hora: p.horario || '—',
    embarque: p.embarque || '—',
    valor: dinheiro(p.valor),
    link
  });
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
}

async function mudarStatusPedido(id, status) {
  const { error } = await db.from('pedidos').update({ status }).eq('id', id);
  if (error) {
    msg('msgPedidos', 'Erro ao atualizar: ' + error.message, 'erro');
    return;
  }
  const p = pedidosCache.find((x) => x.id === id);
  if (p) p.status = status;
  msg('msgPedidos', 'Pedido atualizado: ' + ROTULO_STATUS[status] + '.', 'ok');
  renderResumoPedidos();
  renderPedidos();
}

async function excluirPedido(id) {
  if (!confirm('Excluir este pedido definitivamente?')) return;
  const { error } = await db.from('pedidos').delete().eq('id', id);
  if (error) {
    msg('msgPedidos', 'Erro ao excluir: ' + error.message, 'erro');
    return;
  }
  pedidosCache = pedidosCache.filter((x) => x.id !== id);
  msg('msgPedidos', 'Pedido excluído.', 'ok');
  renderResumoPedidos();
  renderPedidos();
}

document.querySelectorAll('.chip-filtro').forEach((chip) => {
  chip.addEventListener('click', () => {
    filtroPedidos = chip.dataset.filtro;
    document.querySelectorAll('.chip-filtro').forEach((c) => {
      const ativo = c === chip;
      c.classList.toggle('active', ativo);
      c.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
    renderPedidos();
  });
});

const btnAtualizarPed = $('btnAtualizarPedidos');
if (btnAtualizarPed) {
  btnAtualizarPed.addEventListener('click', async () => {
    msg('msgPedidos', 'Atualizando...');
    await carregarPedidos();
    msg('msgPedidos', '');
  });
}

/* ==========================================================================
   2. AGENDA (DISPONIBILIDADE)
   ========================================================================== */
let dispAdmin = { aberto: true, mensagem: '', datas: [] };

async function carregarFormDisponibilidade() {
  const c = await lerSiteData('disponibilidade');
  const hoje = hojeISO();
  dispAdmin = {
    aberto: !c || c.aberto !== false,
    mensagem: (c && c.mensagem) || '',
    datas: ((c && Array.isArray(c.datas)) ? c.datas : []).filter((d) => d >= hoje).sort()
  };

  const campoData = $('dispNovaData');
  if (campoData) campoData.min = hoje;
  renderDisponibilidade();
}

function renderDisponibilidade() {
  const chk = $('dispAberta');
  if (!chk) return;
  chk.checked = dispAdmin.aberto;
  $('dispRotulo').textContent = dispAdmin.aberto ? 'Agenda aberta' : 'Agenda fechada';
  $('dispStatusCard').classList.toggle('fechada', !dispAdmin.aberto);
  $('dispMensagem').value = dispAdmin.mensagem;

  const lista = $('listaDatasBloqueadas');
  if (!dispAdmin.datas.length) {
    lista.innerHTML = '<p class="vazio-txt">Nenhuma data bloqueada.</p>';
    return;
  }
  lista.innerHTML = dispAdmin.datas.map((d) => `
    <span class="chip-data">${dataBR(d)}
      <button type="button" aria-label="Liberar ${dataBR(d)}" onclick="removerDataBloqueada('${d}')"><i class="fa-solid fa-xmark"></i></button>
    </span>
  `).join('');
}

async function salvarDisponibilidade(textoOk, idMsg) {
  idMsg = idMsg || 'msgDisp';
  dispAdmin.mensagem = $('dispMensagem').value.trim();
  msg(idMsg, 'Salvando...');
  const { error } = await salvarSiteData('disponibilidade', dispAdmin);
  if (error) {
    console.error('Erro ao salvar agenda:', error);
    msg(idMsg, 'Erro ao salvar: ' + error.message, 'erro');
    return false;
  }
  msg(idMsg, textoOk || 'Agenda atualizada no site!', 'ok');
  return true;
}

const chkAberta = $('dispAberta');
if (chkAberta) {
  chkAberta.addEventListener('change', async (e) => {
    dispAdmin.aberto = e.target.checked;
    renderDisponibilidade();
    await salvarDisponibilidade(dispAdmin.aberto ? 'Agenda aberta no site!' : 'Agenda fechada no site.');
  });
}

const btnSalvarDisp = $('btnSalvarDisp');
if (btnSalvarDisp) btnSalvarDisp.addEventListener('click', () => salvarDisponibilidade());

async function bloquearData(iso) {
  if (!dispAdmin.datas.includes(iso)) dispAdmin.datas.push(iso);
  dispAdmin.datas.sort();
  renderDisponibilidade();
  await salvarDisponibilidade('Data bloqueada: ' + dataBR(iso) + '.', 'msgDatas');
}

const btnFecharHoje = $('btnFecharHoje');
if (btnFecharHoje) btnFecharHoje.addEventListener('click', () => bloquearData(hojeISO()));

const btnBloquear = $('btnBloquearData');
if (btnBloquear) {
  btnBloquear.addEventListener('click', () => {
    const v = $('dispNovaData').value;
    if (!v) { msg('msgDatas', 'Escolha uma data primeiro.', 'erro'); return; }
    if (v < hojeISO()) { msg('msgDatas', 'Essa data já passou.', 'erro'); return; }
    $('dispNovaData').value = '';
    bloquearData(v);
  });
}

async function removerDataBloqueada(iso) {
  dispAdmin.datas = dispAdmin.datas.filter((d) => d !== iso);
  renderDisponibilidade();
  await salvarDisponibilidade('Data liberada: ' + dataBR(iso) + '.', 'msgDatas');
}

/* ==========================================================================
   3. DESTINOS (preço, foto, texto, ativo, destaque e ordem)
   ========================================================================== */
const DESTINOS_PADRAO = [
  { id: 'cataratas_br', titulo: 'Cataratas do Iguaçu (Lado Brasileiro)', sub: 'Parque Nacional do Iguaçu', preco: 130, foto: 'fotos/cataratas.jpeg', ativo: true, desc: 'Explore uma das Sete Maravilhas Naturais do Mundo com toda a comodidade. Desfrute da passarela panorâmica com vista de frente para a monumental Garganta do Diabo, sem se preocupar com trânsito, estacionamento ou filas de transporte.' },
  { id: 'feirinha_arg', titulo: 'Feirinha de Puerto Iguazú & Gastronomia', sub: 'Gastronomia & Vinhos em 🇦🇷', preco: 175, foto: 'fotos/puerto-iguazu-fronteira-brasil-argentina-1024x768.webp', ativo: true, desc: 'Desfrute de picanhas suculentas, alfajores, queijos, azeites e ótimos restaurantes de Puerto Iguazú com total conforto e segurança na travessia.' },
  { id: 'compras_py', titulo: 'Compras em Ciudad del Este (Paraguai)', sub: 'Eletrônicos, Perfumes & Utilidades', preco: 180, foto: 'fotos/tienda-nissei-ciudad.jpg', ativo: true, desc: 'Vá às compras no comércio paraguaio (Nissei, CellShop, Monalisa e shoppings) com total tranquilidade. Livre-se do estresse com o trânsito da Ponte da Amizade e estacionamento.' },
  { id: 'itaipu', titulo: 'Usina Hidrelétrica de Itaipu', sub: 'Binacional Brasil / Paraguai', preco: 90, foto: 'fotos/usina-de-itaipu-foz-do-iguacu-curiosidades-scaled.jpg', ativo: true, desc: 'Conheça uma das maiores produtoras de energia limpa e renovável do planeta. Realize a visita panorâmica ou os circuitos especiais com a praticidade de um transfer privativo.' },
  { id: 'parque_aves', titulo: 'Parque das Aves', sub: 'Imersão na Mata Atlântica', preco: 130, foto: 'fotos/cataratas.jpeg', ativo: true, desc: 'Um santuário espetacular localizado bem em frente às Cataratas. Vivencie uma experiência única de imersão em viveiros gigantes com tucanos, araras e centenas de espécies de aves da Mata Atlântica.' },
  { id: 'templo_budista', titulo: 'Templo Budista Chen Yen', sub: 'Paz e Estátuas Gigantes', preco: 95, foto: 'fotos/usina-de-itaipu-foz-do-iguacu-curiosidades-scaled.jpg', ativo: true, desc: 'Um refúgio de serenidade e contemplação em Foz do Iguaçu, com dezenas de estátuas douradas imponentes, uma imagem de Buda com 7 metros de altura e uma vista privilegiada da região.' },
  { id: 'marco_fronteiras', titulo: 'Marco das Três Fronteiras', sub: 'Encontro do Brasil, Argentina e Paraguai', preco: 85, foto: 'fotos/puerto-iguazu-fronteira-brasil-argentina-1024x768.webp', ativo: true, desc: 'O ponto histórico onde as fronteiras do Brasil, Argentina e Paraguai se encontram. Desfrute de um pôr do sol inesquecível, praça de alimentação temática e apresentações culturais à noite.' },
  { id: 'museu_cera', titulo: 'Complexo Dreamland (Museu de Cera)', sub: 'Vale dos Dinossauros & Atrações', preco: 95, foto: 'fotos/cataratas.jpeg', ativo: true, desc: 'Um excelente passeio para a família na Avenida das Cataratas, reunindo estátuas de cera em tamanho real de grandes ícones mundiais, o Vale dos Dinossauros animatrônicos e o Bar de Gelo.' }
];

function garantirIds(lista) {
  lista.forEach((d, i) => { if (!d.id) d.id = 'dest_' + Date.now() + '_' + i; });
  return lista;
}

async function obterDestinos() {
  const c = await lerSiteData('destinos');
  if (Array.isArray(c) && c.length > 0) {
    destinosLocais = garantirIds(c);
    localStorage.setItem('admin_destinos', JSON.stringify(destinosLocais));
    return destinosLocais;
  }

  let salvos = null;
  try { salvos = JSON.parse(localStorage.getItem('admin_destinos')); } catch (e) { /* ignora */ }
  destinosLocais = garantirIds(Array.isArray(salvos) && salvos.length ? salvos : DESTINOS_PADRAO.map((d) => ({ ...d })));
  return destinosLocais;
}

async function carregarFormDestinos() {
  const container = $('listaDestinosAdmin');
  if (!container) return;

  const destinos = await obterDestinos();

  container.innerHTML = destinos.map((d) => `
    <article class="item-ordenavel item-destino-admin" data-id="${esc(d.id)}">
      <div class="item-topo">
        <img class="item-thumb" src="${esc(d.foto)}" alt="" loading="lazy">
        <div class="item-titulo-wrap">
          <label class="sr-only" for="t_${esc(d.id)}">Nome do destino</label>
          <input type="text" id="t_${esc(d.id)}" class="input-destino-titulo campo-titulo" value="${esc(d.titulo)}" placeholder="Nome do destino">
        </div>
      </div>

      <div class="grade-2">
        <div class="field">
          <label for="p_${esc(d.id)}">Preço (R$)</label>
          <input type="number" inputmode="decimal" id="p_${esc(d.id)}" class="input-destino-preco" value="${Number(d.preco) || 0}">
        </div>
        <div class="field">
          <label for="s_${esc(d.id)}">Subtítulo</label>
          <input type="text" id="s_${esc(d.id)}" class="input-destino-sub" value="${esc(d.sub)}">
        </div>
      </div>

      <label class="check-linha destaque">
        <input type="checkbox" class="chk-destino-destaque" ${d.destaque ? 'checked' : ''}>
        <span><i class="fa-solid fa-star" aria-hidden="true"></i> Destaque na página inicial</span>
      </label>

      <label class="check-linha">
        <input type="checkbox" class="chk-destino-ativo" ${d.ativo !== false ? 'checked' : ''}>
        <span>Visível no site (desmarque para pôr em manutenção)</span>
      </label>

      <label class="custom-file-btn">
        <i class="fa-solid fa-upload"></i> <span class="nome-arquivo">Trocar foto...</span>
        <input type="file" class="input-destino-file" accept="image/*">
      </label>

      <div class="field">
        <label for="d_${esc(d.id)}">Descrição do passeio</label>
        <textarea id="d_${esc(d.id)}" class="input-destino-desc campo-texto" rows="3">${esc(d.desc)}</textarea>
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-icone" aria-label="Mover para cima" onclick="moverItem(this, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" class="btn-icone" aria-label="Mover para baixo" onclick="moverItem(this, 1)"><i class="fa-solid fa-arrow-down"></i></button>
        <span class="espaco"></span>
        <button type="button" class="btn-icone perigo" aria-label="Excluir destino" onclick="excluirDestino('${esc(d.id)}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `).join('');
}

const listaDestinosEl = $('listaDestinosAdmin');
if (listaDestinosEl) {
  listaDestinosEl.addEventListener('change', (e) => {
    if (e.target.matches('.input-destino-file')) {
      const nome = e.target.closest('.custom-file-btn').querySelector('.nome-arquivo');
      nome.textContent = e.target.files[0] ? e.target.files[0].name : 'Trocar foto...';
    }
  });
}

async function salvarDestinos(textoOk) {
  const btn = $('btnSalvarDestinos');
  if (btn) btn.disabled = true;
  msg('msgDestinos', 'Sincronizando com a nuvem...');

  const itens = Array.from(document.querySelectorAll('.item-destino-admin'));
  const novaLista = [];
  let falhasFoto = 0;

  for (const item of itens) {
    const base = destinosLocais.find((d) => d.id === item.dataset.id) || { id: item.dataset.id };

    base.titulo = item.querySelector('.input-destino-titulo').value.trim();
    base.sub = item.querySelector('.input-destino-sub').value.trim();
    base.preco = Math.min(100000, Math.max(0, Number(item.querySelector('.input-destino-preco').value) || 0));
    base.desc = item.querySelector('.input-destino-desc').value.trim();
    base.ativo = item.querySelector('.chk-destino-ativo').checked;
    base.destaque = item.querySelector('.chk-destino-destaque').checked;

    const fileInput = item.querySelector('.input-destino-file');
    if (fileInput && fileInput.files.length > 0) {
      const { blob, ext, tipo } = await prepararImagem(fileInput.files[0]);
      const nomeArquivo = `destino_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await db.storage.from(SUPABASE_BUCKET).upload(nomeArquivo, blob, {
        contentType: tipo, cacheControl: '31536000', upsert: false
      });
      if (error) falhasFoto++; else base.foto = urlPublicaFoto(nomeArquivo);
    }

    novaLista.push(base);
  }

  const { error: dbError } = await salvarSiteData('destinos', novaLista);
  if (btn) btn.disabled = false;

  if (dbError) {
    console.error('Erro ao salvar destinos:', dbError);
    msg('msgDestinos', 'Erro ao salvar: ' + dbError.message, 'erro');
    return;
  }

  destinosLocais = novaLista;
  localStorage.setItem('admin_destinos', JSON.stringify(destinosLocais));

  if (falhasFoto) msg('msgDestinos', `Salvo, mas ${falhasFoto} foto(s) não foram enviadas.`, 'erro');
  else msg('msgDestinos', textoOk || 'Destinos publicados no site!', 'ok');

  await carregarFormDestinos();
}

const btnSalvarDest = $('btnSalvarDestinos');
if (btnSalvarDest) btnSalvarDest.addEventListener('click', () => salvarDestinos());

function excluirDestino(id) {
  const item = document.querySelector(`.item-destino-admin[data-id="${CSS.escape(id)}"]`);
  if (!item) return;
  const nome = item.querySelector('.input-destino-titulo').value || 'este destino';
  if (!confirm(`Excluir "${nome}"?`)) return;
  item.remove();
  msg('msgDestinos', 'Destino removido da lista. Toque em "Salvar alterações" para publicar.', '');
}

const formNovo = $('formNovoDestino');
if (formNovo) {
  formNovo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const arquivoInput = $('novoFotoInput');
    if (!arquivoInput || !arquivoInput.files.length) {
      msg('msgNovoDestino', 'Escolha uma foto.', 'erro');
      return;
    }

    msg('msgNovoDestino', 'Enviando foto e cadastrando destino...');

    const { blob, ext, tipo } = await prepararImagem(arquivoInput.files[0]);
    const nomeArquivo = `destino_${Date.now()}.${ext}`;

    const { error: uploadError } = await db.storage.from(SUPABASE_BUCKET).upload(nomeArquivo, blob, {
      contentType: tipo, cacheControl: '31536000', upsert: false
    });

    if (uploadError) {
      console.error('Erro no upload da imagem:', uploadError);
      msg('msgNovoDestino', 'Erro ao enviar a imagem.', 'erro');
      return;
    }

    await obterDestinos();

    destinosLocais.push({
      id: 'custom_' + Date.now(),
      titulo: $('novoTitulo').value.trim(),
      sub: $('novoSub').value.trim(),
      preco: Math.min(100000, Math.max(0, Number($('novoPreco').value) || 0)),
      foto: urlPublicaFoto(nomeArquivo),
      desc: $('novoDesc').value.trim(),
      ativo: true,
      destaque: false
    });

    const { error: dbError } = await salvarSiteData('destinos', destinosLocais);
    localStorage.setItem('admin_destinos', JSON.stringify(destinosLocais));

    if (dbError) {
      console.error('Erro no Supabase:', dbError);
      msg('msgNovoDestino', 'Erro ao salvar no banco: ' + dbError.message, 'erro');
    } else {
      msg('msgNovoDestino', 'Novo destino cadastrado! Ele está no fim da lista acima.', 'ok');
      formNovo.reset();
      const nomeEl = $('nomeArquivoNovo');
      if (nomeEl) nomeEl.textContent = 'Escolher foto...';
      await carregarFormDestinos();
    }
  });
}

/* ==========================================================================
   4. FAQ
   ========================================================================== */
const FAQ_PADRAO = [
  { pergunta: 'Quais formas de pagamento são aceitas?', resposta: 'Aceito Pix e cartões de débito/crédito com praticidade no momento do atendimento.' },
  { pergunta: 'Atende viagens para Paraguai e Argentina?', resposta: 'Sim! Faço o transporte para compras em CDE e passeios na Feirinha de Puerto Iguazú.' },
  { pergunta: 'Como funciona a espera no aeroporto?', resposta: 'Acompanho o status do seu voo para garantir recepção sem atrasos no desembarque.' }
];

function htmlItemFaq(pergunta, resposta) {
  return `
    <article class="item-ordenavel item-faq-admin">
      <div class="field">
        <label>Pergunta</label>
        <input type="text" class="input-faq-pergunta" maxlength="160" value="${esc(pergunta)}" placeholder="Ex.: Aceita Pix?">
      </div>
      <div class="field">
        <label>Resposta</label>
        <textarea class="input-faq-resposta campo-texto" rows="3" maxlength="600" placeholder="Escreva a resposta...">${esc(resposta)}</textarea>
      </div>
      <div class="item-acoes">
        <button type="button" class="btn-icone" aria-label="Mover para cima" onclick="moverItem(this, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" class="btn-icone" aria-label="Mover para baixo" onclick="moverItem(this, 1)"><i class="fa-solid fa-arrow-down"></i></button>
        <span class="espaco"></span>
        <button type="button" class="btn-icone perigo" aria-label="Excluir pergunta" onclick="excluirFaq(this)"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `;
}

async function carregarFormFaq() {
  const lista = $('listaFaqAdmin');
  if (!lista) return;
  const c = await lerSiteData('faq');
  const itens = Array.isArray(c) && c.length ? c : FAQ_PADRAO;
  lista.innerHTML = itens.map((i) => htmlItemFaq(i.pergunta, i.resposta)).join('');
}

function excluirFaq(btn) {
  if (!confirm('Excluir esta pergunta?')) return;
  btn.closest('.item-faq-admin').remove();
  msg('msgFaq', 'Pergunta removida da lista. Toque em "Salvar FAQ" para publicar.', '');
}

const btnAddFaq = $('btnAddFaq');
if (btnAddFaq) {
  btnAddFaq.addEventListener('click', () => {
    const lista = $('listaFaqAdmin');
    lista.insertAdjacentHTML('beforeend', htmlItemFaq('', ''));
    const novo = lista.lastElementChild;
    novo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    novo.querySelector('.input-faq-pergunta').focus({ preventScroll: true });
  });
}

const btnSalvarFaq = $('btnSalvarFaq');
if (btnSalvarFaq) {
  btnSalvarFaq.addEventListener('click', async () => {
    const itens = Array.from(document.querySelectorAll('.item-faq-admin'))
      .map((el) => ({
        pergunta: el.querySelector('.input-faq-pergunta').value.trim(),
        resposta: el.querySelector('.input-faq-resposta').value.trim()
      }))
      .filter((i) => i.pergunta && i.resposta);

    if (!itens.length) {
      msg('msgFaq', 'Mantenha ao menos uma pergunta com resposta.', 'erro');
      return;
    }

    btnSalvarFaq.disabled = true;
    msg('msgFaq', 'Salvando...');
    const { error } = await salvarSiteData('faq', itens);
    btnSalvarFaq.disabled = false;

    if (error) {
      console.error('Erro ao salvar FAQ:', error);
      msg('msgFaq', 'Erro ao salvar: ' + error.message, 'erro');
    } else {
      msg('msgFaq', 'FAQ publicado no site!', 'ok');
      carregarFormFaq();
    }
  });
}

/* ==========================================================================
   5. AVISO NO TOPO
   ========================================================================== */
async function carregarFormAvisos() {
  const c = await lerSiteData('aviso');
  const aviso = c || { ativo: false, texto: '' };
  if ($('avisoAtivo')) $('avisoAtivo').checked = !!aviso.ativo;
  if ($('avisoTexto')) $('avisoTexto').value = aviso.texto || '';
}

const btnSalvarAv = $('btnSalvarAviso');
if (btnSalvarAv) {
  btnSalvarAv.addEventListener('click', async () => {
    const aviso = {
      ativo: $('avisoAtivo').checked,
      texto: $('avisoTexto').value.trim()
    };

    btnSalvarAv.disabled = true;
    msg('msgAviso', 'Salvando na nuvem...');
    const { error } = await salvarSiteData('aviso', aviso);
    btnSalvarAv.disabled = false;

    if (error) {
      console.error('Erro ao salvar aviso:', error);
      msg('msgAviso', 'Erro ao salvar: ' + error.message, 'erro');
    } else {
      msg('msgAviso', aviso.ativo ? 'Aviso publicado no site!' : 'Aviso salvo (desativado).', 'ok');
    }
  });
}

/* ==========================================================================
   6. PERFIL (motorista, veículo, contato)
   ========================================================================== */
const PERFIL_PADRAO = {
  nome: 'Nome do Motorista',
  subtitulo: 'Motorista Particular & Transfers Profissionais',
  modelo: 'Modelo do carro',
  capacidade: 4,
  base: 'Cidade e região de atendimento',
  seguranca: 'Veículo Higienizado & Revisado',
  whatsapp: '5545999999999',
  pix: '',
  avaliacaoGoogle: '',
  fotoMotorista: 'fotos/placeholder-motorista.svg',
  fotoVeiculo: 'fotos/placeholder-carro.svg',
  ...((typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.perfilPadrao) || {})
};

let perfilAtual = { ...PERFIL_PADRAO };

function montarSelectCapacidade() {
  const sel = $('perfCapacidade');
  if (!sel || sel.options.length) return;
  for (let i = 1; i <= 8; i++) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = i === 1 ? '1 pessoa' : i + ' pessoas';
    sel.appendChild(o);
  }
}

function formatarTelefone(digitos) {
  // 5545999425652 -> (45) 99942-5652
  const d = String(digitos || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

async function carregarFormPerfil() {
  if (!$('perfNome')) return;
  montarSelectCapacidade();

  const c = await lerSiteData('perfil');
  perfilAtual = { ...PERFIL_PADRAO };
  if (c && typeof c === 'object') {
    Object.keys(PERFIL_PADRAO).forEach((k) => {
      if (c[k] !== undefined && c[k] !== null && String(c[k]).trim() !== '') perfilAtual[k] = c[k];
    });
    if (c.pix !== undefined) perfilAtual.pix = c.pix || '';
    if (c.avaliacaoGoogle !== undefined) perfilAtual.avaliacaoGoogle = c.avaliacaoGoogle || '';
  }

  $('perfNome').value = perfilAtual.nome;
  $('perfSubtitulo').value = perfilAtual.subtitulo;
  $('perfModelo').value = perfilAtual.modelo;
  $('perfCapacidade').value = String(perfilAtual.capacidade);
  $('perfBase').value = perfilAtual.base;
  $('perfSeguranca').value = perfilAtual.seguranca;
  $('perfWhatsApp').value = formatarTelefone(perfilAtual.whatsapp);
  $('perfPix').value = perfilAtual.pix || '';
  if ($('perfAvaliacao')) $('perfAvaliacao').value = perfilAtual.avaliacaoGoogle || '';
  $('perfFotoMotoristaImg').src = perfilAtual.fotoMotorista;
  $('perfFotoVeiculoImg').src = perfilAtual.fotoVeiculo;
}

// Prévia imediata da foto escolhida
[['perfFotoMotoristaInput', 'perfFotoMotoristaImg', 'Trocar foto do motorista'],
 ['perfFotoVeiculoInput', 'perfFotoVeiculoImg', 'Trocar foto do carro']].forEach(([inputId, imgId, rotulo]) => {
  const input = $(inputId);
  if (!input) return;
  input.addEventListener('change', () => {
    const nome = input.closest('.custom-file-btn').querySelector('.nome-arquivo');
    const arq = input.files[0];
    nome.textContent = arq ? arq.name : rotulo;
    if (arq) $(imgId).src = URL.createObjectURL(arq);
  });
});

async function enviarFotoPerfil(input, prefixo) {
  if (!input || !input.files.length) return null;
  const { blob, ext, tipo } = await prepararImagem(input.files[0]);
  const nome = `perfil_${prefixo}_${Date.now()}.${ext}`;
  const { error } = await db.storage.from(SUPABASE_BUCKET).upload(nome, blob, {
    contentType: tipo, cacheControl: '31536000', upsert: false
  });
  if (error) throw error;
  return urlPublicaFoto(nome);
}

const btnSalvarPerfil = $('btnSalvarPerfil');
if (btnSalvarPerfil) {
  btnSalvarPerfil.addEventListener('click', async () => {
    const nome = $('perfNome').value.trim();
    if (!nome) { msg('msgPerfil', 'Preencha o nome.', 'erro'); return; }

    let wa = $('perfWhatsApp').value.replace(/\D/g, '');
    if (wa.length === 10 || wa.length === 11) wa = '55' + wa;
    if (wa.length < 12 || wa.length > 15) {
      msg('msgPerfil', 'WhatsApp inválido. Use o DDD e o número, ex.: 45 99942-5652.', 'erro');
      return;
    }

    const avaliacao = ($('perfAvaliacao') ? $('perfAvaliacao').value.trim() : '');
    if (avaliacao && !/^https:\/\//i.test(avaliacao)) {
      msg('msgPerfil', 'O link de avaliação precisa começar com https://', 'erro');
      return;
    }

    btnSalvarPerfil.disabled = true;
    msg('msgPerfil', 'Salvando...');

    try {
      const novaFotoMotorista = await enviarFotoPerfil($('perfFotoMotoristaInput'), 'motorista');
      const novaFotoVeiculo = await enviarFotoPerfil($('perfFotoVeiculoInput'), 'carro');

      const novo = {
        nome,
        subtitulo: $('perfSubtitulo').value.trim(),
        modelo: $('perfModelo').value.trim(),
        capacidade: Number($('perfCapacidade').value) || 4,
        base: $('perfBase').value.trim(),
        seguranca: $('perfSeguranca').value.trim(),
        whatsapp: wa,
        pix: $('perfPix').value.trim(),
        avaliacaoGoogle: avaliacao,
        fotoMotorista: novaFotoMotorista || perfilAtual.fotoMotorista,
        fotoVeiculo: novaFotoVeiculo || perfilAtual.fotoVeiculo
      };

      const { error } = await salvarSiteData('perfil', novo);
      if (error) throw error;

      $('perfFotoMotoristaInput').value = '';
      $('perfFotoVeiculoInput').value = '';
      msg('msgPerfil', 'Perfil publicado no site!', 'ok');
      await carregarFormPerfil();
      document.querySelectorAll('#tabConfig .nome-arquivo').forEach((el, i) => {
        el.textContent = i === 0 ? 'Trocar foto do motorista' : 'Trocar foto do carro';
      });
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
      msg('msgPerfil', 'Erro ao salvar: ' + (e.message || e), 'erro');
    } finally {
      btnSalvarPerfil.disabled = false;
    }
  });
}

/* ==========================================================================
   7. DEPOIMENTOS (aba Conteúdo)
   ========================================================================== */
function htmlItemDepo(autor, texto) {
  return `
    <article class="item-ordenavel item-depo-admin">
      <div class="field">
        <label>Depoimento</label>
        <textarea class="input-depo-texto campo-texto" rows="4" maxlength="800" placeholder="O que o passageiro escreveu...">${esc(texto)}</textarea>
      </div>
      <div class="field">
        <label>Nome e cidade (opcional)</label>
        <input type="text" class="input-depo-autor" maxlength="100" value="${esc(autor)}" placeholder="Ex.: Carlos M. • São Paulo">
      </div>
      <div class="item-acoes">
        <button type="button" class="btn-icone" aria-label="Mover para cima" onclick="moverItem(this, -1)"><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" class="btn-icone" aria-label="Mover para baixo" onclick="moverItem(this, 1)"><i class="fa-solid fa-arrow-down"></i></button>
        <span class="espaco"></span>
        <button type="button" class="btn-icone perigo" aria-label="Excluir depoimento" onclick="excluirDepo(this)"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>
  `;
}

const HTML_DEPO_VAZIO = '<p class="vazio-txt" id="depoVazio">Nenhum depoimento ainda. Toque em "Adicionar depoimento".</p>';

async function carregarFormDepoimentos() {
  const lista = $('listaDepoAdmin');
  if (!lista) return;
  const c = await lerSiteData('depoimentos');
  const itens = Array.isArray(c) ? c : [];
  lista.innerHTML = itens.length ? itens.map((i) => htmlItemDepo(i.autor || '', i.texto || '')).join('') : HTML_DEPO_VAZIO;
}

function excluirDepo(btn) {
  if (!confirm('Excluir este depoimento?')) return;
  const lista = $('listaDepoAdmin');
  btn.closest('.item-depo-admin').remove();
  if (!lista.querySelector('.item-depo-admin')) lista.innerHTML = HTML_DEPO_VAZIO;
  msg('msgDepo', 'Depoimento removido da lista. Toque em "Salvar depoimentos" para publicar.', '');
}

const btnAddDepo = $('btnAddDepo');
if (btnAddDepo) {
  btnAddDepo.addEventListener('click', () => {
    const lista = $('listaDepoAdmin');
    const vazio = $('depoVazio');
    if (vazio) vazio.remove();
    lista.insertAdjacentHTML('beforeend', htmlItemDepo('', ''));
    const novo = lista.lastElementChild;
    novo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    novo.querySelector('.input-depo-texto').focus({ preventScroll: true });
  });
}

const btnSalvarDepo = $('btnSalvarDepo');
if (btnSalvarDepo) {
  btnSalvarDepo.addEventListener('click', async () => {
    const itens = Array.from(document.querySelectorAll('.item-depo-admin'))
      .map((el) => ({
        texto: el.querySelector('.input-depo-texto').value.trim(),
        autor: el.querySelector('.input-depo-autor').value.trim()
      }))
      .filter((i) => i.texto);

    btnSalvarDepo.disabled = true;
    msg('msgDepo', 'Salvando...');
    const { error } = await salvarSiteData('depoimentos', itens);
    btnSalvarDepo.disabled = false;

    if (error) {
      console.error('Erro ao salvar depoimentos:', error);
      msg('msgDepo', 'Erro ao salvar: ' + error.message, 'erro');
    } else {
      msg('msgDepo', 'Depoimentos publicados no site!', 'ok');
      carregarFormDepoimentos();
    }
  });
}

/* ==========================================================================
   8. INSTALAR O PAINEL COMO APP (PWA)
   ========================================================================== */
(function iniciarInstalacao() {
  const cartao = $('cartaoInstalar');
  if (!cartao) return;

  const jaInstalado = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const guardado = () => { try { return localStorage.getItem('instalarDispensado') === '1'; } catch (e) { return false; } };
  const dispensar = () => { try { localStorage.setItem('instalarDispensado', '1'); } catch (e) { /* ok */ } };

  if (jaInstalado || guardado()) return;

  let eventoInstalar = null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoInstalar = e;
    $('instalarDica').textContent = 'Abre como um app, direto da tela inicial.';
    $('btnInstalar').textContent = 'Instalar';
    cartao.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => { cartao.classList.add('hidden'); dispensar(); });

  if (ios) {
    $('instalarDica').textContent = 'No Safari: toque em Compartilhar e depois em "Adicionar à Tela de Início".';
    $('btnInstalar').classList.add('hidden');
    cartao.classList.remove('hidden');
  }

  $('btnInstalar').addEventListener('click', async () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    try { await eventoInstalar.userChoice; } catch (e) { /* ok */ }
    eventoInstalar = null;
    cartao.classList.add('hidden');
  });

  $('btnFecharInstalar').addEventListener('click', () => { cartao.classList.add('hidden'); dispensar(); });
})();

/* ==========================================================================
   9. FUNDO ANIMADO DO SITE (card dentro da aba Perfil)
   ========================================================================== */
const FUNDOS_OK = typeof FUNDOS !== 'undefined' && typeof PALETAS !== 'undefined' && typeof montarFundo === 'function';
let fundoEscolhido = FUNDOS_OK ? { ...FUNDO_PADRAO } : {};

function avisoFundosAusentes() {
  const grade = $('gradeEstilos');
  if (grade) grade.innerHTML = '<p class="vazio-txt">Não foi possível carregar os fundos. Confira se os arquivos <b>fundos.js</b> e <b>fundos.css</b> estão na mesma pasta do admin.html (e recarregue com Ctrl+F5).</p>';
  const botao = $('btnSalvarFundo');
  if (botao) botao.disabled = true;
}

function desenharOpcoesFundo() {
  if (!FUNDOS_OK) { avisoFundosAusentes(); return; }
  const grade = $('gradeEstilos');
  const cores = $('linhaCores');
  if (!grade || !cores || grade.children.length) return;

  grade.innerHTML = FUNDOS.map((f) => `
    <label class="opcao-fundo">
      <input type="radio" name="estiloFundo" value="${esc(f.id)}">
      <span class="fundo-mini" data-estilo="${esc(f.id)}"><span class="fundo"></span></span>
      <span class="marca" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
      <span class="rotulo">${esc(f.nome)}</span>
    </label>
  `).join('');

  cores.innerHTML = PALETAS.map((p) => `
    <label class="opcao-cor">
      <input type="radio" name="corFundo" value="${esc(p.id)}" aria-label="${esc(p.nome)}">
      <span class="cor-bolinha" style="background:${esc(p.cor)}" title="${esc(p.nome)}"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
    </label>
  `).join('');

  grade.querySelectorAll('.fundo-mini').forEach((mini) => {
    montarFundo(mini.querySelector('.fundo'), mini.dataset.estilo, fundoEscolhido.paleta);
  });

  iniciarBotaoMaisFundos(grade);

  grade.addEventListener('change', (e) => {
    if (e.target.name !== 'estiloFundo') return;
    fundoEscolhido.estilo = e.target.value;
    atualizarFundoAdmin();
  });
  cores.addEventListener('change', (e) => {
    if (e.target.name !== 'corFundo') return;
    fundoEscolhido.paleta = e.target.value;
    atualizarFundoAdmin();
  });
}

/* "Ver mais fundos": mostra só os primeiros estilos; o botão abre o resto (como a galeria do site) */
let fundosAbertos = false;

function mostrarMaisFundos(abrir, animar) {
  const grade = $('gradeEstilos');
  const botao = $('btnMaisFundos');
  if (!grade || !botao) return;
  fundosAbertos = abrir;
  grade.classList.toggle('recolhida', !abrir);
  botao.classList.toggle('aberto', abrir);
  botao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  const extras = Math.max(0, FUNDOS.length - FUNDOS_VISIVEIS);
  $('btnMaisFundosTxt').textContent = abrir ? 'Ver menos fundos' : `Ver mais fundos (${extras})`;
  grade.querySelectorAll('.opcao-fundo').forEach((el, i) => {
    el.classList.remove('entra');
    if (abrir && animar && i >= FUNDOS_VISIVEIS) {
      el.style.setProperty('--i', i - FUNDOS_VISIVEIS);
      void el.offsetWidth;
      el.classList.add('entra');
    }
  });
}

function iniciarBotaoMaisFundos(grade) {
  const botao = $('btnMaisFundos');
  if (!botao) return;
  if (FUNDOS.length <= FUNDOS_VISIVEIS) { botao.classList.add('hidden'); return; }
  mostrarMaisFundos(false, false);
  botao.addEventListener('click', () => {
    mostrarMaisFundos(!fundosAbertos, true);
    // ao recolher, volta para o começo do cartão para não se perder
    if (!fundosAbertos) {
      const cartao = $('cartaoFundo');
      if (cartao) cartao.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function atualizarFundoAdmin() {
  if (!FUNDOS_OK) return;
  const grade = $('gradeEstilos');
  const cores = $('linhaCores');
  if (!grade || !cores) return;

  grade.querySelectorAll('input').forEach((i) => { i.checked = i.value === fundoEscolhido.estilo; });
  cores.querySelectorAll('input').forEach((i) => { i.checked = i.value === fundoEscolhido.paleta; });

  // Miniaturas: mostram a cor escolhida; só a selecionada se mexe
  grade.querySelectorAll('.fundo-mini').forEach((mini) => {
    trocarPaleta(mini.querySelector('.fundo'), fundoEscolhido.paleta);
    mini.classList.toggle('rodando', mini.dataset.estilo === fundoEscolhido.estilo);
  });

  const previa = $('fundoPrevia');
  if (previa) {
    let caixa = previa.querySelector('.fundo');
    if (!caixa) { caixa = document.createElement('div'); previa.appendChild(caixa); }
    montarFundo(caixa, fundoEscolhido.estilo, fundoEscolhido.paleta);
  }
  const nota = $('fundoNota');
  if (nota) nota.hidden = fundoEscolhido.estilo !== 'particulas';
}

async function carregarFormFundo() {
  if (!FUNDOS_OK) { avisoFundosAusentes(); return; }
  desenharOpcoesFundo();
  const c = await lerSiteData('tema');
  fundoEscolhido = fundoValido(c);
  const pos = FUNDOS.findIndex((f) => f.id === fundoEscolhido.estilo);
  if (pos >= FUNDOS_VISIVEIS) mostrarMaisFundos(true, false);   // o fundo em uso precisa estar visível
  atualizarFundoAdmin();
}

const btnSalvarFundo = $('btnSalvarFundo');
if (btnSalvarFundo) {
  btnSalvarFundo.addEventListener('click', async () => {
    btnSalvarFundo.disabled = true;
    msg('msgFundo', 'Salvando...');
    const { error } = await salvarSiteData('tema', { estilo: fundoEscolhido.estilo, paleta: fundoEscolhido.paleta });
    btnSalvarFundo.disabled = false;
    if (error) {
      console.error('Erro ao salvar fundo:', error);
      msg('msgFundo', 'Erro ao salvar: ' + error.message, 'erro');
    } else {
      msg('msgFundo', 'Fundo publicado! Quem já está no site vê a mudança ao recarregar.', 'ok');
    }
  });
}

desenharOpcoesFundo();
