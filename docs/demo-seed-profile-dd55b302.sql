-- Demo seed for public.controle_contas
-- Profile/user_id: dd55b302-b36f-4c70-88be-f383b0ea8810
-- Range: 2024-01 to 2026-03
-- Behavior:
-- - removes existing rows only for this demo profile
-- - inserts the fresh fictitious base below
-- Purpose:
-- - exercise monthly flow
-- - exercise period reports
-- - exercise dashboard and long-period charts
-- - keep links populated for boleto/comprovante previews

begin;

delete from public.controle_contas
where user_id = 'dd55b302-b36f-4c70-88be-f383b0ea8810';

with config as (
  select
    'dd55b302-b36f-4c70-88be-f383b0ea8810'::uuid as demo_user,
    'https://1drv.ms/b/c/74F840D6BC94BA1A/IQCsDa_GvU4NSYGgj_B3NqYRAZKzUO1jSXcKdbqth3MN7ng?e=Nu3KIj'::text as boleto_link,
    'https://1drv.ms/b/c/74F840D6BC94BA1A/IQDQgx8P7d3oToOjaA_Cs9F7ASH9GmGrbRD3MlfOt5vGNmM?e=o68sca'::text as comprovante_link
),
meses as (
  select
    gs::date as ref,
    extract(year from gs)::bigint as ano,
    extract(month from gs)::bigint as mes,
    row_number() over (order by gs) - 1 as idx
  from generate_series(date '2024-01-01', date '2026-03-01', interval '1 month') as gs
),
lancamentos as (
  select
    m.ano,
    m.mes,
    'Aluguel'::text as nome_da_conta,
    round((
      2850
      + case when m.ano >= 2025 then 120 else 0 end
      + case when m.ano >= 2026 then 140 else 0 end
    )::numeric, 2) as valor,
    (m.ref + interval '4 day')::date as data_de_pagamento,
    'Apto 302'::text as instancia,
    case (m.idx % 3) when 0 then 'Ana' when 1 then 'Bruno' else 'Carla' end as quem_pagou,
    true as dividida
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Condominio',
    round((
      690
      + ((m.ano - 2024) * 35)
      + case when m.mes in (1, 2) then 25 when m.mes in (7, 8) then 12 else 0 end
      + ((m.idx % 4) * 6)
    )::numeric, 2),
    (m.ref + interval '9 day')::date,
    'Residencial Aurora',
    case ((m.idx + 1) % 3) when 0 then 'Ana' when 1 then 'Bruno' else 'Carla' end,
    true
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Luz',
    round((
      ((230 + ((m.ano - 2024) * 18))::numeric)
      * case
          when m.mes in (12, 1, 2) then 1.35
          when m.mes in (6, 7, 8) then 0.92
          else 1.05
        end
      + ((m.idx % 3) * 9)
    )::numeric, 2),
    (m.ref + interval '13 day')::date,
    'Unidade principal',
    case ((m.idx + 2) % 3) when 0 then 'Ana' when 1 then 'Bruno' else 'Carla' end,
    true
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Agua',
    round((
      ((132 + ((m.ano - 2024) * 11))::numeric)
      * case
          when m.mes in (12, 1, 2) then 1.18
          when m.mes in (6, 7, 8) then 0.95
          else 1.04
        end
      + ((m.idx % 2) * 4)
    )::numeric, 2),
    (m.ref + interval '15 day')::date,
    'Abastecimento',
    case (m.idx % 3) when 0 then 'Carla' when 1 then 'Ana' else 'Bruno' end,
    true
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Internet',
    round((
      139.90
      + case when m.ref >= date '2025-07-01' then 10 else 0 end
      + case when m.ref >= date '2026-01-01' then 8 else 0 end
    )::numeric, 2),
    (m.ref + interval '11 day')::date,
    'Fibra 600 Mb',
    case ((m.idx + 1) % 3) when 0 then 'Carla' when 1 then 'Ana' else 'Bruno' end,
    true
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Celular',
    round((
      89.90
      + case when m.ano >= 2025 then 5 else 0 end
      + case when m.ano >= 2026 then 5 else 0 end
      + case when m.mes = 12 then 3 else 0 end
    )::numeric, 2),
    (m.ref + interval '7 day')::date,
    'Plano familia',
    'Ana',
    false
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Escola',
    round((
      1890
      + ((m.ano - 2024) * 150)
      + case when m.mes in (2, 3) then 40 else 0 end
    )::numeric, 2),
    (m.ref + interval '6 day')::date,
    'Mensalidade',
    'Carla',
    false
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Plano de saude',
    round((
      1250
      + ((m.ano - 2024) * 110)
      + case when m.mes = 7 then 35 else 0 end
    )::numeric, 2),
    (m.ref + interval '8 day')::date,
    'Plano familiar',
    'Bruno',
    false
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Cartao de credito',
    round((
      2100
      + ((m.ano - 2024) * 130)
      + case
          when m.mes in (12, 1) then 550
          when m.mes in (3, 7) then 220
          when m.mes = 10 then 330
          else 0
        end
      + ((m.idx % 5) * 90)
    )::numeric, 2),
    (m.ref + interval '21 day')::date,
    'Fatura principal',
    'Ana',
    false
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'Empregada',
    round((
      1450
      + ((m.ano - 2024) * 130)
      + case when m.mes = 12 then 700 when m.mes in (1, 7) then 120 else 0 end
    )::numeric, 2),
    (m.ref + interval '24 day')::date,
    'Mensalista',
    case ((m.idx + 2) % 3) when 0 then 'Ana' when 1 then 'Bruno' else 'Carla' end,
    true
  from meses m

  union all

  select
    m.ano,
    m.mes,
    'IPTU',
    round((1450 + ((m.ano - 2024) * 120))::numeric, 2),
    (m.ref + interval '18 day')::date,
    'Parcela unica',
    'Ana',
    true
  from meses m
  where m.mes = 1

  union all

  select
    m.ano,
    m.mes,
    'IPVA',
    round((980 + ((m.ano - 2024) * 130))::numeric, 2),
    (m.ref + interval '10 day')::date,
    'Parcela unica',
    'Bruno',
    false
  from meses m
  where m.mes = 2

  union all

  select
    m.ano,
    m.mes,
    'Seguro auto',
    round((1800 + ((m.ano - 2024) * 160))::numeric, 2),
    (m.ref + interval '17 day')::date,
    'Apolice anual',
    'Bruno',
    false
  from meses m
  where m.mes = 7

  union all

  select
    m.ano,
    m.mes,
    'Material escolar',
    round((1250 + ((m.ano - 2024) * 120))::numeric, 2),
    (m.ref + interval '5 day')::date,
    'Kit anual',
    'Carla',
    false
  from meses m
  where m.mes = 1

  union all

  select
    m.ano,
    m.mes,
    'Licenciamento',
    round((210 + ((m.ano - 2024) * 25))::numeric, 2),
    (m.ref + interval '19 day')::date,
    'Taxa anual',
    'Bruno',
    false
  from meses m
  where m.mes = 9
)
insert into public.controle_contas (
  ano,
  mes,
  nome_da_conta,
  valor,
  data_de_pagamento,
  instancia,
  quem_pagou,
  dividida,
  link_boleto,
  link_comprovante,
  user_id
)
select
  l.ano,
  l.mes,
  l.nome_da_conta,
  l.valor,
  l.data_de_pagamento,
  l.instancia,
  l.quem_pagou,
  l.dividida,
  c.boleto_link,
  c.comprovante_link,
  c.demo_user
from lancamentos l
cross join config c
order by l.ano, l.mes, l.data_de_pagamento, l.nome_da_conta;

commit;

-- Quick checks:
-- select ano, mes, count(*) as linhas, sum(valor) as total
-- from public.controle_contas
-- where user_id = 'dd55b302-b36f-4c70-88be-f383b0ea8810'
-- group by ano, mes
-- order by ano, mes;
