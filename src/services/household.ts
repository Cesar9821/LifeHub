import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export interface HouseholdMember {
  user_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'member';
  joined_at: string;
  is_me: boolean;
}

/** Miembros del hogar activo del usuario actual. */
export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  const supabase = await createClient();
  await requireUser();

  const { data, error } = await supabase.rpc('get_household_members');

  if (error) {
    console.error('Error cargando miembros:', error.message);
    return [];
  }
  return (data as HouseholdMember[]) || [];
}

/** Nombre del hogar activo. */
export async function getHouseholdName(): Promise<string> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data } = await supabase
    .from('household_members')
    .select('household_id, households(name)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const households = data?.households as unknown as { name?: string } | null;
  return households?.name || 'Mi Hogar';
}

/** ¿El usuario actual es dueño del hogar? */
export async function isHouseholdOwner(): Promise<boolean> {
  const members = await getHouseholdMembers();
  const me = members.find((m) => m.is_me);
  return me?.role === 'owner';
}
