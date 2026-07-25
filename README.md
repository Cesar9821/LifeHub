# LifeHub

Sistema personal de gestión de vida, organizado en un **hub** de módulos. La visión son **4 pilares**:

| Pilar | Estado | Qué cubre |
|-------|--------|-----------|
| **Finanzas** | ✅ Activo | Movimientos, planificación mensual, ahorros y créditos |
| **Mentalidad** | ✅ Activo | Hábitos diarios, rutina, ánimo, sueño y energía |
| **Metas** | ✅ Activo | Objetivos personales con hitos y seguimiento de progreso |
| **Familia** | 🔜 En construcción | Tareas del hogar, calendario compartido, compras y despensa |

> Salud vive dentro de **Mentalidad** (ánimo/sueño/energía) y Hogar dentro de **Familia** (compras/despensa), por eso no son módulos aparte.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** (Postgres con Row Level Security) para datos y auth (`@supabase/ssr`)
- **Tailwind CSS v4**
- **Recharts** para gráficos · **date-fns** · **lucide-react**

## Modelo de datos

Multi-tenant por **hogares** (`households`): cada dato cuelga de un `household_id` y las políticas RLS garantizan que solo los miembros de un hogar ven/editan sus filas. Los datos de Mentalidad son personales por usuario (`user_id`).

El módulo de finanzas se apoya en dos tablas centrales:

- `recurring_items` — plantillas de ingresos/gastos fijos (se definen una vez).
- `movements` — lo que ocurre cada mes (pendiente → confirmado, más movimientos variables). **El saldo real solo cuenta movimientos confirmados.** Un trigger refleja cada confirmación en `transactions`.

Los archivos SQL están en [`supabase/`](supabase/) y se ejecutan en orden en el SQL Editor de Supabase:

1. `schema.sql` — base (hogares, perfiles, RLS, categorías seed)
2. `schema-movements.sql` — movimientos y recurrentes
3. `schema-household.sql` — invitaciones/miembros
4. `schema-mindset.sql` — módulo de Mentalidad (hábitos y registro diario)
5. `schema-metas.sql` — módulo de Metas (objetivos personales con hitos)

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
    hub/          Selector de módulos (los 4 pilares)
    finanzas/     Dashboard, movimientos, planificación, ahorros, créditos, ajustes
    mindset/      Mentalidad: hábitos y registro diario
    metas/        Metas: objetivos personales con hitos
    (familia)/    Por construir
  services/       Acceso a datos (Supabase)
  lib/            Auth, clientes Supabase, utilidades
  types/          Tipos compartidos
supabase/         Esquemas SQL
```
