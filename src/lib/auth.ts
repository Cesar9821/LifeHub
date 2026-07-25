import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Devuelve el usuario autenticado o redirige a /login.
 * Usar en Server Components / Server Actions.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  return user;
}

/**
 * Devuelve el household_id activo del usuario actual.
 * Por ahora tomamos el primer (y normalmente único) hogar del usuario.
 * Redirige a /login si no hay sesión.
 */
/**
 * Devuelve el household_id activo del usuario actual.
 * Toma el hogar MÁS RECIENTE al que fue agregado: si a alguien lo invitan a un
 * hogar compartido, ese debe primar sobre el hogar propio que se le creó al
 * registrarse.
 * Redirige a /login si no hay sesión.
 */
export async function getActiveHouseholdId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, role, joined_at')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // El trigger de la DB debería haber creado un hogar al registrarse.
    // Si no existe, algo salió mal en el setup.
    throw new Error(
      'No se encontró un hogar para este usuario. Revisa que el schema.sql se haya ejecutado en Supabase.'
    );
  }

  return data.household_id;
}

/**
 * Contexto completo: usuario + household. Útil cuando necesitas ambos.
 */
export async function getContext() {
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  return { user, householdId };
}
