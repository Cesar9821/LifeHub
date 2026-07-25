-- ============================================================================
--  FINANZAS PRO — Esquema completo (modelo de HOGARES compartidos + RLS)
-- ============================================================================
--  Ejecutar este archivo COMPLETO en el SQL Editor de Supabase.
--  Es idempotente en lo posible: puedes re-ejecutarlo sin romper datos.
--
--  Modelo:
--    auth.users  ->  profiles            (1 perfil por usuario)
--    households                          (un "hogar" = bolsa compartida)
--    household_members                   (qué usuario pertenece a qué hogar)
--    transactions / savings / credits / fixed_expenses / categories
--        -> todos cuelgan de household_id
--
--  Regla de oro de seguridad (RLS):
--    "Puedes ver/editar una fila SOLO si eres miembro de su household."
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. HOGARES (households)
-- ----------------------------------------------------------------------------
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Mi Hogar',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. PERFILES (profiles) — datos públicos del usuario
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. MIEMBROS DEL HOGAR (household_members)
-- ----------------------------------------------------------------------------
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists idx_hm_user on public.household_members(user_id);

-- ----------------------------------------------------------------------------
-- Función helper: ¿de qué hogares es miembro el usuario actual?
--   SECURITY DEFINER evita recursión infinita en las políticas RLS.
-- ----------------------------------------------------------------------------
create or replace function public.user_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- 4. CATEGORÍAS (categories) — gestionables por el usuario
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  kind         text not null default 'expense' check (kind in ('income','expense')),
  color        text default '#6366f1',
  icon         text default 'Tag',
  created_at   timestamptz not null default now(),
  unique (household_id, name, kind)
);

create index if not exists idx_categories_household on public.categories(household_id);

-- ----------------------------------------------------------------------------
-- 5. AHORROS (savings)
-- ----------------------------------------------------------------------------
create table if not exists public.savings (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  name           text not null,
  target_amount  numeric not null default 0,
  current_amount numeric not null default 0,
  target_date    date,
  created_at     timestamptz not null default now()
);

create index if not exists idx_savings_household on public.savings(household_id);

-- ----------------------------------------------------------------------------
-- 6. CRÉDITOS (credits)
-- ----------------------------------------------------------------------------
create table if not exists public.credits (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households(id) on delete cascade,
  name               text not null,
  total_amount       numeric not null default 0,
  remaining_amount   numeric not null default 0,
  installment_value  numeric not null default 0,
  paid_installments  integer not null default 0,
  total_installments integer not null default 1,
  created_at         timestamptz not null default now()
);

create index if not exists idx_credits_household on public.credits(household_id);

-- ----------------------------------------------------------------------------
-- 7. GASTOS FIJOS (fixed_expenses)
-- ----------------------------------------------------------------------------
create table if not exists public.fixed_expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  description  text not null,
  amount       numeric not null default 0,
  due_day      integer check (due_day between 1 and 31),
  category     text default 'General',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists idx_fixed_household on public.fixed_expenses(household_id);

-- ----------------------------------------------------------------------------
-- 8. TRANSACCIONES (transactions)
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by   uuid references auth.users(id) on delete set null,
  description  text,
  amount       numeric not null default 0,
  type         text not null check (type in ('income','expense','transfer')),
  category     text default 'General',
  destination  text default 'normal',
  saving_id    uuid references public.savings(id) on delete set null,
  credit_id    uuid references public.credits(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_tx_household on public.transactions(household_id);
create index if not exists idx_tx_created_at on public.transactions(created_at);

-- ----------------------------------------------------------------------------
-- 9. PRESUPUESTOS (budgets) — límite mensual por categoría
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category     text not null,
  amount       numeric not null default 0,
  created_at   timestamptz not null default now(),
  unique (household_id, category)
);

create index if not exists idx_budgets_household on public.budgets(household_id);

-- ============================================================================
--  ROW LEVEL SECURITY
-- ============================================================================
alter table public.households        enable row level security;
alter table public.profiles          enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.savings           enable row level security;
alter table public.credits           enable row level security;
alter table public.fixed_expenses    enable row level security;
alter table public.transactions      enable row level security;
alter table public.budgets           enable row level security;

-- ---- PROFILES: cada quien ve/edita su propio perfil ------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---- HOUSEHOLDS: ves un hogar si eres miembro ------------------------------
drop policy if exists "households_select_member" on public.households;
create policy "households_select_member" on public.households
  for select using (id in (select public.user_household_ids()));

drop policy if exists "households_insert_self" on public.households;
create policy "households_insert_self" on public.households
  for insert with check (created_by = auth.uid());

drop policy if exists "households_update_member" on public.households;
create policy "households_update_member" on public.households
  for update using (id in (select public.user_household_ids()));

-- ---- HOUSEHOLD_MEMBERS -----------------------------------------------------
drop policy if exists "hm_select_member" on public.household_members;
create policy "hm_select_member" on public.household_members
  for select using (household_id in (select public.user_household_ids()));

-- Permite insertarse a sí mismo (usado por el trigger y las invitaciones)
drop policy if exists "hm_insert_self" on public.household_members;
create policy "hm_insert_self" on public.household_members
  for insert with check (user_id = auth.uid());

drop policy if exists "hm_delete_member" on public.household_members;
create policy "hm_delete_member" on public.household_members
  for delete using (household_id in (select public.user_household_ids()));

-- ---- Política genérica para tablas de datos del hogar ----------------------
-- (categories, savings, credits, fixed_expenses, transactions, budgets)
-- Un helper por tabla: SELECT/INSERT/UPDATE/DELETE si household_id es tuyo.

do $$
declare
  t text;
  tbls text[] := array['categories','savings','credits','fixed_expenses','transactions','budgets'];
begin
  foreach t in array tbls loop
    execute format('drop policy if exists "%s_all_member" on public.%I', t, t);
    execute format($f$
      create policy "%1$s_all_member" on public.%1$I
        for all
        using (household_id in (select public.user_household_ids()))
        with check (household_id in (select public.user_household_ids()))
    $f$, t);
  end loop;
end $$;

-- ============================================================================
--  TRIGGER: al crear un usuario nuevo -> perfil + hogar + membresía + seed
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  -- 1. Perfil
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  -- 2. Hogar propio
  insert into public.households (name, created_by)
  values ('Mi Hogar', new.id)
  returning id into new_household_id;

  -- 3. Membresía como owner
  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  -- 4. Categorías iniciales (seed)
  insert into public.categories (household_id, name, kind, icon) values
    (new_household_id, 'Sueldo',        'income',  'Wallet'),
    (new_household_id, 'Extra',         'income',  'Plus'),
    (new_household_id, 'Comida',        'expense', 'Utensils'),
    (new_household_id, 'Transporte',    'expense', 'Car'),
    (new_household_id, 'Hogar',         'expense', 'Home'),
    (new_household_id, 'Ocio',          'expense', 'Gamepad2'),
    (new_household_id, 'Salud',         'expense', 'HeartPulse'),
    (new_household_id, 'General',       'expense', 'Tag');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  FIN
-- ============================================================================
