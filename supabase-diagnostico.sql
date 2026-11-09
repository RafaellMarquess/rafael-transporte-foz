-- ============================================================================
-- DIAGNÓSTICO (só LÊ, não muda nada). Rode ANTES da blindagem para ver o problema.
-- Supabase > SQL Editor > New query > cole tudo > Run.
-- Linhas com "PERIGOSA" ou "DESLIGADO" são brechas: qualquer pessoa com a chave
-- pública do site consegue escrever por elas.
-- ============================================================================

select tipo, nome, detalhe from (
  select 1 as ordem, 'RLS'::text as tipo, c.relname::text as nome,
         case when c.relrowsecurity then 'ligado'
              else 'DESLIGADO  <<< qualquer um escreve' end as detalhe
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('site_data', 'pedidos')

  union all

  select 2, 'REGRA', tablename || '  /  ' || policyname,
         cmd || ' para ' || array_to_string(roles, ',')
         || case when roles && array['public', 'anon']::name[]
                  and ((tablename = 'pedidos' and cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL'))
                    or (tablename <> 'pedidos' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')))
                 then '   <<< PERIGOSA (visitante escreve)' else '' end
  from pg_policies
  where (schemaname = 'public' and tablename in ('site_data', 'pedidos'))
     or (schemaname = 'storage' and tablename = 'objects')

  union all

  select 3, 'PERMISSAO', 'visitante (anon) em ' || t,
         case when has_table_privilege('anon', t, 'UPDATE')
                or has_table_privilege('anon', t, 'DELETE')
                or (t = 'public.site_data' and has_table_privilege('anon', t, 'INSERT'))
                or (t = 'public.pedidos' and has_table_privilege('anon', t, 'SELECT'))
              then 'pode escrever/ler demais  <<< PERIGOSA (se o RLS falhar, está aberto)'
              else 'ok (mínimo necessário)' end
  from (values ('public.site_data'), ('public.pedidos')) as v(t)
) x
order by ordem, nome;
