# Finanzas Pro

App de finanzas personales/familiares con módulos organizados en un **hub**. Módulos activos: **Finanzas** y **Mindset** (hábitos). Otros (Familia, Salud, Metas, Hogar) están planificados.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** (Postgres con Row Level Security) para datos y auth (`@supabase/ssr`)
- **Tailwind CSS v4**
- **Recharts** para gráficos · **date-fns** · **lucide-react**

## Modelo de datos

Multi-tenant por **hogares** (`households`): cada dato cuelga de un `household_id` y las políticas RLS garantizan que solo los miembros de un hogar ven/editan sus filas.

El módulo de finanzas se apoya en dos tablas centrales:

- `recurring_items` — plantillas de ingresos/gastos fijos (se definen una vez).
- `movements` — lo que ocurre cada mes (pendiente → confirmado, más movimientos variables). **El saldo real solo cuenta movimientos confirmados.** Un trigger refleja cada confirmación en `transactions`.

Los archivos SQL están en [`supabase/`](supabase/) y se ejecutan en orden en el SQL Editor de Supabase:

1. `schema.sql` — base (hogares, perfiles, RLS, categorías seed)
2. `schema-movements.sql` — movimientos y recurrentes
3. `schema-household.sql` — invitaciones/miembros
4. `schema-mindset.sql` — módulo de hábitos

## Puesta en marcha

```bash
npm install
```

Crea `.env.local` a partir de `.env.example` con las credenciales de tu proyecto Supabase (Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
```

Luego:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Estructura

```
src/
  app/            Rutas (App Router)
    finanzas/     Dashboard, movimientos, planificación, ahorros, créditos, ajustes
    mindset/      Hábitos y rutina
    hub/          Selector de módulos
  services/       Acceso a datos (Supabase)
  lib/            Auth, clientes Supabase, utilidades
  types/          Tipos compartidos
supabase/         Esquemas SQL
```
