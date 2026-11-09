-- ============================================================================
-- BLINDAGEM DO BANCO  —  rode AGORA (1 vez; pode rodar de novo sem problema)
-- Supabase > SQL Editor > New query > cole tudo > Run.
--
-- O que faz:
--   1) APAGA TODAS as regras (policies) antigas de site_data, pedidos e das
--      fotos (storage), inclusive as que tenham outro nome e deixem qualquer
--      um escrever. Era isso que faltava: o script anterior só apagava as
--      regras pelo nome que ele mesmo criava.
--   2) Liga o RLS e TIRA do visitante (anon) o direito de escrever. Mesmo que
--      sobre alguma regra errada, o banco recusa antes (erro 401/403).
--   3) Recria só as regras certas: visitante lê o site e CRIA pedido;
--      somente o admin (seu e-mail) escreve.
--   4) No fim mostra uma tabela de conferência: tudo precisa estar "OK".
--
-- E-mail do admin: já preenchido abaixo (1 lugar só, na função eh_admin).
-- Clientes novos: troque pelo e-mail deles.
-- ============================================================================

-- 0) Quem é o admin ------------------------------------------------------------
create or replace function public.eh_admin()
returns boolean
language sql
stable
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('rafaelmarques0705@gmail.com'), false);
$$;

-- As tabelas precisam existir (criadas pelo supabase-instalacao.sql)
do $$
begin
  if to_regclass('public.site_data') is null then
    raise exception 'Tabela site_data não existe. Rode primeiro o supabase-instalacao.sql.';
  end if;
  if to_regclass('public.pedidos') is null then
    raise exception 'Tabela pedidos não existe. Rode primeiro o supabase-instalacao.sql.';
  end if;
end $$;

-- 1) Apaga TODAS as regras antigas (qualquer nome) ------------------------------
--    Em storage.objects isso vale para todos os buckets; este projeto só usa "galeria".
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where (schemaname = 'public'  and tablename in ('site_data', 'pedidos'))
       or (schemaname = 'storage' and tablename = 'objects')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 2) RLS ligado + permissões mínimas -------------------------------------------
alter table public.site_data enable row level security;
alter table public.pedidos   enable row level security;

revoke all on public.site_data from public, anon, authenticated;
revoke all on public.pedidos   from public, anon, authenticated;

grant select                         on public.site_data to anon;                  -- visitante só LÊ
grant select, insert, update, delete on public.site_data to authenticated;         -- (limitado ao admin pelas regras)

grant insert                         on public.pedidos to anon;                    -- visitante só CRIA pedido
grant select, insert, update, delete on public.pedidos to authenticated;           -- (limitado ao admin pelas regras)

-- 3) Regras certas --------------------------------------------------------------
-- site_data
create policy "site_data leitura publica" on public.site_data
  for select using (true);

create policy "site_data admin insere" on public.site_data
  for insert to authenticated with check (public.eh_admin());

create policy "site_data admin atualiza" on public.site_data
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "site_data admin apaga" on public.site_data
  for delete to authenticated using (public.eh_admin());

-- pedidos
create policy "pedidos visitante cria" on public.pedidos
  for insert to anon, authenticated with check (status = 'novo');

create policy "pedidos admin le" on public.pedidos
  for select to authenticated using (public.eh_admin());

create policy "pedidos admin atualiza" on public.pedidos
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "pedidos admin apaga" on public.pedidos
  for delete to authenticated using (public.eh_admin());

-- fotos (bucket "galeria", público para leitura)
insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do update set public = true;

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
