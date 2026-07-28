-- ============================================================================
--  LIFEHUB — Fix: revertir un movimiento confirmado fallaba
-- ============================================================================
--  Causa: el trigger BEFORE UPDATE borraba la transacción, y la FK
--  movements.transaction_id (ON DELETE SET NULL) intentaba actualizar la MISMA
--  fila en medio del update → error "tuple concurrently updated".
--  Solución: el trigger BEFORE solo pone los campos en null; un trigger AFTER
--  hace el borrado de la transacción (cuando la fila ya no está en update).
--
--  Ejecuta este archivo en el SQL Editor de Supabase. Es idempotente.
-- ============================================================================

create or replace function public.sync_movement_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signed_amount numeric;
  tx_id uuid;
begin
  -- CONFIRMAR: pending -> confirmed (crea la transacción)
  if (new.status = 'confirmed' and (old.status is distinct from 'confirmed')) then
    signed_amount := case when new.kind = 'expense'
                          then -abs(coalesce(new.actual_amount, new.estimated_amount))
                          else  abs(coalesce(new.actual_amount, new.estimated_amount))
                     end;

    insert into public.transactions
      (household_id, created_by, description, amount, type, category, destination, created_at)
    values
      (new.household_id, new.created_by, new.description, signed_amount,
       new.kind, new.category, 'normal', coalesce(new.confirmed_at, now()))
    returning id into tx_id;

    new.transaction_id := tx_id;

  -- REVERTIR: confirmed -> pending (solo limpia campos; el borrado va en AFTER)
  elsif (new.status = 'pending' and old.status = 'confirmed') then
    new.transaction_id := null;
    new.confirmed_at := null;
    new.actual_amount := null;
  end if;

  return new;
end;
$$;

-- Trigger AFTER: borra la transacción de un movimiento revertido, ya sin conflicto.
create or replace function public.cleanup_reverted_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status = 'pending' and old.status = 'confirmed' and old.transaction_id is not null) then
    delete from public.transactions where id = old.transaction_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_movement_reverted on public.movements;
create trigger on_movement_reverted
  after update on public.movements
  for each row execute function public.cleanup_reverted_transaction();

-- ============================================================================
--  FIN
-- ============================================================================
