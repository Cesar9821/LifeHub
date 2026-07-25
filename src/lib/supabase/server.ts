import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // En Next.js 15, cookies() devuelve una Promesa, por eso usamos await
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // Sesión de larga duración: la cookie no caduca por tiempo.
                // Supabase refresca el token en cada visita, así la sesión
                // se mantiene viva mientras uses la app en este dispositivo.
                maxAge: 60 * 60 * 24 * 365, // 1 año
              })
            );
          } catch {
            // El middleware se encargará de esto si falla en un Server Component
          }
        },
      },
    }
  );
}