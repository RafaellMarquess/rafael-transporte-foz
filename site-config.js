/* ==========================================================================
   CONFIGURAÇÃO DESTE SITE (única coisa que muda de cliente para cliente,
   além do supabase-config.js e das linhas marcadas no <head> do index.html)
   ========================================================================== */
const SITE_CONFIG = {
  // Endereço final do site (sem barra no fim não faz diferença)
  siteUrl: 'https://rafael-transporte-foz.netlify.app/',

  // Nome curto do site no Disqus (comentários). Deixe '' para esconder a seção.
  disqusShortname: 'https-rafael-transporte-foz-netlify-app',

  // Fundo inicial do site (depois o painel, em Perfil > Fundo animado, passa a mandar).
  // estilo: particulas, aurora, ondas, gradiente, estrelas, bolhas, cataratas, grade, pordosol, raios, pulso, liso
  // paleta: azul, verde, laranja, roxo, rosa, ciano
  fundoPadrao: { estilo: 'particulas', paleta: 'azul' },

  // Valores iniciais do perfil. Depois de salvar a aba "Perfil" no painel,
  // os valores salvos na nuvem passam a valer no lugar destes.
  perfilPadrao: {
    nome: 'Rafael Moura Marques',
    subtitulo: 'Motorista Particular & Transfers Profissionais',
    modelo: 'Chevrolet Onix Sedan',
    capacidade: 4,
    base: 'Foz do Iguaçu e Tríplice Fronteira',
    seguranca: 'Veículo Higienizado & Revisado',
    whatsapp: '5545999425652',
    pix: '',
    fotoMotorista: 'fotos/IMG_20251227_090827.jpg',
    fotoVeiculo: 'fotos/carro.jpg'
  }
};
