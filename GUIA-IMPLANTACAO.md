# Guia de implantação — um site novo para um cliente

Modelo: **uma cópia por cliente**, cada uma com o seu próprio projeto Supabase
e o seu próprio site no Netlify. Assim os dados de um cliente nunca se misturam
com os de outro. Tempo médio: 30 a 45 minutos.

## 1. Criar o Supabase do cliente
1. Em supabase.com, crie um **projeto novo** (conta sua ou do cliente).
2. **Authentication > Sign In / Providers**: desative **"Allow new users to sign up"**.
3. **Authentication > Users > Add user**: crie o usuário com o e-mail do cliente
   e uma senha forte (marque "Auto Confirm"). Peça para ele trocar a senha depois.
4. Abra `supabase-instalacao.sql` (já inclui idioma do pedido e proteção contra spam), troque `SEU_EMAIL_AQUI` pelo e-mail do passo 3
   e rode no **SQL Editor**. Isso cria tabelas, regras de segurança e o bucket `galeria`.
5. Rode a consulta de conferência (final do arquivo) e confirme que não há regras
   permissivas sobrando.
6. **Project Settings > API**: copie a *Project URL* e a chave **publishable/anon**.
   **Nunca** use a chave `secret` / `service_role` no site.

## 2. Preparar os arquivos do site
1. Copie a pasta do projeto para uma pasta nova (`cliente-nome/`).
2. **supabase-config.js**: cole a URL e a chave publishable do passo 1.6.
3. **site-config.js**: copie de `site-config.modelo.js` e preencha: `siteUrl`,
   `disqusShortname` (ou deixe `''`), e o `perfilPadrao` (nome, carro, WhatsApp...).
4. **index.html**, no `<head>` (linhas marcadas "POR CLIENTE"): `title`,
   `description`, `canonical` e as linhas `og:` (nome, URL, imagem).
5. **App instalável (PWA)**: em `manifest.webmanifest` troque `name` e `short_name` pelo nome do
   cliente; em `index.html` troque `apple-mobile-web-app-title`. Em `admin.webmanifest` e
   `admin.html` o nome "Painel" já serve. Os ícones estão em `icones/` (pode trocar por
   imagens do cliente, mantendo os mesmos nomes e tamanhos: 192, 512, maskable 512, apple 180).
6. **Idiomas**: o site já vem em Português, Inglês e Espanhol (`i18n.js`). Textos que o
   cliente digita no painel (nome dos destinos, descrições, FAQ, avisos) ficam no idioma em
   que foram escritos. Os destinos de exemplo e o FAQ de exemplo já têm tradução pronta.
7. Pasta `fotos/`: **apague as fotos pessoais do Rafael** (`IMG_20251227_090827.jpg`,
   `carro.jpg`) e use os placeholders de `fotos-modelo/` ou as fotos do cliente.
8. Não envie os arquivos `seed-rafael-*.sql` nem `supabase-*.sql` (incluindo `supabase-atualizacao-v2.sql`) para o site público.

## 3. Publicar no Netlify
1. Crie um site novo e arraste a pasta (ou conecte um repositório).
2. Anote o endereço final e coloque-o em `siteUrl` e no `canonical`/`og:url`; publique de novo.
3. Opcional: domínio próprio do cliente em *Domain settings*.

## 4. Preencher o painel (`/admin.html`)
Entre com o e-mail e a senha do cliente e preencha:
- **Perfil** (também tem o cartão **Fundo animado**: 26 estilos x 6 cores, com botão "Ver mais fundos", sem custo e sem SQL novo): nome, subtítulo, carro, capacidade, WhatsApp, link de avaliação do Google, fotos do motorista e do carro.
- **Destinos**: cadastre os destinos e preços (inclua o aeroporto, se existir), foto, destaque e ordem.
- **Conteúdo**: perguntas frequentes e depoimentos (com autorização de quem escreveu).
- **Fotos**: galeria do site. **Agenda**: dias bloqueados. **Pedidos**: acompanhe as solicitações.

## 5. Checklist de teste (no celular)
- [ ] Site abre, nome/fotos/WhatsApp do cliente aparecem (nada do Rafael).
- [ ] Calculadora gera a mensagem correta para o WhatsApp do cliente.
- [ ] Novo destino criado no painel aparece no site (recarregue).
- [ ] Aviso, FAQ e depoimentos aparecem após salvar.
- [ ] Dia bloqueado na Agenda impede o agendamento.
- [ ] Pedido feito no site aparece na aba Pedidos.
- [ ] Foto enviada no painel aparece na galeria (destinos/perfil não aparecem na galeria).
- [ ] Botões PT / EN / ES no topo trocam o idioma e voltam ao português sem sobrar texto misturado.
- [ ] Pedido feito com o site em inglês chega na aba Pedidos marcado "English", e o botão
      "Confirmar no WhatsApp" gera a mensagem em inglês.
