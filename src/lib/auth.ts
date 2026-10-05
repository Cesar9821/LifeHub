import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Devuelve el usuario autenticado o redirige a /login.
 * Usar en Server Components / Server Actions. Una sola consulta por request.
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  return user;
});

/**
 * Devuelve el household_id activo del usuario actual.
 * Toma el hogar MÁS RECIENTE al que fue agregado: si a alguien lo invitan a un
 * hogar compartido, ese debe primar sobre el hogar propio que se le creó al
 * registrarse.
 * Redirige a /login si no hay sesión. Una sola consulta por request.
 */
export const getActiveHouseholdId = cache(async (): Promise<string> => {
  const user = await requireUser();
  const supabase = await createClient();

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

  return data.household_id as string;
});

/**
 * Contexto completo: usuario + household. Útil cuando necesitas ambos.
 */
export async function getContext() {
  const user = await requireUser();
  const householdId = await getActiveHouseholdId();
  return { user, householdId };
}

/** Nombre de pila del usuario (perfil o correo). */
export const getFirstName = cache(async (): Promise<string> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const full = (data?.full_name as string | undefined) || user.email?.split('@')[0] || '';
  return full.trim().split(/\s+/)[0] ?? '';
});
