-- ============================================================================
--  LIFEHUB — Familia v2: listas de compras (checklist recurrente)
-- ============================================================================
--  Ejecuta después de schema-familia.sql. Aditivo.
--
--  Modelo: varias LISTAS (Supermercado, Feria, …), cada una con un período de
--  reinicio. Al empezar un nuevo período, sus ítems se DESMARCAN (la lista es
--  recurrente: los productos quedan, vuelves a marcar lo que compras).
--    - monthly  → se reinicia cada mes
--    - weekly   → se reinicia cada semana (lunes)
--    - none     → no se reinicia solo
-- ============================================================================

create table if not exists public.shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  reset_period  text not null default 'none' check (reset_period in ('none','weekly','monthly')),
  last_reset_at date not null default current_date,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_shopping_lists_household on public.shopping_lists(household_id);

-- Vincula cada producto a una lista.
alter table public.shopping_items
  add column if not exists list_id uuid references public.shopping_lists(id) on delete cascade;

create index if not exists idx_shopping_items_list on public.shopping_items(list_id);

-- ============================================================================
--  RLS
-- ============================================================================
alter table public.shopping_lists enable row level security;

drop policy if exists "shopping_lists_all_member" on public.shopping_lists;
create policy "shopping_lists_all_member" on public.shopping_lists
  for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

-- ============================================================================
--  FIN
-- ============================================================================
