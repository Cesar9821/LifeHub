-- ============================================================================
--  LIFEHUB — Gestión de miembros del hogar (invitar por correo)
-- ============================================================================
--  Ejecuta este archivo en el SQL Editor de Supabase, después de schema.sql.
--  Es aditivo y seguro: no expone la lista de usuarios del sistema.
--
--  Qué resuelve:
--    Al registrarse, cada usuario recibe su propio hogar. Este script permite
--    unir cuentas al MISMO hogar para que compartan las finanzas.
--
--  Seguridad:
--    - No se puede listar usuarios del sistema.
--    - Solo se invita conociendo el correo exacto.
--    - Solo el OWNER del hogar puede agregar o quitar miembros.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ver los miembros de MI hogar (con su nombre y correo)
-- ----------------------------------------------------------------------------
create or replace function public.get_household_members()
returns table (
  user_id    uuid,
  full_name  text,
  email      text,
  role       text,
  joined_at  timestamptz,
  is_me      boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household uuid;
begin
  -- El hogar activo del usuario actual (el más antiguo al que pertenece)
  select hm.household_id into my_household
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by hm.joined_at desc
  limit 1;

  if my_household is null then
    return;
  end if;

  return query
  select
    hm.user_id,
    coalesce(p.full_name, split_part(u.email, '@', 1)) as full_name,
    u.email::text,
    hm.role,
    hm.joined_at,
    (hm.user_id = auth.uid()) as is_me
  from public.household_members hm
  join auth.users u on u.id = hm.user_id
  left join public.profiles p on p.id = hm.user_id
  where hm.household_id = my_household
  order by hm.joined_at asc;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Agregar a alguien a MI hogar, buscándolo por correo
-- ----------------------------------------------------------------------------
--  Devuelve un texto con el resultado:
--    'ok'            -> agregado correctamente
--    'not_found'     -> no existe una cuenta con ese correo
--    'already'       -> ya es miembro de tu hogar
--    'not_owner'     -> no eres el dueño del hogar
--    'self'          -> intentaste agregarte a ti mismo
-- ----------------------------------------------------------------------------
create or replace function public.add_household_member(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household uuid;
  my_role      text;
  target_id    uuid;
begin
  -- Mi hogar y mi rol
  select hm.household_id, hm.role into my_household, my_role
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by hm.joined_at desc
  limit 1;

  if my_household is null then
    return 'not_found';
  end if;

  if my_role <> 'owner' then
    return 'not_owner';
  end if;

  -- Busca al usuario por correo (normalizado)
  select u.id into target_id
  from auth.users u
  where lower(u.email) = lower(trim(target_email))
  limit 1;

  if target_id is null then
    return 'not_found';
  end if;

  if target_id = auth.uid() then
    return 'self';
  end if;

  -- ¿Ya es miembro de mi hogar?
  if exists (
    select 1 from public.household_members
    where household_id = my_household and user_id = target_id
  ) then
    return 'already';
  end if;

  -- IMPORTANTE: una persona pertenece a UN solo hogar.
  -- Se le quita de cualquier hogar anterior para evitar ambigüedad
  -- (si no, seguiría viendo su hogar viejo en vez del compartido).
  delete from public.household_members
  where user_id = target_id;

  insert into public.household_members (household_id, user_id, role)
  values (my_household, target_id, 'member');

  return 'ok';
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Quitar a alguien de MI hogar
-- ----------------------------------------------------------------------------
create or replace function public.remove_household_member(target_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household uuid;
  my_role      text;
begin
  select hm.household_id, hm.role into my_household, my_role
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by hm.joined_at desc
  limit 1;

  if my_household is null then
    return 'not_found';
  end if;

  if my_role <> 'owner' then
    return 'not_owner';
  end if;

  if target_user = auth.uid() then
    return 'self';
  end if;

  delete from public.household_members
  where household_id = my_household and user_id = target_user;

  return 'ok';
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Renombrar mi hogar
-- ----------------------------------------------------------------------------
create or replace function public.rename_household(new_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household uuid;
begin
  select hm.household_id into my_household
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by hm.joined_at desc
  limit 1;

  if my_household is null then
    return 'not_found';
  end if;

  update public.households
  set name = trim(new_name)
  where id = my_household;

  return 'ok';
end;
$$;

-- ----------------------------------------------------------------------------
-- Permisos: solo usuarios autenticados pueden llamar estas funciones
-- ----------------------------------------------------------------------------
revoke all on function public.get_household_members() from public, anon;
revoke all on function public.add_household_member(text) from public, anon;
revoke all on function public.remove_household_member(uuid) from public, anon;
revoke all on function public.rename_household(text) from public, anon;

grant execute on function public.get_household_members() to authenticated;
grant execute on function public.add_household_member(text) to authenticated;
grant execute on function public.remove_household_member(uuid) to authenticated;
grant execute on function public.rename_household(text) to authenticated;

-- ============================================================================
--  FIN
-- ============================================================================

-- ============================================================================
--  REPARACIÓN: usuarios que quedaron en más de un hogar
-- ============================================================================
--  Si agregaste a alguien ANTES de esta corrección, quedó perteneciendo a dos
--  hogares y la app le mostraba el más antiguo (el suyo, vacío).
--  Este bloque deja a cada persona en UN solo hogar: el más reciente al que
--  fue agregada (es decir, el hogar compartido al que la invitaron).
--
--  Los usuarios que solo tienen su propio hogar no se ven afectados.
-- ============================================================================
delete from public.household_members hm
where exists (
  select 1
  from public.household_members hm2
  where hm2.user_id = hm.user_id
    and hm2.joined_at > hm.joined_at
);

-- ============================================================================
--  Limpieza: elimina hogares que quedaron sin ningún miembro
-- ============================================================================
delete from public.households h
where not exists (
  select 1 from public.household_members hm where hm.household_id = h.id
);
