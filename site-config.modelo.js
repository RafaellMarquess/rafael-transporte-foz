/* ==========================================================================
   MODELO DE CONFIGURAÇÃO — copie para "site-config.js" e preencha para o cliente.
   ========================================================================== */
const SITE_CONFIG = {
  siteUrl: 'https://SEU-SITE.netlify.app/',

  // Deixe '' se o cliente não quiser a seção de comentários.
  disqusShortname: '',

  // Fundo inicial (o painel, em Perfil > Fundo animado, passa a mandar depois).
  fundoPadrao: { estilo: 'aurora', paleta: 'azul' },

  perfilPadrao: {
    nome: 'Nome do Motorista',
    subtitulo: 'Motorista Particular & Transfers Profissionais',
    modelo: 'Modelo do carro',
    capacidade: 4,
    base: 'Cidade e região de atendimento',
    seguranca: 'Veículo Higienizado & Revisado',
    whatsapp: '5545999999999',   // 55 + DDD + número, só dígitos
    pix: '',
    fotoMotorista: 'fotos/placeholder-motorista.svg',
    fotoVeiculo: 'fotos/placeholder-carro.svg'
  }
};
