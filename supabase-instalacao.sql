-- ============================================================================
-- INSTALAÇÃO COMPLETA DO BACKEND (rode UMA vez por cliente)
-- Supabase > SQL Editor > New query > cole tudo > Run.
--
-- ANTES DE RODAR: troque SEU_EMAIL_AQUI (1 lugar só, na função eh_admin,
-- logo abaixo) pelo e-mail que o cliente usa para entrar no painel.
--
-- Este arquivo SUBSTITUI supabase-site_data.sql, supabase-pedidos.sql e
-- supabase-seguranca.sql. Pode ser rodado de novo sem estragar nada.
-- ============================================================================

-- 1) Quem é o admin -----------------------------------------------------------
create or replace function public.eh_admin()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('SEU_EMAIL_AQUI'), false);
$$;

-- 2) Tabela site_data (destinos, aviso, faq, disponibilidade, perfil, depoimentos)
create table if not exists public.site_data (
  id text primary key,
  content jsonb,
  updated_at timestamptz default now()
);

alter table public.site_data enable row level security;

drop policy if exists "site_data leitura publica" on public.site_data;
drop policy if exists "site_data admin insere"    on public.site_data;
drop policy if exists "site_data admin atualiza"  on public.site_data;
drop policy if exists "site_data admin apaga"     on public.site_data;

create policy "site_data leitura publica" on public.site_data
  for select using (true);

create policy "site_data admin insere" on public.site_data
  for insert to authenticated with check (public.eh_admin());

create policy "site_data admin atualiza" on public.site_data
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "site_data admin apaga" on public.site_data
  for delete to authenticated using (public.eh_admin());

-- 3) Tabela pedidos ------------------------------------------------------------
--    Visitante só CRIA (status 'novo'); só o admin vê, altera e apaga.
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  trajeto text not null check (char_length(trajeto) <= 200),
  tipo text check (char_length(tipo) <= 120),
  data_viagem text check (char_length(data_viagem) <= 40),
  horario text check (char_length(horario) <= 40),
  passageiros text check (char_length(passageiros) <= 40),
  embarque text check (char_length(embarque) <= 200),
  valor numeric not null default 0 check (valor >= 0 and valor < 100000),
  status text not null default 'novo'
    check (status in ('novo', 'confirmado', 'concluido', 'cancelado'))
);

create index if not exists pedidos_created_at_idx on public.pedidos (created_at desc);

alter table public.pedidos enable row level security;

drop policy if exists "pedidos visitante cria" on public.pedidos;
drop policy if exists "pedidos admin le"       on public.pedidos;
drop policy if exists "pedidos admin atualiza" on public.pedidos;
drop policy if exists "pedidos admin apaga"    on public.pedidos;

create policy "pedidos visitante cria" on public.pedidos
  for insert to anon, authenticated with check (status = 'novo');

create policy "pedidos admin le" on public.pedidos
  for select to authenticated using (public.eh_admin());

create policy "pedidos admin atualiza" on public.pedidos
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "pedidos admin apaga" on public.pedidos
  for delete to authenticated using (public.eh_admin());

-- 3b) Idioma do pedido + anti-spam
-- ---------------------------------------------------------------------------
-- Idioma do cliente (pt/en/es) e proteção contra spam nos pedidos
-- ---------------------------------------------------------------------------
alter table public.pedidos add column if not exists idioma text;

alter table public.pedidos drop constraint if exists pedidos_idioma_check;
alter table public.pedidos add constraint pedidos_idioma_check
  check (idioma is null or idioma in ('pt', 'en', 'es'));

-- Limites (ajuste os números se quiser). O WhatsApp do cliente continua
-- funcionando mesmo quando o registro é recusado; só o REGISTRO no painel é barrado.
create or replace function public.limitar_pedidos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_por_minuto constant int := 5;    -- no site todo, por minuto
  max_por_hora   constant int := 40;   -- no site todo, por hora
  qtd int;
begin
  -- Você (admin logado) nunca é limitado.
  if public.eh_admin() then
    return new;
  end if;

  select count(*) into qtd from public.pedidos
   where created_at > now() - interval '1 minute';
  if qtd >= max_por_minuto then
    raise exception 'Muitos pedidos em pouco tempo. Tente novamente em instantes.' using errcode = 'P0001';
  end if;

  select count(*) into qtd from public.pedidos
   where created_at > now() - interval '1 hour';
  if qtd >= max_por_hora then
    raise exception 'Limite de pedidos por hora atingido.' using errcode = 'P0001';
  end if;

  -- Pedido idêntico nos últimos 10 minutos = repetido
  select count(*) into qtd from public.pedidos
   where created_at > now() - interval '10 minutes'
     and trajeto = new.trajeto
     and coalesce(data_viagem, '') = coalesce(new.data_viagem, '')
     and coalesce(horario, '')     = coalesce(new.horario, '')
     and coalesce(embarque, '')    = coalesce(new.embarque, '')
     and coalesce(tipo, '')        = coalesce(new.tipo, '');
  if qtd > 0 then
    raise exception 'Pedido repetido.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists pedidos_limite on public.pedidos;
