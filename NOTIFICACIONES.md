# LifeHub — PWA + Notificaciones (guía de configuración)

LifeHub es una **PWA**: se instala en el iPhone gratis (sin App Store) y puede
enviar **notificaciones push** con lo pendiente de tus 4 módulos.

## 1. Instalar en el iPhone (gratis)

1. Abre `https://tu-app.vercel.app` en **Safari** (tiene que ser Safari).
2. Toca **Compartir** (el cuadrito con la flecha) → **Agregar a inicio**.
3. Abre LifeHub desde el ícono nuevo. Ya funciona como app.

> iOS **solo permite notificaciones si la app está instalada** en la pantalla de
> inicio. Por eso el botón de activar aparece recién cuando la abres instalada.

## 2. Configurar las notificaciones (una sola vez)

### 2.1 Genera las claves VAPID

En tu compu, en la carpeta del proyecto:

```bash
npx web-push generate-vapid-keys
```

Te da una **Public Key** y una **Private Key**.

### 2.2 Corre el SQL

En Supabase → **SQL Editor**, ejecuta `supabase/schema-notifications.sql`
(crea `push_subscriptions` y `notification_prefs`).

### 2.3 Variables de entorno en Vercel

En Vercel → tu proyecto → **Settings → Environment Variables**, agrega
(para Production, Preview y Development):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | la Public Key de arriba |
| `VAPID_PRIVATE_KEY` | la Private Key de arriba |
| `VAPID_SUBJECT` | `mailto:tu-correo@ejemplo.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (¡secreta!) |
| `CRON_SECRET` | una cadena larga y aleatoria que inventes |

Vuelve a desplegar (Vercel → Deployments → Redeploy) para que tomen efecto.

> El `CRON_SECRET` protege el endpoint del cron. Vercel envía automáticamente
> `Authorization: Bearer <CRON_SECRET>` a los cron jobs cuando esa variable existe.

### 2.4 Activa en tu dispositivo

Abre LifeHub instalada → ícono de **campana** (arriba a la derecha del hub) →
**Activar notificaciones** → **Enviar prueba**. Si llega, quedó listo.

## 3. ¿Cuándo llegan y qué dicen?

Hay **tres franjas** al día. El **369 se recuerda en las tres**; los **pendientes
solo llegan mañana y noche** (para no saturar a media tarde):

- **Mañana** — `vercel.json`, 12:00 UTC ≈ 09:00 Chile (`?slot=morning`)
- **Tarde** — GitHub Actions, 17:00 UTC ≈ 14:00 Chile (`?slot=afternoon`, solo el 369)
- **Noche** — `vercel.json`, 00:00 UTC ≈ 21:00 Chile (`?slot=night`)

En cada envío, y **según qué módulos activaste**, recibes avisos **accionables**
(cada uno te lleva a su pantalla al tocarlo):

- 🔥 **La Forja**: recordatorio de escribir tu **369** de la franja (mañana 3× /
  noche 9×), con la frase del día. → abre `/mindset/forja`.
- 💰 **Finanzas**: pagos por confirmar. → abre Movimientos.
- 🧠 **Mentalidad**: hábitos que te faltan. → abre Hoy.
- 🏠 **Familia**: tareas asignadas a ti. → abre Familia.
- 🎯 **Metas**: objetivos que vencen dentro de 3 días. → abre Metas.

Si solo hay un pendiente, el aviso te lleva directo a esa pantalla; si hay
varios, llega un resumen que abre el hub.

### Activar la franja de la tarde (GitHub Actions)

El plan Hobby de Vercel limita los crons, así que la 3ª franja (tarde) la dispara
un workflow ya incluido en `.github/workflows/notify-afternoon.yml`. Solo agrega
**2 secretos del repositorio** en GitHub → **Settings → Secrets and variables →
Actions → New repository secret**:

| Secreto | Valor |
|---------|-------|
| `LIFEHUB_URL` | `https://life-hub-puce.vercel.app` (sin barra final) |
| `CRON_SECRET` | el mismo valor que pusiste en Vercel |

Listo: la tarde queda cubierta gratis. Puedes probarlo a mano en GitHub →
**Actions → LifeHub · 369 tarde → Run workflow**.

### Probar el cron a mano

```bash
curl "https://tu-app.vercel.app/api/cron/notify?secret=TU_CRON_SECRET"
```

Devuelve un JSON con cuántos usuarios se notificaron.
