'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { failIf } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export type MemberActionState = { ok?: string; error?: string } | undefined;

const MESSAGES: Record<string, string> = {
  not_found: 'No existe una cuenta registrada con ese correo.',
  already: 'Esa persona ya es miembro de tu hogar.',
  not_owner: 'Solo el dueño del hogar puede gestionar miembros.',
  self: 'Ya eres miembro de este hogar.',
};

export async function addMember(
  _prev: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const supabase = await createClient();
  await requireUser();

  const email = String(formData.get('email') || '').trim();
  if (!email) return { error: 'Escribe un correo.' };

  const { data, error } = await supabase.rpc('add_household_member', {
    target_email: email,
  });

  if (error) {
    console.error('Error agregando miembro:', error.message);
    return { error: 'No se pudo agregar. Revisa que el schema esté ejecutado.' };
  }

  const result = String(data);
  if (result === 'ok') {
    revalidatePath('/finanzas/ajustes');
    return { ok: `${email} ahora forma parte de tu hogar.` };
  }

  return { error: MESSAGES[result] || 'No se pudo agregar a esa persona.' };
}

export async function removeMember(formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const userId = String(formData.get('user_id') || '');
  if (!userId) return;

  const { error } = await supabase.rpc('remove_household_member', {
    target_user: userId,
  });

  failIf(error, 'No se pudo quitar al miembro');
  revalidatePath('/finanzas/ajustes');
}

export async function renameHousehold(formData: FormData) {
  const supabase = await createClient();
  await requireUser();

  const name = String(formData.get('name') || '').trim();
  if (!name) return;

  const { error } = await supabase.rpc('rename_household', {
    new_name: name,
  });

  failIf(error, 'No se pudo renombrar el hogar');
  revalidatePath('/finanzas/ajustes');
}