create trigger pedidos_limite
  before insert on public.pedidos
  for each row execute function public.limitar_pedidos();

-- 4) Storage: bucket público "galeria" + regras ---------------------------------
insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do update set public = true;

drop policy if exists "galeria leitura publica" on storage.objects;
drop policy if exists "galeria admin envia"     on storage.objects;
drop policy if exists "galeria admin troca"     on storage.objects;
drop policy if exists "galeria admin apaga"     on storage.objects;

create policy "galeria leitura publica" on storage.objects
  for select using (bucket_id = 'galeria');

create policy "galeria admin envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'galeria' and public.eh_admin());

create policy "galeria admin troca" on storage.objects
  for update to authenticated
  using (bucket_id = 'galeria' and public.eh_admin())
  with check (bucket_id = 'galeria' and public.eh_admin());

create policy "galeria admin apaga" on storage.objects
  for delete to authenticated using (bucket_id = 'galeria' and public.eh_admin());

-- 5) BLINDAGEM: remove regras estranhas e tira escrita do visitante -----------
--    Apaga qualquer regra que NÃO seja uma das acima (ex.: "Enable all access"
--    criada por modelos antigos ou à mão). Sem isso, uma regra sobrando deixa
--    qualquer pessoa com a chave pública escrever no site.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where ((schemaname = 'public' and tablename in ('site_data', 'pedidos'))
        or (schemaname = 'storage' and tablename = 'objects'))
      and policyname not in (
        'site_data leitura publica', 'site_data admin insere', 'site_data admin atualiza', 'site_data admin apaga',
        'pedidos visitante cria', 'pedidos admin le', 'pedidos admin atualiza', 'pedidos admin apaga',
        'galeria leitura publica', 'galeria admin envia', 'galeria admin troca', 'galeria admin apaga')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.site_data enable row level security;
alter table public.pedidos   enable row level security;

revoke all on public.site_data from public, anon, authenticated;
revoke all on public.pedidos   from public, anon, authenticated;
grant select                         on public.site_data to anon;
grant select, insert, update, delete on public.site_data to authenticated;
grant insert                         on public.pedidos   to anon;
grant select, insert, update, delete on public.pedidos   to authenticated;

-- 4) CONFERÊNCIA: todas as linhas precisam dizer OK ------------------------------
select verificacao, resultado from (
  select 1 as ordem, 'RLS ligado em site_data' as verificacao,
         case when (select relrowsecurity from pg_class where oid = 'public.site_data'::regclass)
              then 'OK' else 'PROBLEMA' end as resultado
  union all
  select 2, 'RLS ligado em pedidos',
         case when (select relrowsecurity from pg_class where oid = 'public.pedidos'::regclass)
              then 'OK' else 'PROBLEMA' end
  union all
  select 3, 'Visitante NÃO consegue alterar/apagar/criar nada em site_data',
         case when has_table_privilege('anon', 'public.site_data', 'INSERT')
                or has_table_privilege('anon', 'public.site_data', 'UPDATE')
                or has_table_privilege('anon', 'public.site_data', 'DELETE')
              then 'PROBLEMA' else 'OK' end
  union all
  select 4, 'Visitante NÃO consegue ler, alterar ou apagar pedidos',
         case when has_table_privilege('anon', 'public.pedidos', 'SELECT')
                or has_table_privilege('anon', 'public.pedidos', 'UPDATE')
                or has_table_privilege('anon', 'public.pedidos', 'DELETE')
              then 'PROBLEMA' else 'OK' end
  union all
  select 5, 'Visitante consegue CRIAR pedido (o site precisa disso)',
         case when has_table_privilege('anon', 'public.pedidos', 'INSERT')
              then 'OK' else 'PROBLEMA' end
  union all
  select 6, 'Nenhuma regra libera escrita para visitante em site_data / fotos',
         case when (select count(*) from pg_policies
                    where ((schemaname = 'public' and tablename = 'site_data')
                        or (schemaname = 'storage' and tablename = 'objects'))
                      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
                      and roles && array['public', 'anon']::name[]) = 0
              then 'OK' else 'PROBLEMA' end
  union all
  select 7, 'Toda escrita em site_data / fotos exige o admin',
         case when (select count(*) from pg_policies
                    where ((schemaname = 'public' and tablename = 'site_data')
                        or (schemaname = 'storage' and tablename = 'objects'))
                      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
                      and coalesce(qual, '') || coalesce(with_check, '') not like '%eh_admin%') = 0
              then 'OK' else 'PROBLEMA' end
  union all
  select 8, 'Pedidos: só o admin lê/altera/apaga; visitante só cria',
         case when (select count(*) from pg_policies
                    where schemaname = 'public' and tablename = 'pedidos'
                      and cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL')
                      and coalesce(qual, '') || coalesce(with_check, '') not like '%eh_admin%') = 0
              then 'OK' else 'PROBLEMA' end
) conferencia
order by ordem;
