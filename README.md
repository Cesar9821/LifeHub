# LifeHub

Sistema operativo personal y familiar, hecho para Chile. **No organiza información: organiza tu atención.**
Al abrirlo responde dos preguntas: *¿qué tengo que hacer hoy?* y *¿cómo está organizada mi semana?*

| Pestaña | Qué resuelve |
|---------|--------------|
| **Hoy** | Fecha, las 3 prioridades del día, la agenda, trabajo, hábitos, cómo va la plata y captura rápida |
| **Semana** | Lunes a domingo con rutinas, bloques, eventos del hogar y tareas; choques de horario y regla 70/30; planificar semana y revisión del domingo |
| **Trabajo** | Inmade: Hoy · 📌 Esperando · Pendientes, por categoría (Instalaciones, Logística…) |
| **Finanzas** | Plan del hogar: ¿cómo estamos?, ¿puedo gastar esto?, cuentas del mes, presupuesto, deuda CMR, movimientos, ahorros |
| **Más** | Capturas (bandeja), Hábitos, Proyectos (InnVolt), Hogar (compras, menú, eventos), Objetivos, Notificaciones, Perfil y hogar |

El botón **+** está en todas las pantallas: tarea, gasto, evento, idea o recordatorio en pocos toques.
Lo que no se clasifica cae en **Capturas** para ordenarlo después (Hoy · Esta semana · Más adelante · Delegar · Eliminar).

## Conceptos

- **Bloque**: algo que ocupa tiempo (06:00–07:00 Gym). Las **rutinas** son bloques que se repiten: se guardan como reglas y se expanden al vuelo (no se generan filas futuras). Se puede cambiar *solo este día*, *desde este día* o *toda la rutina*.
- **Tarea**: algo que hacer. Con fecha aparece en Hoy/Semana; **no** se vuelve bloque salvo que la agendes. Estados: Pendiente, Hoy, En curso, Esperando, Completado.
- **Objetivo**: lo que quieres lograr. Máximo 3 por semana (Semana) y 3 prioridades por día (Hoy; la base de datos lo garantiza).
- **Regla 70/30**: las rutinas son la base; lo que agregas encima no debería pasar del 70% del tiempo libre ni de la jornada de trabajo. Se avisa en palabras simples, sin alarmas.
- **Privacidad**: trabajo, proyectos, capturas y hábitos son privados por defecto; lo familiar se comparte con el hogar.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** (Postgres + Auth + Realtime, Row Level Security) vía `@supabase/ssr`
- **Tailwind CSS v4** con tokens de diseño en `src/app/globals.css`
- **Zod 4** · **Recharts 3** · **web-push** · **Vitest**

## Base de datos

Multi-tenant por **hogares**: cada dato cuelga de un `household_id` y las políticas RLS usan `user_household_ids()`.
Los archivos de `supabase/` se ejecutan **en este orden** en Supabase → SQL Editor (todos son aditivos y se pueden volver a correr):

1. `schema.sql` — base (hogares, perfiles, RLS)
2. `schema-movements.sql` y `schema-movements-fix.sql` — movimientos
3. `schema-household.sql` — miembros e invitaciones
4. `schema-mindset.sql`, `schema-mindset-369.sql`, `schema-mindset-v2.sql` — hábitos y registro diario
5. `schema-metas.sql`, `schema-metas-v2.sql`, `schema-metas-v3.sql` — metas (objetivos)
6. `schema-familia.sql` … `schema-familia-v5.sql` — hogar (tareas, compras, eventos, menú)
7. `schema-notifications.sql`, `schema-notifications-v2.sql` — avisos push
8. `schema-mercadopago.sql` — conexión Mercado Pago (opcional)
9. `schema-plan-hogar.sql`, `schema-plan-hogar-v2.sql` — plan financiero del hogar (ver [`PLAN-HOGAR.md`](PLAN-HOGAR.md))
10. **`20261005_lifehub_planning.sql`** — LifeHub 2.0: tareas, prioridades, rutinas, bloques, plan semanal y proyectos
11. **`20261005_habitos_hora_chile.sql`** — los hábitos usan la fecha de Chile (antes se cortaba a las 21:00)

Si falta el paso 10, Hoy/Semana/Trabajo muestran un aviso y el resto de la app sigue funcionando.

## PWA y notificaciones

PWA instalable en iPhone/Android con web push enviadas por un cron cada 30 min (GitHub Actions).
Incluye resumen diario, cuentas por pagar, saldo bajo, recordatorios y la revisión semanal del domingo.
Configuración en [`NOTIFICACIONES.md`](NOTIFICACIONES.md).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa las credenciales de Supabase
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest) |

CI (`.github/workflows/ci.yml`) corre lint, tests y build en cada push y pull request.

## Estructura

```
src/
  app/
    (app)/          Todo lo que requiere sesión, con un solo marco (navegación)
      hoy/          Centro de comando del día
      semana/       Vista semanal, rutinas, planificar, revisión
      trabajo/      Inmade
      finanzas/     Plan del hogar (no cambia su lógica)
      capturas/     Bandeja de entrada
      habitos/      Hábitos simples (+ mindset/: registro diario y La Forja)
      proyectos/    Proyectos personales
      familia/      Hogar: compras, menú, eventos, tareas compartidas
      metas/        Objetivos (antes Metas)
      tareas/       Acciones compartidas de tareas, capturas y prioridades
    api/            Cron de notificaciones, exportar CSV, Mercado Pago
  components/
    ui/             Kit base: Card, Sheet, Chip, EmptyState, Skeleton, ConfirmAction…
    planning/       Hoy/Semana/Trabajo: agenda, tareas, rutinas, prioridades
    finanzas/       Componentes de Finanzas
    shell/          Navegación (barra inferior y menú lateral)
  lib/
    planning/       Lógica pura con tests: fechas, recurrencia, conflictos, 70/30, tareas, hábitos
    plan/           Lógica financiera con tests: presupuesto, CMR, cuentas, ¿puedo gastar?
  services/         Lecturas de datos (Server Components, con cache())
supabase/           SQL (ver orden arriba)
```
