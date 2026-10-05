'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AuthState = { error?: string } | undefined;

/** Solo rutas internas: evita redirigir a otro sitio con ?next=//… */
function safeNext(raw: FormDataEntryValue | null): string {
  const next = String(raw || '');
  return next.startsWith('/') && !next.startsWith('//') ? next : '/hoy';
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const next = safeNext(formData.get('next'));

  if (!email || !password) {
    return { error: 'Ingresa tu correo y contraseña.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' };
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get('full_name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!fullName || !email || !password) {
    return { error: 'Completa todos los campos.' };
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Ya existe una cuenta con este correo.' };
    }
    console.error('Error de registro:', error.message);
    return { error: 'No pudimos crear la cuenta. Inténtalo nuevamente.' };
  }

  revalidatePath('/', 'layout');
  redirect('/hoy');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