- [ ] Ao concluir um pedido, aparece o botão "Pedir avaliação" com o link do Google.
- [ ] No celular, o painel oferece "Instalar" (Android) ou a dica de Compartilhar > Tela de Início (iPhone).
- [ ] Cadastro público desligado: tentar criar conta não funciona.
- [ ] Sem login, o painel não deixa salvar nada.

## 6. Entrega ao cliente
- Passe o endereço do site e do painel; oriente a **trocar a senha** e ativar **MFA**.
- Nunca peça nem guarde a senha do cliente.
- Combine quem paga o Supabase/Netlify (os planos gratuitos costumam bastar) e como serão as atualizações.

## Fundo animado
- O fundo inicial vem de `fundoPadrao` no `site-config.js` (opcional). Depois, o cliente escolhe
  estilo e cor no painel, em Perfil, e isso passa a valer. Os estilos ficam em `fundos.css`/`fundos.js` (`FUNDOS_VISIVEIS` define quantos aparecem antes de "Ver mais fundos").
- Para criar um estilo novo: adicione uma classe `.f-NOME` em `fundos.css` e uma linha em `FUNDOS` (`fundos.js`).
- Os fundos têm uma película escura calculada para o texto continuar legível; ao criar estilos
  claros, ajuste `--veu`.

## Atualizando um cliente que já está no ar (V2)
1. Rode `supabase-atualizacao-v2.sql` no SQL Editor **antes** de publicar os arquivos novos.
2. Publique os arquivos novos (inclua a pasta `icones/` e os arquivos `i18n.js`, `sw.js`,
   `manifest.webmanifest` e `admin.webmanifest`). Para o fundo animado, inclua também `fundos.css` e `fundos.js`.
3. No painel, aba Perfil, cadastre o link de avaliação do Google.

## Observações
- A chave publishable e o código do painel são visíveis por design; a proteção real
  vem das regras (RLS), do cadastro desligado e da senha forte + MFA.
- Visitantes anônimos podem criar pedidos (necessário ao site). O banco limita a 5 por minuto e
  40 por hora no site todo e recusa pedidos repetidos; os números ficam no topo da função
  `limitar_pedidos` e podem ser ajustados. O WhatsApp do cliente funciona mesmo se o registro for barrado.
- Os textos padrão de FAQ e destinos são de Foz do Iguaçu: ajuste para a região do cliente.

---

## Segurança do banco (OBRIGATÓRIO em todo cliente)

A chave pública (`sb_publishable_...`) aparece no código do site e qualquer pessoa pode copiá-la. O que protege os dados NÃO é esconder a chave, e sim as regras (RLS) do banco.

1. Rode o `supabase-instalacao.sql` (já inclui a blindagem: apaga regras estranhas e tira do visitante o direito de escrever).
2. A última tabela do resultado precisa ter **8 linhas "OK"**. Se alguma disser PROBLEMA, não entregue o site.
3. Em site já instalado/suspeito: rode primeiro o `supabase-diagnostico.sql` (só lê) e depois o `supabase-blindagem.sql`.
4. Teste de ataque (Burp/curl): um PATCH em `/rest/v1/site_data?id=eq.destinos` só com a chave pública deve dar **401/403** (nunca 204).
5. Supabase > Authentication > Sign In / Providers: **desligue "Allow new users to sign up"**. Senha forte e MFA no login do cliente.
6. Se houver suspeita de invasão: `select id, updated_at, left(content::text,120) from site_data order by updated_at desc;` e restaure o que estiver alterado pelo painel.

## Cabeçalhos de segurança (`_headers`)
- O arquivo `_headers` (na raiz, sem extensão) já vem com X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy e a **Content-Security-Policy em modo de teste** (`Content-Security-Policy-Report-Only`).
- Depois de publicar: abra o site e o `/admin.html` com o Console do navegador aberto (F12). Se NÃO aparecer
  nenhuma mensagem "Content Security Policy" (e o Disqus, se usado, carregar), troque no `_headers`
  `Content-Security-Policy-Report-Only` por `Content-Security-Policy` e publique de novo.
- Se usar outro serviço externo (outro CDN, mapa, vídeo), acrescente o endereço dele na regra correspondente.
- A CSP libera scripts inline (o site usa `onclick`), então ela limita DE ONDE vêm scripts e para onde os dados
  podem ser enviados, mas não impede script inline. Os textos vindos do banco já são escapados no código.
