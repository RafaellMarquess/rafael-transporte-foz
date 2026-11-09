/* ==========================================================================
   CONFIGURAÇÃO DO SUPABASE
   --------------------------------------------------------------------------
   A chave abaixo é a "publishable" (pública). Ela pode ficar no código.
   NUNCA coloque aqui a chave "secret" ou "service_role".
   ========================================================================== */
const SUPABASE_URL = 'https://dmmabgzqqkmswbcoaqxi.supabase.co';
const SUPABASE_KEY = 'sb_publishable__RBh0LVjQWia8G3JoVDkmA_Pz75x6a_';
const SUPABASE_BUCKET = 'galeria';

/* A legenda da foto é guardada dentro do nome do arquivo (em base64 seguro),
   no formato: 1730000000000_ab12__LEGENDA.jpg */
function legendaParaNome(legenda) {
  if (!legenda) return '';
  const bytes = new TextEncoder().encode(legenda.trim().slice(0, 60));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return '__' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function nomeParaLegenda(nome) {
  try {
    const base = nome.replace(/\.[^.]+$/, '');
    const i = base.indexOf('__');
    if (i === -1) return '';
    let b64 = base.slice(i + 2).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return '';
  }
}

function urlPublicaFoto(nome) {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(nome)}`;
}
