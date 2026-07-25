import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con SERVICE ROLE: salta RLS.
 * SOLO debe usarse en el servidor (cron / route handlers), nunca en el cliente.
 * Requiere SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin.'
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
